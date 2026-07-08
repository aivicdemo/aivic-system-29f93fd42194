import { calculateJudgmentVariationRate } from "../../src/logic/it-1-br-6-2-1";

describe("査定員別の判定ばらつき率と相場乖離傾向の自動集計・分析", () => {
  // SCEN-1307: [normal] 判定ばらつき率の算出 - 5名の査定員の判定結果が最大限にばらついた場合、ばらつき率が正確に計算される
  test("should calculate judgment variation rate at 100% when 5 assessors provide completely different judgments", () => {
    const assessmentTargetId = "target-001";
    const assessorJudgments = [
      {
        assessorId: "assessor-A",
        assessorName: "査定員A",
        judgmentGrade: "S",
      },
      {
        assessorId: "assessor-B",
        assessorName: "査定員B",
        judgmentGrade: "A",
      },
      {
        assessorId: "assessor-C",
        assessorName: "査定員C",
        judgmentGrade: "B",
      },
      {
        assessorId: "assessor-D",
        assessorName: "査定員D",
        judgmentGrade: "C",
      },
      {
        assessorId: "assessor-E",
        assessorName: "査定員E",
        judgmentGrade: "D",
      },
    ];

    const result = calculateJudgmentVariationRate({
      assessmentTargetId,
      assessorJudgments,
    });

    expect(result.variationRate).toBe(100);
    expect(result.assessmentTargetId).toBe("target-001");
    expect(result.totalAssessors).toBe(5);
    expect(result.uniqueGrades).toEqual(["S", "A", "B", "C", "D"]);
    expect(result.uniqueGradeCount).toBe(5);
    expect(result.calculationMethod).toBe("max_variation_formula");
  });
});