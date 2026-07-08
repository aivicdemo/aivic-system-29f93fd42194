import { describe, test, expect } from "@jest/globals";
import { calculateMonthlyProcessingCapacity } from "../../src/logic/it-6-2-1-1";

describe("IT-6-2-1-1: 月次処理能力の算出（外れ値除外・補正）", () => {
  // SCEN-952: 極端に高い処理時間が複数存在する場合に外れ値判定が正しく機能する
  test("should correctly detect and exclude outliers with IQR method and return adjusted processing capacity", () => {
    // Arrange: テストデータとして30件以上の処理時間データを準備
    // 正常なデータ: 平均30分、標準偏差5分の分布
    const normalProcessingTimes = [
      25, 28, 29, 30, 31, 32, 33, 26, 27, 29, 28, 30, 31, 29, 30, 32, 27, 28,
      29, 30, 26, 31, 32, 28, 30, 29, 27, 31, 30, 28,
    ];

    // 外れ値: 平均の3倍以上（90分以上）
    const outliers = [95, 105, 98];

    // 全データセット: 正常データ30件 + 外れ値3件 = 33件
    const allProcessingTimes = [...normalProcessingTimes, ...outliers];

    const input = {
      processingTimeMinutes: allProcessingTimes,
      evaluatorId: "EVAL-001",
      evaluationMonth: "2024-01",
      outlierDetectionMethod: "IQR" as const,
      iqrMultiplier: 1.5,
    };

    // Act: 外れ値除外・補正機能を実行
    const result = calculateMonthlyProcessingCapacity(input);

    // Assert: 外れ値が正しく検出されたことを確認
    expect(result.detectedOutliers.count).toBe(3);
    expect(result.detectedOutliers.values).toEqual([95, 105, 98]);
    expect(result.detectedOutliers.method).toBe("IQR");

    // 外れ値の判定基準（Q1, Q3, IQR）を確認
    // 正常データのみで四分位数を計算
    const sortedNormal = [...normalProcessingTimes].sort((a, b) => a - b);
    const q1Index = Math.floor(sortedNormal.length * 0.25);
    const q3Index = Math.floor(sortedNormal.length * 0.75);
    const q1 = sortedNormal[q1Index]; // 約28
    const q3 = sortedNormal[q3Index]; // 約31
    const iqr = q3 - q1; // 約3
    const lowerBound = q1 - 1.5 * iqr;
    const upperBound = q3 + 1.5 * iqr;

    expect(result.detectedOutliers.criteria).toEqual({
      method: "IQR",
      q1: expect.any(Number),
      q3: expect.any(Number),
      iqr: expect.any(Number),
      lowerBound: expect.any(Number),
      upperBound: expect.any(Number),
    });

    // 外れ値を除外した後の処理時間統計を確認
    expect(result.adjustedStatistics.count).toBe(30);
    expect(result.adjustedStatistics.mean).toBeCloseTo(29.5, 1);
    expect(result.adjustedStatistics.median).toBeCloseTo(29.5, 1);
    expect(result.adjustedStatistics.stddev).toBeCloseTo(1.8, 1);
    expect(result.adjustedStatistics.min).toBe(25);
    expect(result.adjustedStatistics.max).toBe(33);

    // 補正前後の月次処理能力を比較
    // 補正前: (25+28+...+98+105+95) / 33 = 994 / 33 ≈ 30.12分
    const unadjustedMean =
      allProcessingTimes.reduce((a, b) => a + b, 0) / allProcessingTimes.length;
    expect(result.statistics.unadjustedMean).toBeCloseTo(unadjustedMean, 1);

    // 補正後: (25+28+...+33) / 30 ≈ 29.5分
    expect(result.statistics.adjustedMean).toBeCloseTo(29.5, 1);

    // 外れ値除外による補正が適切に反映されていることを確認
    expect(result.statistics.adjustmentImpact).toBeCloseTo(
      unadjustedMean - result.statistics.adjustedMean,
      2
    );

    // 補正後の処理能力値が業務上妥当な範囲内であることを検証
    // 期待される正常な処理時間: 20～40分の範囲
    expect(result.statistics.adjustedMean).toBeGreaterThan(20);
    expect(result.statistics.adjustedMean).toBeLessThan(40);

    // 補正ログに検出された外れ値の詳細が記録されていることを確認
    expect(result.correctionLog).toBeDefined();
    expect(result.correctionLog.outlierCount).toBe(3);
    expect(result.correctionLog.outlierValues).toEqual([95, 105, 98]);
    expect(result.correctionLog.detectionMethod).toBe("IQR");
    expect(result.correctionLog.criteria).toBeDefined();
    expect(
      result.correctionLog.criteria.upperThreshold
    ).toBeGreaterThan(33);

    // 補正ログの記録タイムスタンプと処理結果の記録
    expect(result.correctionLog.timestamp).toBeDefined();
    expect(result.correctionLog.processedBy).toBe("EVAL-001");
    expect(result.correctionLog.evaluationMonth).toBe("2024-01");

    // 外れ値除外による推奨事項が記録されていることを確認
    expect(result.recommendations).toBeDefined();
    expect(result.recommendations.length).toBeGreaterThan(0);
    // 外れ値が3件検出された場合、異常検知アラートまたは詳細分析推奨があるはず
    expect(result.recommendations).toContain(
      expect.stringMatching(/outlier|外れ値|異常/)
    );

    // 補正後の月次処理能力が妥当な業務基準を満たしていることを確認
    expect(result.monthlyProcessingCapacity).toBeDefined();
    expect(result.monthlyProcessingCapacity.adjustedAverageTimeMinutes).toBeCloseTo(
      29.5,
      1
    );
    expect(
      result.monthlyProcessingCapacity.excludedOutlierCount
    ).toBe(3);
    expect(result.monthlyProcessingCapacity.isValidForOperationalUse).toBe(true);
  });
});