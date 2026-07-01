import { describe, test, expect, beforeEach } from "@jest/globals";
import {
  detectAnomalies,
  DetectionRuleDefinition,
  AnomalyDetectionResult,
} from "../../src/logic/it-1-1-1";

describe("営業データ異常値検出機能", () => {
  let rules: DetectionRuleDefinition[];
  let testData: Record<string, unknown>;

  beforeEach(() => {
    rules = [
      {
        rule_id: "rule_001",
        rule_name: "必須項目欠落",
        rule_type: "required_field",
        target_field: "customer_name",
        condition: "field_must_exist",
        threshold: undefined,
      },
      {
        rule_id: "rule_002",
        rule_name: "データ型不整合",
        rule_type: "data_type",
        target_field: "appointment_count",
        condition: "must_be_integer",
        threshold: undefined,
      },
      {
        rule_id: "rule_003",
        rule_name: "値の範囲外",
        rule_type: "range_check",
        target_field: "appointment_count",
        condition: "must_be_between",
        threshold: { min: 0, max: 1000 },
      },
      {
        rule_id: "rule_004",
        rule_name: "異常値判定（売上金額）",
        rule_type: "anomaly_threshold",
        target_field: "sales_amount",
        condition: "must_not_exceed_limit",
        threshold: { max: 10000000 },
      },
      {
        rule_id: "rule_005",
        rule_name: "日付の矛盾",
        rule_type: "date_consistency",
        target_field: "contact_date",
        condition: "must_be_valid_date",
        threshold: undefined,
      },
    ];

    testData = {
      customer_name: "テスト顧客A",
      appointment_count: 15,
      sales_amount: 500000,
      contact_date: "2024-01-15",
      service_type: "standard",
      status: "completed",
    };
  });

  // SCEN-699
  test("月次営業データ集計時に定義済みのすべての異常値検出ルールを適用し、異常値を正確に検出する", () => {
    // 正常データセット（すべてのルール基準を満たす）
    const normalResult: AnomalyDetectionResult = detectAnomalies(
      testData,
      rules
    );

    expect(normalResult).toEqual({
      data_id: expect.any(String),
      detection_timestamp: expect.any(String),
      total_rules_applied: 5,
      anomalies_detected_count: 0,
      anomaly_details: [],
      passed_rules: [
        "rule_001",
        "rule_002",
        "rule_003",
        "rule_004",
        "rule_005",
      ],
      validation_status: "passed",
    });

    // テストケース1: 必須項目欠落（rule_001）
    const dataWithMissingCustomer = {
      customer_name: undefined,
      appointment_count: 15,
      sales_amount: 500000,
      contact_date: "2024-01-15",
      service_type: "standard",
      status: "completed",
    };

    const resultMissingField: AnomalyDetectionResult = detectAnomalies(
      dataWithMissingCustomer,
      rules
    );

    expect(resultMissingField.anomalies_detected_count).toBe(1);
    expect(resultMissingField.validation_status).toBe("failed");
    expect(resultMissingField.anomaly_details).toContainEqual(
      expect.objectContaining({
        rule_id: "rule_001",
        rule_name: "必須項目欠落",
        detected: true,
        anomaly_type: "missing_required_field",
        target_field: "customer_name",
        current_value: undefined,
      })
    );
    expect(resultMissingField.passed_rules).toEqual([
      "rule_002",
      "rule_003",
      "rule_004",
      "rule_005",
    ]);

    // テストケース2: データ型不整合（rule_002）
    const dataWithWrongType = {
      customer_name: "テスト顧客B",
      appointment_count: "15",
      sales_amount: 600000,
      contact_date: "2024-01-16",
      service_type: "standard",
      status: "completed",
    };

    const resultWrongType: AnomalyDetectionResult = detectAnomalies(
      dataWithWrongType,
      rules
    );

    expect(resultWrongType.anomalies_detected_count).toBe(1);
    expect(resultWrongType.anomaly_details).toContainEqual(
      expect.objectContaining({
        rule_id: "rule_002",
        rule_name: "データ型不整合",
        detected: true,
        anomaly_type: "invalid_data_type",
        target_field: "appointment_count",
        current_value: "15",
        expected_type: "integer",
      })
    );

    // テストケース3: 値の範囲外（rule_003）
    const dataOutOfRange = {
      customer_name: "テスト顧客C",
      appointment_count: 1500,
      sales_amount: 700000,
      contact_date: "2024-01-17",
      service_type: "standard",
      status: "completed",
    };

    const resultOutOfRange: AnomalyDetectionResult = detectAnomalies(
      dataOutOfRange,
      rules
    );

    expect(resultOutOfRange.anomalies_detected_count).toBe(1);
    expect(resultOutOfRange.anomaly_details).toContainEqual(
      expect.objectContaining({
        rule_id: "rule_003",
        rule_name: "値の範囲外",
        detected: true,
        anomaly_type: "value_out_of_range",
        target_field: "appointment_count",
        current_value: 1500,
        valid_range: { min: 0, max: 1000 },
      })
    );

    // テストケース4: 異常値判定（売上金額超過）（rule_004）
    const dataWithExcessiveSales = {
      customer_name: "テスト顧客D",
      appointment_count: 25,
      sales_amount: 15000000,
      contact_date: "2024-01-18",
      service_type: "premium",
      status: "completed",
    };

    const resultExcessiveSales: AnomalyDetectionResult = detectAnomalies(
      dataWithExcessiveSales,
      rules
    );

    expect(resultExcessiveSales.anomalies_detected_count).toBe(1);
    expect(resultExcessiveSales.anomaly_details).toContainEqual(
      expect.objectContaining({
        rule_id: "rule_004",
        rule_name: "異常値判定（売上金額）",
        detected: true,
        anomaly_type: "threshold_exceeded",
        target_field: "sales_amount",
        current_value: 15000000,
        threshold_limit: 10000000,
      })
    );

    // テストケース5: 日付の矛盾（rule_005）
    const dataWithInvalidDate = {
      customer_name: "テスト顧客E",
      appointment_count: 10,
      sales_amount: 800000,
      contact_date: "2024-13-45",
      service_type: "standard",
      status: "completed",
    };

    const resultInvalidDate: AnomalyDetectionResult = detectAnomalies(
      dataWithInvalidDate,
      rules
    );

    expect(resultInvalidDate.anomalies_detected_count).toBe(1);
    expect(resultInvalidDate.anomaly_details).toContainEqual(
      expect.objectContaining({
        rule_id: "rule_005",
        rule_name: "日付の矛盾",
        detected: true,
        anomaly_type: "invalid_date_format",
        target_field: "contact_date",
        current_value: "2024-13-45",
      })
    );

    // テストケース6: 複数の異常値を同時に検出
    const dataWithMultipleAnomalies = {
      customer_name: undefined,
      appointment_count: "abc",
      sales_amount: 20000000,
      contact_date: "invalid-date",
      service_type: "standard",
      status: "completed",
    };

    const resultMultipleAnomalies: AnomalyDetectionResult = detectAnomalies(
      dataWithMultipleAnomalies,
      rules
    );

    expect(resultMultipleAnomalies.anomalies_detected_count).toBe(4);
    expect(resultMultipleAnomalies.validation_status).toBe("failed");
    expect(resultMultipleAnomalies.anomaly_details.length).toBe(4);

    const detectedRuleIds = resultMultipleAnomalies.anomaly_details.map(
      (detail: Record<string, unknown>) => detail.rule_id
    );
    expect(detectedRuleIds).toEqual(
      expect.arrayContaining(["rule_001", "rule_002", "rule_004", "rule_005"])
    );

    // テストケース7: 境界値テスト（正常）- 範囲の最小値
    const dataBoundaryMin = {
      customer_name: "テスト顧客F",
      appointment_count: 0,
      sales_amount: 0,
      contact_date: "2024-01-01",
      service_type: "standard",
      status: "completed",
    };

    const resultBoundaryMin: AnomalyDetectionResult = detectAnomalies(
      dataBoundaryMin,
      rules
    );

    expect(resultBoundaryMin.anomalies_detected_count).toBe(0);
    expect(resultBoundaryMin.passed_rules.length).toBe(5);

    // テストケース8: 境界値テスト（正常）- 範囲の最大値
    const dataBoundaryMax = {
      customer_name: "テスト顧客G",
      appointment_count: 1000,
      sales_amount: 10000000,
      contact_date: "2024-12-31",
      service_type: "standard",
      status: "completed",
    };

    const resultBoundaryMax: AnomalyDetectionResult = detectAnomalies(
      dataBoundaryMax,
      rules
    );

    expect(resultBoundaryMax.anomalies_detected_count).toBe(0);
    expect(resultBoundaryMax.validation_status).toBe("passed");
    expect(resultBoundaryMax.total_rules_applied).toBe(5);

    // テストケース9: 値の範囲外（マイナス値）
    const dataNegativeValue = {
      customer_name: "テスト顧客H",
      appointment_count: -5,
      sales_amount: 400000,
      contact_date: "2024-01-20",
      service_type: "standard",
      status: "completed",
    };

    const resultNegativeValue: AnomalyDetectionResult = detectAnomalies(
      dataNegativeValue,
      rules
    );

    expect(resultNegativeValue.anomalies_detected_count).toBe(1);
    expect(resultNegativeValue.anomaly_details).toContainEqual(
      expect.objectContaining({
        rule_id: "rule_003",
        detected: true,
        anomaly_type: "value_out_of_range",
      })
    );

    // テストケース10: ルール全体の適用確認
    expect(normalResult.total_rules_applied).toBe(5);
    expect(normalResult.passed_rules).toHaveLength(5);
    expect(normalResult.anomaly_details).toHaveLength(0);
  });
});