import { applyUnifiedJudgmentLogic } from "../../src/logic/it-1-br-2-2-2-1";

describe("査定員ごとの判定結果と根拠の月次集計・分析ダッシュボード", () => {
  // SCEN-1045
  test("学習データが不足している場合にロジック適用が失敗し適切なエラーを返す", () => {
    const insufficientLearningData = [
      {
        id: "data_001",
        projectId: "proj_100",
        estimateAmount: 1500000,
        workType: "土工",
        region: "東京都",
        season: "冬季",
        recordDate: "2024-01-15",
      },
      {
        id: "data_002",
        projectId: "proj_101",
        estimateAmount: 2000000,
        workType: "土工",
        region: "東京都",
        season: "冬季",
        recordDate: "2024-01-16",
      },
    ];

    const unifiedLogicConfig = {
      minLearningDataCount: 50,
      workTypeCategories: ["土工", "建築", "設備"],
      regionCategories: ["東京都", "神奈川県", "埼玉県"],
      seasonCategories: ["春季", "夏季", "秋季", "冬季"],
      allowanceRangePercentage: 10,
    };

    const estimateRecord = {
      id: "est_500",
      estimateAmount: 1600000,
      workType: "土工",
      region: "東京都",
      season: "冬季",
      quantity: 100,
      unitPrice: 16000,
    };

    const result = applyUnifiedJudgmentLogic(
      insufficientLearningData,
      unifiedLogicConfig,
      estimateRecord
    );

    expect(result).toBeDefined();
    expect(result.isError).toBe(true);
    expect(result.errorCode).toBe("INSUFFICIENT_LEARNING_DATA");
    expect(result.errorMessage).toMatch(/査定品質管理に必要な学習データが不足/);
    expect(result.currentDataCount).toBe(2);
    expect(result.requiredDataCount).toBe(50);
    expect(result.shortfallCount).toBe(48);
    expect(result.logicApplied).toBe(false);
    expect(result.judgmentResult).toBeNull();
    expect(result.detailedErrorInfo).toBeDefined();
    expect(result.detailedErrorInfo.currentCount).toBe(2);
    expect(result.detailedErrorInfo.minimumRequired).toBe(50);
    expect(result.detailedErrorInfo.missingCount).toBe(48);
  });
});