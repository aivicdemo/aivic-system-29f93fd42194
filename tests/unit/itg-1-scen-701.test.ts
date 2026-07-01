import { describe, test, expect } from "@jest/globals";
import { detectAnomalies } from "../../src/logic/it-1-1-1";

describe("営業成果データの自動検証ルール定義と異常検出機能", () => {
  // SCEN-701
  test("通常のデータ分布の外側にある外れ値を自動検出する", () => {
    // 正常値データセット（月間売上100万円～500万円の範囲）150件以上
    const normalData = [];
    for (let i = 0; i < 150; i++) {
      normalData.push({
        revenue: 100 + (Math.random() * 400), // 100万円～500万円
        salesRecordId: `normal_${i}`,
        transactionDate: "2024-01-15",
      });
    }

    // テストデータセット（正常値50件 + 外れ値5件）
    const testNormalData = [];
    for (let i = 0; i < 50; i++) {
      testNormalData.push({
        revenue: 150 + (Math.random() * 300), // 150万円～450万円
        salesRecordId: `test_normal_${i}`,
        transactionDate: "2024-01-15",
      });
    }

    const testAnomalousData = [
      {
        revenue: 2000, // 売上2000万円（明らかな外れ値）
        salesRecordId: "anomaly_extreme_high",
        transactionDate: "2024-01-15",
      },
      {
        revenue: -50, // マイナス値
        salesRecordId: "anomaly_negative",
        transactionDate: "2024-01-15",
      },
      {
        revenue: 5, // 極端に低い値
        salesRecordId: "anomaly_extreme_low",
        transactionDate: "2024-01-15",
      },
      {
        revenue: 1800, // 売上1800万円（外れ値）
        salesRecordId: "anomaly_high",
        transactionDate: "2024-01-15",
      },
      {
        revenue: 1, // 極端に低い値
        salesRecordId: "anomaly_very_low",
        transactionDate: "2024-01-15",
      },
    ];

    const allTestData = [...testNormalData, ...testAnomalousData];

    // 異常値検出アルゴリズムを『統計的外れ値検出（Z-score法）』に設定
    // 感度レベルを『標準（±2.5σ）』に設定
    const detectionParams = {
      algorithm: "z-score",
      sensitivityThreshold: 2.5,
      baselineData: normalData,
    };

    // 異常値検出処理を実行
    const result = detectAnomalies(allTestData, detectionParams);

    // 検出精度の検証（95%以上）
    const expectedAnomalies = 5;
    const expectedNormals = 50;
    const detectedAnomalies = result.filter((r) => r.isAnomaly === true);
    const detectedNormals = result.filter((r) => r.isAnomaly === false);

    const anomalyRecall = detectedAnomalies.length / expectedAnomalies;
    const normalPrecision = detectedNormals.length / expectedNormals;

    expect(detectedAnomalies.length).toBe(5);
    expect(detectedNormals.length).toBe(50);
    expect(anomalyRecall).toBeGreaterThanOrEqual(0.95);
    expect(normalPrecision).toBeGreaterThanOrEqual(0.95);

    // 外れ値として検出されたデータの詳細情報を検証
    detectedAnomalies.forEach((anomaly) => {
      expect(anomaly.isAnomaly).toBe(true);
      expect(typeof anomaly.deviationScore).toBe("number");
      expect(anomaly.deviationScore).toBeGreaterThan(2.5);
      expect(typeof anomaly.detectionReason).toBe("string");
      expect(anomaly.detectionReason.length).toBeGreaterThan(0);
    });

    // 検出された外れ値の sales record ID を検証
    const detectedAnomalyIds = detectedAnomalies.map((a) => a.salesRecordId);
    expect(detectedAnomalyIds).toContain("anomaly_extreme_high");
    expect(detectedAnomalyIds).toContain("anomaly_negative");
    expect(detectedAnomalyIds).toContain("anomaly_extreme_low");
    expect(detectedAnomalyIds).toContain("anomaly_high");
    expect(detectedAnomalyIds).toContain("anomaly_very_low");

    // 正常データが正しく分類されたことを検証
    detectedNormals.forEach((normal) => {
      expect(normal.isAnomaly).toBe(false);
      expect(typeof normal.deviationScore).toBe("number");
      expect(normal.deviationScore).toBeLessThanOrEqual(2.5);
    });

    // 検出精度が95%以上であることを検証
    const totalCorrect = detectedAnomalies.length + detectedNormals.length;
    const totalRecords = expectedAnomalies + expectedNormals;
    const overallAccuracy = totalCorrect / totalRecords;
    expect(overallAccuracy).toBeGreaterThanOrEqual(0.95);
  });
});