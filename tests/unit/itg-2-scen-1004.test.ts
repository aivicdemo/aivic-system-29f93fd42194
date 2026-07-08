import { calculateDivergenceJudgment } from "../../src/logic/it-6-2-2-1";

describe("相場乖離根拠データの総合判定 - 廃止予定ロジック警告", () => {
  test("SCEN-1004: 適用ロジックが廃止予定の場合、旧ロジック使用による判定NG警告が表示される", () => {
    // 準備: 適用ロジックが「廃止予定」のテストデータ
    const divergenceData = {
      estimateId: "EST-2024-001",
      divergenceRate: 12.5,
      divergenceAmount: 250000,
      referenceDataCount: 45,
      priceSourceId: "PRICE-2024-01",
      appliedLogicId: "LOGIC-DEPRECATED-001",
      appliedLogicStatus: "deprecated",
      correctionCoefficient: 1.05,
      applicableLogics: [
        {
          logicId: "LOGIC-DEPRECATED-001",
          logicStatus: "deprecated",
          retirementDate: "2024-06-30",
          isCurrentlyApplied: true,
        },
        {
          logicId: "LOGIC-ACTIVE-001",
          logicStatus: "active",
          isCurrentlyApplied: false,
        },
      ],
    };

    // 実行: 廃止予定ロジックを使用した総合判定
    const result = calculateDivergenceJudgment(divergenceData);

    // 検証: 判定結果が警告フラグを含む
    expect(result.judgmentResult).toBe("CONDITIONAL_PASS");
    expect(result.hasDeprecatedLogicWarning).toBe(true);
    expect(result.warningMessage).toMatch(/廃止予定/);

    // 検証: 警告メッセージに廃止予定ロジックの情報を含む
    expect(result.warningMessage).toMatch(/LOGIC-DEPRECATED-001/);
    expect(result.warningMessage).toMatch(/2024-06-30/);

    // 検証: 旧ロジックを使用した判定であることを示す
    expect(result.warningDetails).toEqual({
      deprecatedLogicId: "LOGIC-DEPRECATED-001",
      recommendedLogicId: "LOGIC-ACTIVE-001",
      retirementDate: "2024-06-30",
      alternativeLogicExists: true,
    });

    // 検証: 判定結果は成立するが、監査証跡に警告フラグが記録される
    expect(result.auditTrail).toMatchObject({
      logicApplied: "LOGIC-DEPRECATED-001",
      logicStatusAtApply: "deprecated",
      warningRecorded: true,
      warningTimestamp: expect.any(String),
    });
  });
});