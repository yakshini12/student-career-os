import type { DsaCalculation, PracticeTopic } from "../model/types";

const topicLabels: Record<PracticeTopic, string> = {
  arrays: "Arrays",
  strings: "Strings",
  trees: "Trees",
  linkedLists: "Linked lists",
  graphs: "Graphs",
  dp: "Dynamic programming",
};

function PassMark({ pass }: { pass: boolean }) {
  return (
    <span className={pass ? "calc-pass" : "calc-fail"}>{pass ? "Pass" : "Fail"}</span>
  );
}

export function DsaCalculation({ calculation }: { calculation: DsaCalculation }) {
  return (
    <div className="dsa-calculation">
      <table className="calc-table">
        <caption>DSA threshold calculation</caption>
        <thead>
          <tr>
            <th scope="col">Threshold</th>
            <th scope="col">Required</th>
            <th scope="col">Recorded</th>
            <th scope="col">Outcome</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <th scope="row">Total problems solved</th>
            <td>120 or more</td>
            <td>{calculation.totalSolved}</td>
            <td>
              <PassMark pass={calculation.totalSolvedPass} />
            </td>
          </tr>
          <tr>
            <th scope="row">Core topics with 10+ solves</th>
            <td>{calculation.coreTopicsRequired} or more of 6</td>
            <td>{calculation.coreTopicCount}</td>
            <td>
              <PassMark pass={calculation.coreTopicsPass} />
            </td>
          </tr>
          <tr>
            <th scope="row">Contests completed</th>
            <td>3 or more</td>
            <td>{calculation.contests}</td>
            <td>
              <PassMark pass={calculation.contestsPass} />
            </td>
          </tr>
        </tbody>
      </table>
      <table className="calc-table topic-table">
        <caption>Core topic counts · 10+ required per topic</caption>
        <thead>
          <tr>
            <th scope="col">Topic</th>
            <th scope="col">Solved</th>
            <th scope="col">At 10+</th>
          </tr>
        </thead>
        <tbody>
          {(Object.keys(topicLabels) as PracticeTopic[]).map((topic) => (
            <tr key={topic}>
              <th scope="row">{topicLabels[topic]}</th>
              <td>{calculation.topics[topic]}</td>
              <td>
                <PassMark pass={calculation.topics[topic] >= 10} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="calc-note">
        SQL problems count toward total solved only, not toward the six core topics. Practice is
        read-only in this prototype.
      </p>
    </div>
  );
}
