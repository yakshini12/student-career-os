import { describe, expect, it } from "vitest";
import {
  COMPLETE_BUNDLE,
  INCOMPLETE_BUNDLE,
  failedCheckLabels,
  historySummary,
  passedCount,
  runContainerizationChecks,
  validateArtifactBundle,
} from "../model/verification";
import type { ArtifactBundle, VerificationResult } from "../model/types";
import { TODAY } from "./helpers";

const BASE_DOCKERFILE = `FROM python:3.12-slim
WORKDIR /app
COPY . .
RUN pip install -r requirements.txt
EXPOSE 5000
CMD ["python", "app.py"]
`;

const BASE_README = `docker build -t campuscart .
docker run -p 5000:5000 campuscart
`;

const RUN_AT = "2026-10-26T09:00:00.000Z";

function bundle(dockerfile = BASE_DOCKERFILE, readmeCommands = BASE_README): ArtifactBundle {
  return { dockerfile, readmeCommands };
}

function run(dockerfile?: string, readmeCommands?: string): VerificationResult {
  return runContainerizationChecks(bundle(dockerfile, readmeCommands), RUN_AT);
}

function check(result: VerificationResult, id: string) {
  const match = result.checks.find((item) => item.id === id);
  if (!match) throw new Error(`Missing check ${id}`);
  return match;
}

describe("verification engine", () => {
  it("fails only Command and Port mapping on the incomplete sample", () => {
    const result = runContainerizationChecks(INCOMPLETE_BUNDLE, RUN_AT);
    expect(result.passed).toBe(false);
    expect(passedCount(result)).toBe(6);
    expect(failedCheckLabels(result)).toEqual(["Command", "Port mapping"]);
    expect(historySummary(result)).toBe("6/8 checks passed; failed: Command, Port mapping.");
  });

  it("passes all eight checks on the complete sample", () => {
    const result = runContainerizationChecks(COMPLETE_BUNDLE, RUN_AT);
    expect(result.passed).toBe(true);
    expect(passedCount(result)).toBe(8);
    expect(result.checks).toHaveLength(8);
    expect(result.runAt).toBe(RUN_AT);
    expect(historySummary(result)).toBe("8/8 checks passed.");
  });

  it("rejects a latest base image and accepts a digest", () => {
    const latest = run(BASE_DOCKERFILE.replace("python:3.12-slim", "python:latest"));
    expect(check(latest, "base_image").passed).toBe(false);
    const untagged = run(BASE_DOCKERFILE.replace("python:3.12-slim", "python"));
    expect(check(untagged, "base_image").passed).toBe(false);
    const digest = run(
      BASE_DOCKERFILE.replace("python:3.12-slim", "python:3.12-slim@sha256:abc123"),
    );
    expect(check(digest, "base_image").passed).toBe(true);
  });

  it("fails the matching check when an instruction is missing", () => {
    expect(check(run(BASE_DOCKERFILE.replace("WORKDIR /app\n", "")), "workdir").passed).toBe(false);
    expect(check(run(BASE_DOCKERFILE.replace("COPY . .\n", "")), "copy").passed).toBe(false);
    expect(
      check(run(BASE_DOCKERFILE.replace("RUN pip install -r requirements.txt\n", "")), "run").passed,
    ).toBe(false);
    const noExpose = run(BASE_DOCKERFILE.replace("EXPOSE 5000\n", ""));
    expect(check(noExpose, "expose").passed).toBe(false);
    expect(check(noExpose, "port_mapping").passed).toBe(false);
    expect(check(run(BASE_DOCKERFILE.replace('CMD ["python", "app.py"]\n', "")), "command").passed).toBe(
      false,
    );
  });

  it("rejects invalid and out-of-range exposed ports", () => {
    for (const port of ["0", "70000", "5000/udp", "not-a-port"]) {
      const result = run(BASE_DOCKERFILE.replace("EXPOSE 5000", `EXPOSE ${port}`));
      expect(check(result, "expose").passed, port).toBe(false);
      expect(check(result, "port_mapping").passed, port).toBe(false);
    }
  });

  it("fails README commands when build or run is missing", () => {
    const noBuild = run(BASE_DOCKERFILE, "docker run -p 5000:5000 campuscart\n");
    expect(check(noBuild, "readme_commands").passed).toBe(false);
    const noRun = run(BASE_DOCKERFILE, "docker build -t campuscart .\n");
    expect(check(noRun, "readme_commands").passed).toBe(false);
  });

  it("accepts each documented publish mapping form", () => {
    const readmeFor = (flag: string) =>
      `docker build -t campuscart .\ndocker run ${flag} campuscart\n`;
    const flags = [
      "-p 5000:5000",
      "-p=5000:5000",
      "-p5000:5000",
      "-p 127.0.0.1:5000:5000",
      "--publish=5000:5000",
      "-p 5000:5000/tcp",
    ];
    for (const flag of flags) {
      const result = run(BASE_DOCKERFILE, readmeFor(flag));
      expect(check(result, "port_mapping").passed, flag).toBe(true);
    }
  });

  it("fails closed on a port range", () => {
    const result = run(
      BASE_DOCKERFILE.replace("EXPOSE 5000", "EXPOSE 5000-5010"),
      "docker build -t campuscart .\ndocker run -p 5000-5010:5000-5010 campuscart\n",
    );
    expect(check(result, "expose").passed).toBe(false);
    expect(check(result, "port_mapping").passed).toBe(false);
  });

  it("ignores commented-out instructions", () => {
    const result = run(BASE_DOCKERFILE.replace("WORKDIR /app", "# WORKDIR /app"));
    expect(check(result, "workdir").passed).toBe(false);
  });

  it("joins continuation lines before inspecting them", () => {
    const continued = BASE_DOCKERFILE.replace(
      "RUN pip install -r requirements.txt",
      "RUN pip install \\\n    -r requirements.txt",
    );
    const result = run(continued);
    expect(check(result, "run").passed).toBe(true);
    expect(result.passed).toBe(true);
  });

  it("rejects empty and oversized bundle fields", () => {
    expect(validateArtifactBundle({ dockerfile: "", readmeCommands: "" }).errors).toEqual({
      dockerfile: "Dockerfile is required.",
      readmeCommands: "README build and run commands are required.",
    });
    const oversized = validateArtifactBundle({
      dockerfile: "a".repeat(20_001),
      readmeCommands: "b".repeat(20_001),
    });
    expect(oversized.errors.dockerfile).toBeDefined();
    expect(oversized.errors.readmeCommands).toBeDefined();
    expect(validateArtifactBundle(COMPLETE_BUNDLE).errors).toEqual({});
    expect(TODAY).toBe("2026-10-26");
  });
});
