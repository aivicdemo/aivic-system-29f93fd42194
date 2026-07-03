import { evaluateNewStaffCompetency } from "../../src/logic/it-1-2-1";

describe("新入スタッフ到達度評価機能", () => {
  // SCEN-1069
  test("3業務のうち1つでも不合格基準に該当する場合に不合格判定される", () => {
    const evaluation_input = {
      staff_id: "STAFF_001",
      staff_name: "田中太郎",
      evaluation_date: "2024-02-15",
      task_a_score: 85,
      task_b_score: 82,
      task_c_score: 75,
    };

    const result = evaluateNewStaffCompetency(evaluation_input);

    expect(result.final_judgment).toBe("不合格");
    expect(result.pass_threshold).toBe(80);
    expect(result.task_evaluations).toHaveLength(3);

    const task_c_eval = result.task_evaluations.find(
      (t) => t.task_name === "業務C"
    );
    expect(task_c_eval).toBeDefined();
    expect(task_c_eval?.score).toBe(75);
    expect(task_c_eval?.status).toBe("不合格");
    expect(task_c_eval?.reason).toMatch(/80点未満/);

    const task_a_eval = result.task_evaluations.find(
      (t) => t.task_name === "業務A"
    );
    expect(task_a_eval?.status).toBe("合格");

    const task_b_eval = result.task_evaluations.find(
      (t) => t.task_name === "業務B"
    );
    expect(task_b_eval?.status).toBe("合格");

    expect(result.failure_reason).toContain("業務C");
    expect(result.failure_reason).toMatch(/不合格基準/);

    const summary = result.evaluation_summary;
    expect(summary).toContain("田中太郎");
    expect(summary).toContain("不合格");
    expect(summary).toContain("業務C");
  });
});