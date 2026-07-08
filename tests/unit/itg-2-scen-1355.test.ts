import { calculateMinimumDatasetRequirement } from "../../src/logic/it-1-br-2-2-2-1";

describe("査定品質管理・標準化システム - 学習データセット最小要件計算", () => {
  // SCEN-1355: [edge] 学習データセット最小要件定量化 - 地域カバー率が50%のとき最小件数が正確に計算される
  test("地域カバー率50%のとき最小要件件数が仕様通り計算され複数回実行で一貫性を保つ", () => {
    // 前提: 査定品質管理・標準化システムの学習データセット最小要件計算モジュールが実装されている
    // 発生条件: 地域カバー率50%のパラメータで最小要件計算を実行
    // 期待結果: 計算結果が定量化され、仕様式に基づいた期待値と一致し、複数回実行で一貫性を保つ

    // 基準値定義（仕様書に基づく）
    const BASE_MINIMUM_DATASET_SIZE = 100; // 基本最小件数
    const REGIONAL_COVERAGE_TARGET = 0.5; // 地域カバー率目標 50%
    const REGIONAL_COVERAGE_ADJUSTMENT_FACTOR = 1.5; // 地域カバー率調整係数
    const EXPECTED_MINIMUM_FOR_50_PERCENT_COVERAGE =
      Math.round(BASE_MINIMUM_DATASET_SIZE * REGIONAL_COVERAGE_ADJUSTMENT_FACTOR); // 150件

    // 手順1: 地域カバー率50%でパラメータを設定し最小要件計算を実行
    const first_result = calculateMinimumDatasetRequirement({
      regional_coverage_rate: 50.0,
    });

    // 手順2: 計算結果の数値を取得して期待値と検証
    expect(first_result.minimum_dataset_size).toBe(EXPECTED_MINIMUM_FOR_50_PERCENT_COVERAGE);

    // 手順3: 計算結果が統計的有意性を満たしているか確認
    // 地域別分布要件: 各地域が最低5件以上、かつ全体の5%以上を占めることを確認
    expect(first_result.regional_distribution_valid).toBe(true);
    expect(first_result.minimum_samples_per_region).toBe(5);

    // 手順4: エッジケースとして地域カバー率が正確に50.0%の状態で再度計算
    const second_result = calculateMinimumDatasetRequirement({
      regional_coverage_rate: 50.0,
    });

    // 手順5: 複数回実行時の計算結果の一貫性を確認
    expect(second_result.minimum_dataset_size).toBe(first_result.minimum_dataset_size);
    expect(second_result.regional_distribution_valid).toBe(
      first_result.regional_distribution_valid
    );
    expect(second_result.minimum_samples_per_region).toBe(
      first_result.minimum_samples_per_region
    );

    // 追加検証: 計算ロジックの安定性確認（タイムスタンプは変わるが、計算結果は同じ）
    expect(second_result.calculated_at).toBeDefined();
    expect(first_result.calculated_at).toBeDefined();
    expect(typeof second_result.calculated_at).toBe("string");

    // 計算式検証: minimum_dataset_size = BASE * (1 + (1 - coverage_rate) * adjustment_factor)
    // coverage_rate = 50% = 0.5 の場合
    // minimum = 100 * (1 + (1 - 0.5) * 0.5) = 100 * 1.5 = 150
    const calculated_size =
      BASE_MINIMUM_DATASET_SIZE *
      (1 + (1 - REGIONAL_COVERAGE_TARGET) * (REGIONAL_COVERAGE_ADJUSTMENT_FACTOR - 1));
    expect(first_result.minimum_dataset_size).toBe(Math.round(calculated_size));

    // 統計的有意性検証: 地域数が4地域の場合、各地域最小件数 = 150 / (4 * 0.5) ≈ 75件
    // ただし下限は5件なので、各地域は最低5件以上必須
    expect(first_result.minimum_samples_per_region).toBeGreaterThanOrEqual(5);
    expect(first_result.minimum_dataset_size).toBeGreaterThanOrEqual(
      first_result.minimum_samples_per_region * 4
    );
  });
});