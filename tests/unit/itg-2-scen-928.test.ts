import { verifySystemExecutionCapability } from "../../src/logic/it-6-2-2-2";

describe("統一判定ロジック実行可能性確認機能", () => {
  test("SCEN-928: [normal] 統一判定基準と学習データが登録完了している場合にシステム実行可能と判定される", () => {
    // 統一判定基準マスタの登録データ
    const judgmentCriteria = {
      criteria_id: "CRIT-2024-001",
      criteria_version: "1.0",
      registration_date: "2024-01-15",
      construction_type: "建築工事",
      price_range_min: 1000000,
      price_range_max: 10000000,
      acceptable_deviation_rate_lower: -15,
      acceptable_deviation_rate_upper: 20,
      reference_data_count: 150,
      coverage_rate: 95,
      status: "active",
    };

    // 学習データの登録データ
    const learningData = {
      data_id: "LEARN-2024-001",
      data_version: "1.5",
      registration_date: "2024-01-15",
      past_project_count: 280,
      material_price_book_version: "2024-01",
      data_quality_score: 88,
      geographic_coverage_rate: 92,
      seasonal_pattern_coverage: 87,
      status: "active",
    };

    // 統一判定ロジック実行可能性確認を実行
    const result = verifySystemExecutionCapability({
      judgment_criteria: judgmentCriteria,
      learning_data: learningData,
    });

    // 実行可能ステータスが真であることを確認
    expect(result.is_executable).toBe(true);

    // 実行許可フラグが真で返されることを確認
    expect(result.execution_permission_flag).toBe(true);

    // システム稼働ステータスが「実行可能」であることを確認
    expect(result.system_status).toBe("executable");

    // 統一判定基準が正常に読み込まれたことを確認
    expect(result.loaded_criteria_id).toBe("CRIT-2024-001");
    expect(result.loaded_criteria_version).toBe("1.0");

    // 学習データが正常に読み込まれたことを確認
    expect(result.loaded_data_id).toBe("LEARN-2024-001");
    expect(result.loaded_data_version).toBe("1.5");

    // リソース存在確認が成功したことを確認
    expect(result.criteria_existence_verified).toBe(true);
    expect(result.learning_data_existence_verified).toBe(true);

    // バージョン検証が成功したことを確認
    expect(result.criteria_version_valid).toBe(true);
    expect(result.learning_data_version_valid).toBe(true);

    // 判定基準の品質確認（カバレッジ率が基準値を満たす）
    expect(result.criteria_coverage_acceptable).toBe(true);

    // 学習データの品質確認（品質スコアが基準値を満たす）
    expect(result.learning_data_quality_acceptable).toBe(true);

    // 整合性検証が成功したことを確認
    expect(result.integrity_check_passed).toBe(true);

    // 実行判定ロジックが「実行可能」で統一判定基準と学習データが整合していることを確認
    expect(result.ready_for_operation).toBe(true);
  });
});