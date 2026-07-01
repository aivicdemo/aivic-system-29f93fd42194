import { validateReportCompleteness } from "../../src/logic/it-1781935279444-2-2-1";

describe("営業データの完全性・正確性を自動検証", () => {
  // SCEN-1151
  test("生成されたレポートのすべての項目が検証ルールに適合し、配信可能な状態として判定される", () => {
    const sample_report = {
      report_id: "RPT-2024-01-001",
      customer_id: "CUST-12345",
      customer_name: "テスト顧客A",
      service_id: "SVC-101",
      service_name: "営業支援サービス",
      period_start: "2024-01-01",
      period_end: "2024-01-31",
      total_appointments: 15,
      total_contracts: 3,
      customer_responses: 12,
      base_fee: 50000,
      performance_fee: 18000,
      discount_amount: 5000,
      total_billing_amount: 63000,
      generated_date: "2024-02-01",
      generated_by: "system_auto",
      data_format: "JSON",
      required_fields_complete: true,
      integrity_check_passed: true,
    };

    const validation_rules = {
      customer_id: {
        required: true,
        data_type: "string",
        pattern: /^CUST-\d+$/,
      },
      customer_name: {
        required: true,
        data_type: "string",
        min_length: 1,
        max_length: 255,
      },
      service_id: {
        required: true,
        data_type: "string",
        pattern: /^SVC-\d+$/,
      },
      period_start: {
        required: true,
        data_type: "string",
        pattern: /^\d{4}-\d{2}-\d{2}$/,
      },
      period_end: {
        required: true,
        data_type: "string",
        pattern: /^\d{4}-\d{2}-\d{2}$/,
      },
      total_appointments: {
        required: true,
        data_type: "number",
        min_value: 0,
        max_value: 1000,
      },
      total_contracts: {
        required: true,
        data_type: "number",
        min_value: 0,
        max_value: 1000,
      },
      customer_responses: {
        required: true,
        data_type: "number",
        min_value: 0,
        max_value: 1000,
      },
      base_fee: {
        required: true,
        data_type: "number",
        min_value: 0,
        max_value: 10000000,
      },
      performance_fee: {
        required: true,
        data_type: "number",
        min_value: 0,
        max_value: 10000000,
      },
      discount_amount: {
        required: true,
        data_type: "number",
        min_value: 0,
        max_value: 10000000,
      },
      total_billing_amount: {
        required: true,
        data_type: "number",
        min_value: 0,
        max_value: 10000000,
      },
      generated_date: {
        required: true,
        data_type: "string",
        pattern: /^\d{4}-\d{2}-\d{2}$/,
      },
    };

    const result = validateReportCompleteness({
      report: sample_report,
      validation_rules: validation_rules,
    });

    // 必須項目がすべて含まれていることを確認
    expect(result.all_required_fields_present).toBe(true);

    // すべての検証ルールに適合していることを確認
    expect(result.all_fields_comply_with_rules).toBe(true);

    // データ型がすべて正しいことを確認
    expect(result.data_types_valid).toBe(true);

    // 値の範囲がすべて正しいことを確認
    expect(result.values_in_range).toBe(true);

    // 整合性チェック：合計金額の計算が正しいことを確認
    // base_fee(50000) + performance_fee(18000) - discount_amount(5000) = 63000
    expect(result.integrity_check_passed).toBe(true);

    // 配信可能状態として判定されていることを確認
    expect(result.delivery_status).toBe("OK");

    // 配信可能判定が「合格」であることを確認
    expect(result.validation_result).toBe("合格");

    // 検証スコアが100（完全）であることを確認
    expect(result.validation_score).toBe(100);

    // 検証エラーが0であることを確認
    expect(result.validation_error_count).toBe(0);

    // 検証警告が0であることを確認
    expect(result.validation_warning_count).toBe(0);
  });

  // エラーテスト：必須項目が欠落しているケース
  test("必須項目が欠落している場合、検証エラーを検出する", () => {
    const incomplete_report = {
      report_id: "RPT-2024-01-002",
      customer_id: "CUST-12346",
      // customer_name が欠落
      service_id: "SVC-102",
      period_start: "2024-01-01",
      period_end: "2024-01-31",
      total_appointments: 10,
      total_contracts: 2,
      customer_responses: 8,
      base_fee: 40000,
      performance_fee: 12000,
      discount_amount: 3000,
      total_billing_amount: 49000,
      generated_date: "2024-02-01",
      generated_by: "system_auto",
      data_format: "JSON",
      required_fields_complete: false,
      integrity_check_passed: true,
    };

    const validation_rules = {
      customer_id: {
        required: true,
        data_type: "string",
        pattern: /^CUST-\d+$/,
      },
      customer_name: {
        required: true,
        data_type: "string",
        min_length: 1,
        max_length: 255,
      },
      service_id: {
        required: true,
        data_type: "string",
        pattern: /^SVC-\d+$/,
      },
      total_billing_amount: {
        required: true,
        data_type: "number",
        min_value: 0,
        max_value: 10000000,
      },
    };

    const result = validateReportCompleteness({
      report: incomplete_report,
      validation_rules: validation_rules,
    });

    // 必須項目が欠落していることを検出
    expect(result.all_required_fields_present).toBe(false);

    // 検証結果が「不合格」であることを確認
    expect(result.validation_result).toBe("不合格");

    // 配信不可状態として判定されていることを確認
    expect(result.delivery_status).toBe("NG");

    // 検証エラーが1以上であることを確認
    expect(result.validation_error_count).toBeGreaterThanOrEqual(1);

    // エラー詳細に欠落フィールド情報が含まれることを確認
    expect(result.validation_details).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          field: expect.stringMatching(/customer_name/),
          error_type: expect.stringMatching(/必須項目/),
        }),
      ])
    );
  });

  // エラーテスト：データ型が不正なケース
  test("データ型が不正な場合、検証エラーを検出する", () => {
    const invalid_type_report = {
      report_id: "RPT-2024-01-003",
      customer_id: "CUST-12347",
      customer_name: "テスト顧客C",
      service_id: "SVC-103",
      period_start: "2024-01-01",
      period_end: "2024-01-31",
      total_appointments: "15" /* should be number */,
      total_contracts: 3,
      customer_responses: 12,
      base_fee: 50000,
      performance_fee: 18000,
      discount_amount: 5000,
      total_billing_amount: 63000,
      generated_date: "2024-02-01",
      generated_by: "system_auto",
      data_format: "JSON",
      required_fields_complete: true,
      integrity_check_passed: true,
    };

    const validation_rules = {
      total_appointments: {
        required: true,
        data_type: "number",
        min_value: 0,
        max_value: 1000,
      },
    };

    const result = validateReportCompleteness({
      report: invalid_type_report,
      validation_rules: validation_rules,
    });

    // データ型の不正を検出
    expect(result.data_types_valid).toBe(false);

    // 検証結果が「不合格」であることを確認
    expect(result.validation_result).toBe("不合格");

    // 検証エラーが1以上であることを確認
    expect(result.validation_error_count).toBeGreaterThanOrEqual(1);
  });

  // エラーテスト：値の範囲が超過しているケース
  test("値の範囲が超過している場合、検証エラーを検出する", () => {
    const out_of_range_report = {
      report_id: "RPT-2024-01-004",
      customer_id: "CUST-12348",
      customer_name: "テスト顧客D",
      service_id: "SVC-104",
      period_start: "2024-01-01",
      period_end: "2024-01-31",
      total_appointments: 1500 /* exceeds max 1000 */,
      total_contracts: 3,
      customer_responses: 12,
      base_fee: 50000,
      performance_fee: 18000,
      discount_amount: 5000,
      total_billing_amount: 63000,
      generated_date: "2024-02-01",
      generated_by: "system_auto",
      data_format: "JSON",
      required_fields_complete: true,
      integrity_check_passed: true,
    };

    const validation_rules = {
      total_appointments: {
        required: true,
        data_type: "number",
        min_value: 0,
        max_value: 1000,
      },
    };

    const result = validateReportCompleteness({
      report: out_of_range_report,
      validation_rules: validation_rules,
    });

    // 値の範囲超過を検出
    expect(result.values_in_range).toBe(false);

    // 検証結果が「不合格」であることを確認
    expect(result.validation_result).toBe("不合格");

    // 検証エラーが1以上であることを確認
    expect(result.validation_error_count).toBeGreaterThanOrEqual(1);
  });

  // エラーテスト：整合性チェック失敗のケース
  test("整合性チェック失敗時（金額の合計が一致しない場合）、検証エラーを検出する", () => {
    const integrity_failed_report = {
      report_id: "RPT-2024-01-005",
      customer_id: "CUST-12349",
      customer_name: "テスト顧客E",
      service_id: "SVC-105",
      period_start: "2024-01-01",
      period_end: "2024-01-31",
      total_appointments: 15,
      total_contracts: 3,
      customer_responses: 12,
      base_fee: 50000,
      performance_fee: 18000,
      discount_amount: 5000,
      total_billing_amount: 70000 /* should be 63000 (50000+18000-5000) */,
      generated_date: "2024-02-01",
      generated_by: "system_auto",
      data_format: "JSON",
      required_fields_complete: true,
      integrity_check_passed: false,
    };

    const validation_rules = {
      base_fee: {
        required: true,
        data_type: "number",
        min_value: 0,
        max_value: 10000000,
      },
      performance_fee: {
        required: true,
        data_type: "number",
        min_value: 0,
        max_value: 10000000,
      },
      discount_amount: {
        required: true,
        data_type: "number",
        min_value: 0,
        max_value: 10000000,
      },
      total_billing_amount: {
        required: true,
        data_type: "number",
        min_value: 0,
        max_value: 10000000,
      },
    };

    const result = validateReportCompleteness({
      report: integrity_failed_report,
      validation_rules: validation_rules,
    });

    // 整合性チェック失敗を検出
    expect(result.integrity_check_passed).toBe(false);

    // 検証結果が「不合格」であることを確認
    expect(result.validation_result).toBe("不合格");

    // 配信不可状態として判定されていることを確認
    expect(result.delivery_status).toBe("NG");

    // 検証エラーが1以上であることを確認
    expect(result.validation_error_count).toBeGreaterThanOrEqual(1);
  });

  // エラーテスト：パターンマッチング失敗のケース
  test("パターンマッチングが失敗している場合、検証エラーを検出する", () => {
    const pattern_mismatch_report = {
      report_id: "RPT-2024-01-006",
      customer_id: "INVALID-ID" /* pattern mismatch: should match ^CUST-\d+$ */,
      customer_name: "テスト顧客F",
      service_id: "SVC-106",
      period_start: "2024-01-01",
      period_end: "2024-01-31",
      total_appointments: 15,
      total_contracts: 3,
      customer_responses: 12,
      base_fee: 50000,
      performance_fee: 18000,
      discount_amount: 5000,
      total_billing_amount: 63000,
      generated_date: "2024-02-01",
      generated_by: "system_auto",
      data_format: "JSON",
      required_fields_complete: true,
      integrity_check_passed: true,
    };

    const validation_rules = {
      customer_id: {
        required: true,
        data_type: "string",
        pattern: /^CUST-\d+$/,
      },
    };

    const result = validateReportCompleteness({
      report: pattern_mismatch_report,
      validation_rules: validation_rules,
    });

    // パターンマッチング失敗を検出
    expect(result.all_fields_comply_with_rules).toBe(false);

    // 検証結果が「不合格」であることを確認
    expect(result.validation_result).toBe("不合格");

    // 検証エラーが1以上であることを確認
    expect(result.validation_error_count).toBeGreaterThanOrEqual(1);
  });
});