import { recordJudgmentBasis } from "../../src/logic/it-6-3-1";

describe("判定根拠自動記録機能", () => {
  // SCEN-845: [normal] 判定根拠自動記録機能 - 査定員が修正指示を入力した時点で乖離額・乖離率・参照データ・適用ロジックが全て記録される
  test("修正指示入力完了時に乖離額・乖離率・参照データ・適用ロジックが記録される", () => {
    const assessmentBeforeAmount = 1000000;
    const assessmentAfterAmount = 950000;
    const referenceMarketData = {
      marketPrice: 980000,
      dataSource: "物価本2024年1月版",
      similarCaseCount: 5,
      region: "東京都",
      constructionType: "躯体工事",
    };
    const appliedLogic = {
      logicId: "LOGIC_001",
      logicName: "地域別季節補正ロジック",
      correctionFactor: 0.95,
      parameters: {
        region: "東京都",
        season: "冬期",
        adjustmentRate: -5,
      },
    };
    const modificationReasonText = "東京都の冬期相場を考慮して5%減額";
    const recordTimestamp = new Date("2024-01-15T14:30:00Z");

    const result = recordJudgmentBasis({
      caseId: "CASE_20240115_001",
      assessorId: "ASSESSOR_123",
      assessorName: "山田太郎",
      assessmentBeforeAmount,
      assessmentAfterAmount,
      modificationReasonText,
      referenceMarketData,
      appliedLogic,
      recordTimestamp,
    });

    const expectedDivergenceAmount = assessmentBeforeAmount - assessmentAfterAmount;
    const expectedDivergenceRate =
      (expectedDivergenceAmount / assessmentBeforeAmount) * 100;

    expect(result.recordId).toBeDefined();
    expect(result.recordId).toMatch(/^REC_/);

    expect(result.divergenceAmount).toBe(expectedDivergenceAmount);
    expect(result.divergenceAmount).toBe(50000);

    expect(result.divergenceRate).toBeCloseTo(expectedDivergenceRate, 2);
    expect(result.divergenceRate).toBeCloseTo(5.0, 2);

    expect(result.referenceData).toEqual(referenceMarketData);
    expect(result.referenceData.marketPrice).toBe(980000);
    expect(result.referenceData.dataSource).toBe("物価本2024年1月版");
    expect(result.referenceData.region).toBe("東京都");
    expect(result.referenceData.constructionType).toBe("躯体工事");

    expect(result.appliedLogic).toEqual(appliedLogic);
    expect(result.appliedLogic.logicId).toBe("LOGIC_001");
    expect(result.appliedLogic.logicName).toBe("地域別季節補正ロジック");
    expect(result.appliedLogic.correctionFactor).toBe(0.95);

    expect(result.recordedAt).toEqual(recordTimestamp);
    expect(result.recordedAt).toEqual(new Date("2024-01-15T14:30:00Z"));

    expect(result.caseId).toBe("CASE_20240115_001");
    expect(result.assessorId).toBe("ASSESSOR_123");
    expect(result.assessorName).toBe("山田太郎");
    expect(result.modificationReasonText).toBe(
      "東京都の冬期相場を考慮して5%減額"
    );

    expect(result.status).toBe("recorded");
    expect(result.isValid).toBe(true);
  });
});