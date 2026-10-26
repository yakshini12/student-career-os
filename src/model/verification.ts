import type {
  ArtifactBundle,
  VerificationCheck,
  VerificationResult,
} from "./types";

export interface DockerInstruction {
  op: string;
  args: string;
}

export interface ArtifactValidationResult {
  errors: Record<string, string>;
}

export function validateArtifactBundle(bundle: ArtifactBundle): ArtifactValidationResult {
  const errors: Record<string, string> = {};
  if (!bundle.dockerfile.trim()) {
    errors.dockerfile = "Dockerfile is required.";
  } else if (bundle.dockerfile.length > 20_000) {
    errors.dockerfile = "Dockerfile must be 20,000 characters or fewer.";
  }
  if (!bundle.readmeCommands.trim()) {
    errors.readmeCommands = "README build and run commands are required.";
  } else if (bundle.readmeCommands.length > 20_000) {
    errors.readmeCommands = "README commands must be 20,000 characters or fewer.";
  }
  return { errors };
}

export function parseDockerfile(text: string): DockerInstruction[] {
  const lines = text.split(/\r?\n/);
  const logical: string[] = [];
  let current = "";

  for (const line of lines) {
    if (/^\s*#/.test(line)) continue;
    const fragment = line.trim();
    if (!fragment && !current) continue;
    current = current ? `${current} ${fragment}` : fragment;
    if (/\\\s*$/.test(current)) {
      current = current.replace(/\\\s*$/, "").trimEnd();
      continue;
    }
    if (current) {
      logical.push(current);
      current = "";
    }
  }
  if (current) logical.push(current);

  return logical
    .map((line) => {
      const match = /^(\S+)\s*(.*)$/.exec(line);
      if (!match) return null;
      return { op: match[1].toUpperCase(), args: match[2].trim() };
    })
    .filter((instruction): instruction is DockerInstruction => instruction !== null);
}

function firstFrom(instructions: DockerInstruction[]): string | null {
  return instructions.find((instruction) => instruction.op === "FROM")?.args ?? null;
}

function imageIsPinned(fromArgs: string): boolean {
  const tokens = fromArgs.split(/\s+/).filter((token) => token && !token.startsWith("--"));
  const image = tokens[0] ?? "";
  if (!image) return false;
  if (image.includes("@sha256:")) return true;
  const lastSegment = image.split("/").at(-1) ?? "";
  if (!lastSegment.includes(":")) return false;
  const tag = lastSegment.split(":").at(-1) ?? "";
  return tag.length > 0 && tag !== "latest";
}

function copyHasSourceAndDestination(args: string): boolean {
  if (args.trim().startsWith("[")) {
    try {
      const parsed: unknown = JSON.parse(args);
      return Array.isArray(parsed) && parsed.length >= 2;
    } catch {
      return false;
    }
  }
  const tokens = args.split(/\s+/).filter((token) => token && !token.startsWith("--"));
  return tokens.length >= 2;
}

function exposedTcpPorts(instructions: DockerInstruction[]): number[] {
  const ports: number[] = [];
  for (const instruction of instructions.filter((item) => item.op === "EXPOSE")) {
    for (const token of instruction.args.split(/\s+/)) {
      if (!token) continue;
      const match = /^(\d+)(?:\/(tcp|udp))?$/i.exec(token);
      if (!match) continue;
      const port = Number(match[1]);
      if (port < 1 || port > 65_535) continue;
      if ((match[2] ?? "tcp").toLowerCase() === "udp") continue;
      ports.push(port);
    }
  }
  return [...new Set(ports)];
}

function lastCommand(instructions: DockerInstruction[]): string | null {
  const command = [...instructions]
    .reverse()
    .find((instruction) => instruction.op === "CMD" || instruction.op === "ENTRYPOINT");
  return command?.args ?? null;
}

export function normalizeReadme(text: string): string {
  return text.toLowerCase().replace(/\s+/g, " ").trim();
}

function publishMappings(readme: string): string[] {
  const mappings: string[] = [];
  const patterns = [
    /--publish(?:=|\s+)([^\s]+)/g,
    /-p(?:=|\s+)([^\s]+)/g,
    /-p([0-9][^\s]*)/g,
  ];
  for (const pattern of patterns) {
    let match: RegExpExecArray | null;
    while ((match = pattern.exec(readme)) !== null) {
      mappings.push(match[1]);
    }
  }
  return mappings;
}

function publishedContainerPorts(readme: string): { ports: number[]; inspected: string } {
  const mappings = publishMappings(readme);
  const ports: number[] = [];
  for (const mapping of mappings) {
    const withoutProtocol = mapping.replace(/\/(tcp|udp)$/i, "");
    if (/\/udp$/i.test(mapping)) continue;
    if (withoutProtocol.includes("-") || withoutProtocol.includes("[") || withoutProtocol.includes("]")) {
      continue;
    }
    const parts = withoutProtocol.split(":");
    if (parts.length !== 2 && parts.length !== 3) continue;
    const containerPort = Number(parts.at(-1));
    if (!Number.isInteger(containerPort) || containerPort < 1 || containerPort > 65_535) continue;
    ports.push(containerPort);
  }
  return { ports, inspected: mappings[0] ?? "No docker run publish flag" };
}

function check(
  id: string,
  label: string,
  passed: boolean,
  inspected: string,
  reason: string,
): VerificationCheck {
  return { id, label, passed, inspected, reason };
}

export function runContainerizationChecks(
  bundle: ArtifactBundle,
  runAt = new Date().toISOString(),
): VerificationResult {
  const instructions = parseDockerfile(bundle.dockerfile);
  const fromArgs = firstFrom(instructions);
  const exposed = exposedTcpPorts(instructions);
  const readme = normalizeReadme(bundle.readmeCommands);
  const published = publishedContainerPorts(readme);
  const readmePass = readme.includes("docker build") && readme.includes("docker run");
  const command = lastCommand(instructions);
  const commandPass = Boolean(command && command.trim() && command.trim() !== "[]");
  const exposePass = exposed.length > 0;
  const mappingPass =
    exposePass && published.ports.some((port) => exposed.includes(port));

  const checks: VerificationCheck[] = [
    check(
      "base_image",
      "Base image tag",
      fromArgs !== null && imageIsPinned(fromArgs),
      fromArgs ? `FROM ${fromArgs}` : "No FROM instruction",
      fromArgs === null
        ? "The Dockerfile needs a FROM instruction."
        : imageIsPinned(fromArgs)
          ? "The base image is pinned by a digest or a non-latest tag."
          : "Use a digest or a non-latest tag; untagged, latest, and registry-port-only images fail.",
    ),
    check(
      "workdir",
      "Workdir",
      instructions.some((instruction) => instruction.op === "WORKDIR" && instruction.args.length > 0),
      instructions.find((instruction) => instruction.op === "WORKDIR")?.args ?? "No WORKDIR",
      instructions.some((instruction) => instruction.op === "WORKDIR" && instruction.args.length > 0)
        ? "A working directory is declared."
        : "Add a WORKDIR instruction with a path.",
    ),
    check(
      "copy",
      "Copy",
      instructions.some((instruction) => instruction.op === "COPY" && copyHasSourceAndDestination(instruction.args)),
      instructions.find((instruction) => instruction.op === "COPY")?.args ?? "No COPY",
      instructions.some((instruction) => instruction.op === "COPY" && copyHasSourceAndDestination(instruction.args))
        ? "A source and destination are present."
        : "Add a COPY with at least a source and destination.",
    ),
    check(
      "run",
      "Run",
      instructions.some((instruction) => instruction.op === "RUN" && instruction.args.length > 0),
      instructions.find((instruction) => instruction.op === "RUN")?.args ?? "No RUN",
      instructions.some((instruction) => instruction.op === "RUN" && instruction.args.length > 0)
        ? "A build command is present."
        : "Add a RUN instruction with arguments.",
    ),
    check(
      "expose",
      "Expose",
      exposePass,
      exposed.length > 0 ? `EXPOSE ${exposed.join(" ")}` : "No valid TCP EXPOSE",
      exposePass
        ? "At least one valid TCP port is exposed."
        : "Add EXPOSE with a TCP port from 1 to 65535.",
    ),
    check(
      "command",
      "Command",
      commandPass,
      command ? `CMD/ENTRYPOINT ${command}` : "No CMD or ENTRYPOINT",
      commandPass
        ? "A final command or entrypoint is present."
        : "Add a CMD or ENTRYPOINT with non-empty arguments.",
    ),
    check(
      "readme_commands",
      "README commands",
      readmePass,
      readmePass ? "docker build + docker run" : readme || "No README commands",
      readmePass
        ? "The README includes both build and run commands."
        : "Include both docker build and docker run commands.",
    ),
    check(
      "port_mapping",
      "Port mapping",
      mappingPass,
      published.inspected,
      mappingPass
        ? "A published container port matches an exposed TCP port."
        : exposePass
          ? "Publish an exposed TCP port with -p or --publish; only TCP mappings count."
          : "Port mapping cannot pass without a valid EXPOSE.",
    ),
  ];

  return {
    checks,
    passed: checks.every((item) => item.passed),
    runAt,
  };
}

export function passedCount(result: VerificationResult): number {
  return result.checks.filter((item) => item.passed).length;
}

export function failedCheckLabels(result: VerificationResult): string[] {
  return result.checks.filter((item) => !item.passed).map((item) => item.label);
}

export function historySummary(result: VerificationResult): string {
  const failed = failedCheckLabels(result);
  if (failed.length === 0) return "8/8 checks passed.";
  return `${passedCount(result)}/8 checks passed; failed: ${failed.join(", ")}.`;
}

export const INCOMPLETE_BUNDLE: ArtifactBundle = {
  dockerfile: `FROM python:3.12-slim
WORKDIR /app
COPY . .
RUN pip install -r requirements.txt
EXPOSE 5000
`,
  readmeCommands: `docker build -t campuscart .
docker run -p 8000:8000 campuscart
`,
};

export const COMPLETE_BUNDLE: ArtifactBundle = {
  dockerfile: `FROM python:3.12-slim
WORKDIR /app
COPY . .
RUN pip install -r requirements.txt
EXPOSE 5000
CMD ["python", "app.py"]
`,
  readmeCommands: `docker build -t campuscart .
docker run -p 5000:5000 campuscart
`,
};
