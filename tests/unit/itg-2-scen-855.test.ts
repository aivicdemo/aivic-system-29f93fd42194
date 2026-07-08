import { identifyDeviationPatterns } from "../../src/logic/it-6-2-2-2";

describe("判定逸脱パターン特定機能", () => {
  test("SCEN-855: 判定基準の下限閾値を1円未満に設定した場合、逸脱判定が正確に行われる", () => {
    // 前提条件: 判定基準の下限閾値が1円未満（0.5円）に設定されている
    const criteria = {
      lowerThresholdYen: 0.5,
      upperThresholdYen: 1000000,
      deviationTolerancePercent: 10,
    };

    // テスト対象: 下限閾値0.5円未満の査定案件データセット
    const testCases = [
      {
        caseId: "case-001",
        evaluatedAmountYen: 0.3,
        description: "0.3円（下限0.5円未満）",
      },
      {
        caseId: "case-002",
        evaluatedAmountYen: 0.5,
        description: "0.5円（下限閾値と同値）",
      },
      {
        caseId: "case-003",
        evaluatedAmountYen: 0.9,
        description: "0.9円（下限閾値0.5円より大きく、1円未満）",
      },
      {
        caseId: "case-004",
        evaluatedAmountYen: 1.0,
        description: "1.0円（1円）",
      },
      {
        caseId: "case-005",
        evaluatedAmountYen: 0.0,
        description: "0.0円（ゼロ）",
      },
    ];

    // 期待結果の定義
    const expectedResults = {
      "case-001": {
        isDeviation: true,
        deviationReason: "下限閾値未満",
        deviationFlagSet: true,
      },
      "case-002": {
        isDeviation: false,
        deviationReason: null,
        deviationFlagSet: false,
      },
      "case-003": {
        isDeviation: false,
        deviationReason: null,
        deviationFlagSet: false,
      },
      "case-004": {
        isDeviation: false,
        deviationReason: null,
        deviationFlagSet: false,
      },
      "case-005": {
        isDeviation: true,
        deviationReason: "下限閾値未満",
        deviationFlagSet: true,
      },
    };

    // 各テストケースを評価して結果を検証
    testCases.forEach((testCase) => {
      const result = identifyDeviationPatterns({
        evaluatedAmountYen: testCase.evaluatedAmountYen,
        lowerThresholdYen: criteria.lowerThresholdYen,
        upperThresholdYen: criteria.upperThresholdYen,
        deviationTolerancePercent: criteria.deviationTolerancePercent,
      });

      const expected = expectedResults[testCase.caseId];

      // 逸脱判定の正確性を検証
      expect(result.isDeviation).toBe(expected.isDeviation);

      // 逸脱フラグが正しく立てられていることを検証
      expect(result.deviationFlagSet).toBe(expected.deviationFlagSet);

      // 逸脱原因が適切に記録されていることを検証
      expect(result.deviationReason).toBe(expected.deviationReason);

      // ケースIDが正しく保持されていることを検証
      expect(result.caseId).toBe(testCase.caseId);
    });

    // 複数ケースを一括入力した場合の処理を検証
    const batchResult = identifyDeviationPatterns({
      evaluatedAmountYen: 0.3,
      lowerThresholdYen: 0.5,
      upperThresholdYen: 1000000,
      deviationTolerancePercent: 10,
      processBatch: true,
      batchData: testCases.map((tc) => ({
        caseId: tc.caseId,
        evaluatedAmountYen: tc.evaluatedAmountYen,
      })),
    });

    // バッチ処理結果から逸脱件数を集計
    const deviationCount = batchResult.results.filter(
      (r: { isDeviation: boolean }) => r.isDeviation
    ).length;

    // 逸脱件数が2件（case-001とcase-005）であることを検証
    expect(deviationCount).toBe(2);

    // 逸脱フラグが立てられた件数を検証
    const flaggedCount = batchResult.results.filter(
      (r: { deviationFlagSet: boolean }) => r.deviationFlagSet
    ).length;
    expect(flaggedCount).toBe(2);

    // バッチ処理全体のサマリー情報を検証
    expect(batchResult.summary.totalProcessed).toBe(5);
    expect(batchResult.summary.deviationDetected).toBe(2);
    expect(batchResult.summary.deviationRate).toBe(0.4);

    // 逸脱原因の内訳を検証
    const reasonDistribution = batchResult.summary.reasonDistribution;
    expect(reasonDistribution["下限閾値未満"]).toBe(2);
  });
});