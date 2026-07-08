import { describe, test, expect, beforeEach } from "@jest/globals";
import { recordManualJudgmentAndLearnFromDifference } from "../../src/logic/it-6-2-2-2";

describe("査定員別の判定精度・乖離パターン分析ダッシュボード", () => {
  // SCEN-796
  test("AI自動判定結果と査定員手動判定が異なる場合、査定員判定が優先され理由が記録される", () => {
    // ====== 入力データ準備 ======
    const assessmentCaseId = "CASE-20240515-001";
    const aiAutoJudgmentResult = {
      judgmentId: "AUTO-001",
      estimateAmount: 5000000,
      marketAbilityRatePercent: 95,
      deviationAmountYen: 250000,
      confidenceScore: 85,
      judgment: "APPROVED"
    };
    const assessorManualJudgment = {
      judgmentId: "MANUAL-001",
      estimateAmount: 5000000,
      judgment: "REJECTED",
      reasonText: "地域の季節変動が未反映されており、適正金額は4,800,000円が妥当。当該見積は過大である。",
      assessorId: "ASSESSOR-0042",
      judgedAtIso: "2024-05-15T14:30:00Z"
    };

    // ====== 関数実行 ======
    const result = recordManualJudgmentAndLearnFromDifference({
      assessmentCaseId,
      aiAutoJudgmentResult,
      assessorManualJudgment
    });

    // ====== 期待値の検証 ======
    // ①手動判定がシステムの最終判定として記録される
    expect(result.finalJudgment).toBe("REJECTED");
    expect(result.finalJudgmentSource).toBe("ASSESSOR_MANUAL");

    // ②AI自動判定との差分が判定比較ログに記録される
    expect(result.judgedDifference).toEqual({
      isDifferent: true,
      autoJudgment: "APPROVED",
      manualJudgment: "REJECTED",
      differenceType: "JUDGMENT_REVERSED"
    });

    // ③査定員が入力した理由が理由フィールドに正確に保存される
    expect(result.assessorReasonText).toBe(
      "地域の季節変動が未反映されており、適正金額は4,800,000円が妥当。当該見積は過大である。"
    );

    // ④該当レコードが学習データ改善キューに追加される
    expect(result.isAddedToLearningQueue).toBe(true);
    expect(result.learningQueuePriority).toBe("HIGH");
    expect(result.learningQueueCategory).toBe("JUDGMENT_REVERSAL");

    // ====== 追加検証: 記録の整合性 ======
    expect(result.assessmentCaseId).toBe(assessmentCaseId);
    expect(result.assessorId).toBe("ASSESSOR-0042");
    expect(result.recordedAtIso).toBeDefined();
    expect(typeof result.recordedAtIso).toBe("string");

    // ====== エラーケース: 必須フィールド不足 ======
    expect(() =>
      recordManualJudgmentAndLearnFromDifference({
        assessmentCaseId,
        aiAutoJudgmentResult,
        assessorManualJudgment: {
          judgmentId: "MANUAL-002",
          estimateAmount: 5000000,
          judgment: "REJECTED",
          reasonText: "", // 理由が空文字
          assessorId: "ASSESSOR-0043",
          judgedAtIso: "2024-05-15T14:45:00Z"
        }
      })
    ).toThrow(/理由/);

    // ====== エラーケース: 同一判定（差分なし） ======
    const resultNoDifference = recordManualJudgmentAndLearnFromDifference({
      assessmentCaseId: "CASE-20240515-002",
      aiAutoJudgmentResult: {
        judgmentId: "AUTO-002",
        estimateAmount: 3000000,
        marketAbilityRatePercent: 92,
        deviationAmountYen: 180000,
        confidenceScore: 88,
        judgment: "APPROVED"
      },
      assessorManualJudgment: {
        judgmentId: "MANUAL-003",
        estimateAmount: 3000000,
        judgment: "APPROVED",
        reasonText: "AI判定と一致。適正である。",
        assessorId: "ASSESSOR-0044",
        judgedAtIso: "2024-05-15T15:00:00Z"
      }
    });

    // 同一判定の場合、学習キューに追加されない
    expect(resultNoDifference.isDifferent).toBe(false);
    expect(resultNoDifference.isAddedToLearningQueue).toBe(false);
  });
});