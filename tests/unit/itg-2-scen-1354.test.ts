import { calculateMinimumDatasetSize } from "../../src/logic/it-1-br-2-2-2-1";

describe("学習データセット最小要件定量化 - 地域カバー率100%時の最小件数計算", () => {
  test("SCEN-1354: 地域カバー率が100%のとき最小件数が正確に計算される", () => {
    // 前提条件: 査定品質管理・標準化システムでログイン状態
    // トリガー: 学習データセット最小要件定量化機能にアクセス、地域カバー率を100%に設定

    // 入力パラメータ: 地域カバー率100%
    const regional_coverage_rate = 100;
    const construction_type_count = 8; // 工事種別の総数
    const required_samples_per_type = 30; // 工事種別あたりの最小サンプル数

    // 期待値計算:
    // 地域カバー率 100% = すべての地域をカバーする必要がある
    // 最小件数 = 工事種別数 × 地域数 × 工事種別あたりの最小サンプル数
    // 仮定: 標準地域数 = 5 (北海道、東北、関東、中部、関西、中国、四国、九州 → 簡略化して5地域)
    const standard_region_count = 5;
    const expected_minimum_count =
      construction_type_count *
      standard_region_count *
      required_samples_per_type;

    // 計算実行1回目
    const result_first_execution = calculateMinimumDatasetSize({
      regional_coverage_rate: regional_coverage_rate,
      construction_type_count: construction_type_count,
      required_samples_per_type: required_samples_per_type,
      standard_region_count: standard_region_count,
    });

    // 期待値との照合
    expect(result_first_execution.minimum_dataset_size).toBe(
      expected_minimum_count
    );
    expect(result_first_execution.regional_coverage_rate).toBe(100);

    // 複数回実行による一貫性検証
    const result_second_execution = calculateMinimumDatasetSize({
      regional_coverage_rate: regional_coverage_rate,
      construction_type_count: construction_type_count,
      required_samples_per_type: required_samples_per_type,
      standard_region_count: standard_region_count,
    });

    expect(result_second_execution.minimum_dataset_size).toBe(
      result_first_execution.minimum_dataset_size
    );

    // 3回目の実行でも一貫性を確認
    const result_third_execution = calculateMinimumDatasetSize({
      regional_coverage_rate: regional_coverage_rate,
      construction_type_count: construction_type_count,
      required_samples_per_type: required_samples_per_type,
      standard_region_count: standard_region_count,
    });

    expect(result_third_execution.minimum_dataset_size).toBe(
      expected_minimum_count
    );

    // 計算結果の正確性: 1200件 (8 × 5 × 30)
    const expected_exact_value = 1200;
    expect(result_first_execution.minimum_dataset_size).toBe(
      expected_exact_value
    );

    // 計算結果が正整数であることを確認
    expect(Number.isInteger(result_first_execution.minimum_dataset_size)).toBe(
      true
    );

    // 地域カバー率100%の検証状態をチェック
    expect(result_first_execution.is_coverage_complete).toBe(true);
  });
});