import { splitAndTrainModel } from "../../src/logic/it-6-2-2-1";

describe("学習データ分割・モデル学習機能", () => {
  // SCEN-1497
  test("[normal] 学習データを訓練・検証・テストセットに分割し、指定比率でモデルを学習した場合、過学習を防ぎながら汎化性能が確保される", () => {
    // テストデータセット準備：査定品質に関する学習データ
    const trainingDataset = Array.from({ length: 100 }, (_, i) => ({
      features: [
        Math.random() * 100,
        Math.random() * 100,
        Math.random() * 100,
        Math.random() * 100,
      ],
      label: Math.random() > 0.5 ? 1 : 0,
    }));

    // 分割比率：訓練60%、検証20%、テスト20%
    const splitRatios = {
      train: 0.6,
      validation: 0.2,
      test: 0.2,
    };

    // モデル学習実行
    const result = splitAndTrainModel({
      dataset: trainingDataset,
      splitRatios: splitRatios,
      maxEpochs: 100,
      earlyStoppingPatience: 5,
      earlyStoppingThreshold: 0.01,
    });

    // 訓練セット件数：100 * 0.6 = 60件
    expect(result.trainSetSize).toBe(60);

    // 検証セット件数：100 * 0.2 = 20件
    expect(result.validationSetSize).toBe(20);

    // テストセット件数：100 * 0.2 = 20件
    expect(result.testSetSize).toBe(20);

    // 訓練精度、検証精度、テスト精度が0から1の範囲内
    expect(result.trainAccuracy).toBeGreaterThanOrEqual(0);
    expect(result.trainAccuracy).toBeLessThanOrEqual(1);
    expect(result.validationAccuracy).toBeGreaterThanOrEqual(0);
    expect(result.validationAccuracy).toBeLessThanOrEqual(1);
    expect(result.testAccuracy).toBeGreaterThanOrEqual(0);
    expect(result.testAccuracy).toBeLessThanOrEqual(1);

    // テスト精度が所定の閾値（85%以上）を満たす
    expect(result.testAccuracy).toBeGreaterThanOrEqual(0.85);

    // 訓練精度とテスト精度の差が許容範囲内（5%以内）
    const accuracyDifference = Math.abs(
      result.trainAccuracy - result.testAccuracy
    );
    expect(accuracyDifference).toBeLessThanOrEqual(0.05);

    // 検証精度がテスト精度と同等レベル（3%以内）である（過学習防止の確認）
    const validationTestDifference = Math.abs(
      result.validationAccuracy - result.testAccuracy
    );
    expect(validationTestDifference).toBeLessThanOrEqual(0.03);

    // 精度メトリクス（Precision、Recall、F1スコア）が存在し、0～1の範囲内
    expect(result.metrics).toBeDefined();
    expect(result.metrics.precision).toBeGreaterThanOrEqual(0);
    expect(result.metrics.precision).toBeLessThanOrEqual(1);
    expect(result.metrics.recall).toBeGreaterThanOrEqual(0);
    expect(result.metrics.recall).toBeLessThanOrEqual(1);
    expect(result.metrics.f1Score).toBeGreaterThanOrEqual(0);
    expect(result.metrics.f1Score).toBeLessThanOrEqual(1);

    // Early Stoppingが適用されたことを確認
    expect(result.earlyStoppingApplied).toBe(true);

    // 学習が完了した状態
    expect(result.trainingCompleted).toBe(true);

    // 汎化性能が確保されていることを確認：
    // 訓練精度とテスト精度の差が小さく、検証精度がテスト精度と同等
    expect(accuracyDifference).toBeLessThanOrEqual(0.05);
    expect(validationTestDifference).toBeLessThanOrEqual(0.03);

    // テスト精度が基準値以上
    expect(result.testAccuracy).toBeGreaterThanOrEqual(0.85);

    // F1スコアが十分な値を持つ（汎化性能の指標）
    expect(result.metrics.f1Score).toBeGreaterThanOrEqual(0.8);
  });
});