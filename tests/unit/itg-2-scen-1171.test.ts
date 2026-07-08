import { calculatePrecisionImprovementVisualization } from "../../src/logic/it-6-2-1-1";

describe("精度改善度可視化 - モデル更新前後の精度指標を数値とグラフで可視化", () => {
  test("SCEN-1171: モデル更新前後の精度指標が数値とグラフで正確に可視化され、改善度が定量的に表示される", () => {
    // Arrange: モデル更新前のデータセット
    const preUpdateDataset = {
      accuracy: 0.7850,
      precision: 0.8120,
      recall: 0.7650,
      f1Score: 0.7880,
      areaUnderCurve: 0.8350
    };

    // モデル更新後のデータセット
    const postUpdateDataset = {
      accuracy: 0.8320,
      precision: 0.8580,
      recall: 0.8150,
      f1Score: 0.8360,
      areaUnderCurve: 0.8720
    };

    // Act: 精度改善度可視化関数を実行
    const result = calculatePrecisionImprovementVisualization(
      preUpdateDataset,
      postUpdateDataset
    );

    // Assert: モデル更新前の精度指標が数値で正確に表示される
    expect(result.preUpdateMetrics.accuracy).toBe(0.79);
    expect(result.preUpdateMetrics.precision).toBe(0.81);
    expect(result.preUpdateMetrics.recall).toBe(0.77);
    expect(result.preUpdateMetrics.f1Score).toBe(0.79);
    expect(result.preUpdateMetrics.areaUnderCurve).toBe(0.84);

    // Assert: モデル更新後の精度指標が数値で正確に表示される
    expect(result.postUpdateMetrics.accuracy).toBe(0.83);
    expect(result.postUpdateMetrics.precision).toBe(0.86);
    expect(result.postUpdateMetrics.recall).toBe(0.82);
    expect(result.postUpdateMetrics.f1Score).toBe(0.84);
    expect(result.postUpdateMetrics.areaUnderCurve).toBe(0.87);

    // Assert: 改善度がパーセンテージで定量的に表示される
    expect(result.improvementMetrics.accuracyImprovement).toBe(5.98);
    expect(result.improvementMetrics.precisionImprovement).toBe(5.66);
    expect(result.improvementMetrics.recallImprovement).toBe(6.54);
    expect(result.improvementMetrics.f1ScoreImprovement).toBe(6.07);
    expect(result.improvementMetrics.areaUnderCurveImprovement).toBe(4.42);

    // Assert: ポイント差として改善度が表示される
    expect(result.improvementMetrics.accuracyPointDifference).toBe(0.0470);
    expect(result.improvementMetrics.precisionPointDifference).toBe(0.0460);
    expect(result.improvementMetrics.recallPointDifference).toBe(0.0500);
    expect(result.improvementMetrics.f1ScorePointDifference).toBe(0.0480);
    expect(result.improvementMetrics.areaUnderCurvePointDifference).toBe(0.0370);

    // Assert: グラフ用データが同一画面で比較可能な形式で生成される
    expect(result.visualizationData.comparisonChart).toBeDefined();
    expect(result.visualizationData.comparisonChart.type).toBe("bar");
    expect(result.visualizationData.comparisonChart.datasets).toHaveLength(2);
    expect(result.visualizationData.comparisonChart.datasets[0].label).toBe("Update前");
    expect(result.visualizationData.comparisonChart.datasets[1].label).toBe("Update後");

    // Assert: 各精度指標のグラフデータが正確に構成される
    expect(result.visualizationData.comparisonChart.datasets[0].data).toEqual([
      0.79, 0.81, 0.77, 0.79, 0.84
    ]);
    expect(result.visualizationData.comparisonChart.datasets[1].data).toEqual([
      0.83, 0.86, 0.82, 0.84, 0.87
    ]);

    // Assert: 改善度グラフが視覚的に比較可能な形式で生成される
    expect(result.visualizationData.improvementChart).toBeDefined();
    expect(result.visualizationData.improvementChart.type).toBe("bar");
    expect(result.visualizationData.improvementChart.datasets[0].label).toBe("改善度(%)");
    expect(result.visualizationData.improvementChart.datasets[0].data).toEqual([
      5.98, 5.66, 6.54, 6.07, 4.42
    ]);

    // Assert: ドリルダウン用の詳細情報が各指標ごとに提供される
    expect(result.detailsByMetric).toBeDefined();
    expect(result.detailsByMetric.accuracy).toEqual({
      metricName: "正確度",
      preValue: 0.79,
      postValue: 0.83,
      improvementPercentage: 5.98,
      improvementPoints: 0.0470,
      classification: "改善"
    });
    expect(result.detailsByMetric.precision).toEqual({
      metricName: "適合率",
      preValue: 0.81,
      postValue: 0.86,
      improvementPercentage: 5.66,
      improvementPoints: 0.0460,
      classification: "改善"
    });
    expect(result.detailsByMetric.recall).toEqual({
      metricName: "再現率",
      preValue: 0.77,
      postValue: 0.82,
      improvementPercentage: 6.54,
      improvementPoints: 0.0500,
      classification: "改善"
    });
    expect(result.detailsByMetric.f1Score).toEqual({
      metricName: "F1スコア",
      preValue: 0.79,
      postValue: 0.84,
      improvementPercentage: 6.07,
      improvementPoints: 0.0480,
      classification: "改善"
    });
    expect(result.detailsByMetric.areaUnderCurve).toEqual({
      metricName: "AUC",
      preValue: 0.84,
      postValue: 0.87,
      improvementPercentage: 4.42,
      improvementPoints: 0.0370,
      classification: "改善"
    });

    // Assert: 全体的な改善度評価が提供される
    expect(result.overallImprovement).toBeDefined();
    expect(result.overallImprovement.averageImprovement).toBe(5.73);
    expect(result.overallImprovement.maxImprovement).toBe(6.54);
    expect(result.overallImprovement.minImprovement).toBe(4.42);
    expect(result.overallImprovement.classification).toBe("良好な改善");

    // Assert: レーダーチャート用データが生成される
    expect(result.visualizationData.radarChart).toBeDefined();
    expect(result.visualizationData.radarChart.type).toBe("radar");
    expect(result.visualizationData.radarChart.datasets).toHaveLength(2);
    expect(result.visualizationData.radarChart.labels).toEqual([
      "正確度", "適合率", "再現率", "F1スコア", "AUC"
    ]);

    // Assert: 複数の視覚化フォーマットが同一オブジェクト内に統合される
    expect(result.visualizationData).toHaveProperty("comparisonChart");
    expect(result.visualizationData).toHaveProperty("improvementChart");
    expect(result.visualizationData).toHaveProperty("radarChart");
    expect(Object.keys(result.visualizationData).length).toBe(3);
  });
});