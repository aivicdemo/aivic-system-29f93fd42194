import { describe, test, expect } from "@jest/globals";
import {
  validateSalesDataAgainstRules,
  detectAnomaliesInSalesData,
} from "../../src/logic/it-1-1-1";

describe("営業成果データの自動検証ルール定義と異常検出機能", () => {
  // SCEN-700: [edge] 営業データ自動検証ルール定義と異常検出機能 - 営業データの販売数量が0の場合に異常が検出されるか否かが定義ルールに従う
  test("販売数量が0のデータに対してルール定義に従って異常が正しく検出される", () => {
    // ルール定義: 販売数量が0の場合を異常と判定する規則
    const validation_rule_id = 1001;
    const rule_definition = {
      rule_id: validation_rule_id,
      rule_name: "販売数量ゼロチェック",
      target_field: "sales_quantity",
      rule_type: "range_check",
      is_anomaly_on_zero: true, // 0の場合を異常と判定
      min_value: 1,
      max_value: 10000,
      description: "販売数量は1以上である必要がある",
    };

    // テストデータ1: 販売数量が0のデータ
    const test_data_zero = {
      sales_data_id: "SD-2024-001",
      customer_id: "CUST-001",
      service_id: "SVC-001",
      sales_quantity: 0,
      unit_price: 10000,
      sales_date: "2024-01-15",
    };

    // テストデータ2: 販売数量が正常値のデータ
    const test_data_normal = {
      sales_data_id: "SD-2024-002",
      customer_id: "CUST-002",
      service_id: "SVC-002",
      sales_quantity: 5,
      unit_price: 10000,
      sales_date: "2024-01-15",
    };

    // ルール定義に従ったバリデーション実行
    const validation_result_zero = validateSalesDataAgainstRules(
      test_data_zero,
      rule_definition
    );

    // 販売数量が0の場合、ルール定義で is_anomaly_on_zero が true なので異常と判定される
    expect(validation_result_zero).toEqual({
      is_valid: false,
      has_anomaly: true,
      anomaly_type: "zero_value",
      field_name: "sales_quantity",
      error_message: "販売数量は1以上である必要があります",
      detected_value: 0,
      rule_id: validation_rule_id,
    });

    // 異常検出エンジンの実行
    const anomaly_detection_result_zero = detectAnomaliesInSalesData(
      test_data_zero,
      rule_definition
    );

    // 販売数量が0のデータに対して異常が検出される
    expect(anomaly_detection_result_zero).toEqual({
      sales_data_id: "SD-2024-001",
      anomalies_detected: [
        {
          anomaly_id: "ANOM-001",
          rule_id: validation_rule_id,
          field: "sales_quantity",
          anomaly_severity: "error",
          anomaly_message: "販売数量がゼロです",
          detected_value: 0,
          expected_range: { min: 1, max: 10000 },
          timestamp: "2024-01-15T00:00:00Z",
        },
      ],
      total_anomalies: 1,
      anomaly_status: "failed",
    });

    // 正常値データのバリデーション
    const validation_result_normal = validateSalesDataAgainstRules(
      test_data_normal,
      rule_definition
    );

    // 販売数量が正常値(5)の場合、異常は検出されない
    expect(validation_result_normal).toEqual({
      is_valid: true,
      has_anomaly: false,
      anomaly_type: null,
      field_name: "sales_quantity",
      error_message: null,
      detected_value: 5,
      rule_id: validation_rule_id,
    });

    // 正常値データの異常検出エンジン実行
    const anomaly_detection_result_normal = detectAnomaliesInSalesData(
      test_data_normal,
      rule_definition
    );

    // 販売数量が正常値のデータに対して異常が検出されない
    expect(anomaly_detection_result_normal).toEqual({
      sales_data_id: "SD-2024-002",
      anomalies_detected: [],
      total_anomalies: 0,
      anomaly_status: "passed",
    });

    // ルール定義で is_anomaly_on_zero が false の場合のテスト
    const rule_definition_no_anomaly = {
      rule_id: validation_rule_id,
      rule_name: "販売数量許容チェック",
      target_field: "sales_quantity",
      rule_type: "range_check",
      is_anomaly_on_zero: false, // 0の場合を異常と判定しない
      min_value: 0,
      max_value: 10000,
      description: "販売数量は0以上である必要がある",
    };

    // 販売数量が0でも is_anomaly_on_zero が false なら異常ではない
    const validation_result_zero_allowed = validateSalesDataAgainstRules(
      test_data_zero,
      rule_definition_no_anomaly
    );

    expect(validation_result_zero_allowed).toEqual({
      is_valid: true,
      has_anomaly: false,
      anomaly_type: null,
      field_name: "sales_quantity",
      error_message: null,
      detected_value: 0,
      rule_id: validation_rule_id,
    });

    // is_anomaly_on_zero が false の場合、販売数量が0でも異常検出されない
    const anomaly_detection_result_zero_allowed = detectAnomaliesInSalesData(
      test_data_zero,
      rule_definition_no_anomaly
    );

    expect(anomaly_detection_result_zero_allowed).toEqual({
      sales_data_id: "SD-2024-001",
      anomalies_detected: [],
      total_anomalies: 0,
      anomaly_status: "passed",
    });

    // 境界値テスト: 販売数量が最小値ちょうど (1)
    const test_data_min_boundary = {
      sales_data_id: "SD-2024-003",
      customer_id: "CUST-003",
      service_id: "SVC-003",
      sales_quantity: 1,
      unit_price: 10000,
      sales_date: "2024-01-15",
    };

    const validation_result_min_boundary = validateSalesDataAgainstRules(
      test_data_min_boundary,
      rule_definition
    );

    // 販売数量が1(最小値)の場合、異常は検出されない
    expect(validation_result_min_boundary).toEqual({
      is_valid: true,
      has_anomaly: false,
      anomaly_type: null,
      field_name: "sales_quantity",
      error_message: null,
      detected_value: 1,
      rule_id: validation_rule_id,
    });

    // 境界値テスト: 販売数量が最大値を超過 (10001)
    const test_data_over_max = {
      sales_data_id: "SD-2024-004",
      customer_id: "CUST-004",
      service_id: "SVC-004",
      sales_quantity: 10001,
      unit_price: 10000,
      sales_date: "2024-01-15",
    };

    const validation_result_over_max = validateSalesDataAgainstRules(
      test_data_over_max,
      rule_definition
    );

    // 販売数量が10001(最大値超過)の場合、異常が検出される
    expect(validation_result_over_max).toEqual({
      is_valid: false,
      has_anomaly: true,
      anomaly_type: "range_exceeded",
      field_name: "sales_quantity",
      error_message: "販売数量が許容範囲を超過しています",
      detected_value: 10001,
      rule_id: validation_rule_id,
    });
  });
});