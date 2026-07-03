import { validateSalesDataQualityRules } from "../../src/logic/it-1781935279444-2-2-1";

describe("営業データの完全性・正確性を自動検証し、不足データ・誤りを検出・通知する機能", () => {
  // SCEN-1000
  test("should confirm data quality validation rules are accurately defined and applied", () => {
    // 入力: 営業データ品質検証基準を確認
    const validationRulesRequest = {
      system_id: "sales_quality_system_001",
      user_role: "representative_operator",
      access_date: "2024-01-15T09:00:00Z",
    };

    // 実行
    const result = validateSalesDataQualityRules(validationRulesRequest);

    // 期待値: 必須項目、データ型、値の範囲、異常値判定基準がすべて正確に定義されている
    expect(result).toEqual({
      status: "success",
      validation_framework: {
        required_fields: [
          {
            field_id: "customer_id",
            field_name: "顧客ID",
            data_type: "string",
            is_required: true,
            error_message: "顧客IDは必須項目です",
          },
          {
            field_id: "transaction_date",
            field_name: "取引日",
            data_type: "date",
            is_required: true,
            format: "YYYY-MM-DD",
            error_message: "取引日は必須項目です",
          },
          {
            field_id: "amount",
            field_name: "金額",
            data_type: "number",
            is_required: true,
            error_message: "金額は必須項目です",
          },
          {
            field_id: "service_type",
            field_name: "サービス種別",
            data_type: "string",
            is_required: true,
            error_message: "サービス種別は必須項目です",
          },
          {
            field_id: "appointment_count",
            field_name: "アポイント数",
            data_type: "number",
            is_required: false,
            error_message: "アポイント数は数値で入力してください",
          },
          {
            field_id: "contract_count",
            field_name: "成約数",
            data_type: "number",
            is_required: false,
            error_message: "成約数は数値で入力してください",
          },
        ],
        data_type_validations: [
          {
            field_id: "customer_id",
            type: "string",
            min_length: 1,
            max_length: 50,
            pattern: "^[A-Za-z0-9_-]+$",
            error_message: "顧客IDは英数字、アンダースコア、ハイフンのみ使用可能です",
          },
          {
            field_id: "transaction_date",
            type: "date",
            format: "YYYY-MM-DD",
            error_message: "取引日の形式が正しくありません",
          },
          {
            field_id: "amount",
            type: "number",
            min_value: 0,
            max_value: 9999999,
            error_message: "金額は0以上9999999以下である必要があります",
          },
          {
            field_id: "service_type",
            type: "string",
            allowed_values: ["basic", "standard", "premium"],
            error_message: "サービス種別は基本、標準、プレミアムのいずれかです",
          },
          {
            field_id: "appointment_count",
            type: "number",
            min_value: 0,
            error_message: "アポイント数は0以上である必要があります",
          },
          {
            field_id: "contract_count",
            type: "number",
            min_value: 0,
            error_message: "成約数は0以上である必要があります",
          },
        ],
        value_range_validations: [
          {
            field_id: "amount",
            min_value: 0,
            max_value: 9999999,
            is_inclusive: true,
            error_message: "金額は0以上9999999以下である必要があります",
          },
          {
            field_id: "appointment_count",
            min_value: 0,
            max_value: 1000,
            is_inclusive: true,
            error_message: "アポイント数は0以上1000以下である必要があります",
          },
          {
            field_id: "contract_count",
            min_value: 0,
            max_value: 500,
            is_inclusive: true,
            error_message: "成約数は0以上500以下である必要があります",
          },
        ],
        abnormal_value_detection: [
          {
            detection_id: "out_of_range_amount",
            field_id: "amount",
            condition: "amount < 0 OR amount > 9999999",
            severity: "error",
            error_message: "金額が許容範囲を超えています",
          },
          {
            detection_id: "negative_count",
            field_id: "appointment_count",
            condition: "appointment_count < 0",
            severity: "error",
            error_message: "アポイント数が負の値です",
          },
          {
            detection_id: "negative_contract",
            field_id: "contract_count",
            condition: "contract_count < 0",
            severity: "error",
            error_message: "成約数が負の値です",
          },
          {
            detection_id: "invalid_date_format",
            field_id: "transaction_date",
            condition: "date_format != YYYY-MM-DD",
            severity: "error",
            error_message: "取引日の形式が不正です",
          },
          {
            detection_id: "invalid_service_type",
            field_id: "service_type",
            condition: "service_type NOT IN (basic, standard, premium)",
            severity: "error",
            error_message: "サービス種別が無効です",
          },
          {
            detection_id: "excessive_appointment_count",
            field_id: "appointment_count",
            condition: "appointment_count > 1000",
            severity: "warning",
            error_message: "アポイント数が通常範囲を超えています",
          },
        ],
        consistency_checks: [
          {
            check_id: "contract_le_appointment",
            condition: "contract_count <= appointment_count",
            error_message: "成約数がアポイント数を超えることはできません",
          },
          {
            check_id: "amount_matches_contract_count",
            condition: "IF contract_count > 0 THEN amount > 0",
            error_message: "成約がある場合は金額が0より大きい必要があります",
          },
        ],
      },
      validation_test_results: [
        {
          test_case_id: "test_001_valid_data",
          test_data: {
            customer_id: "CUST-001",
            transaction_date: "2024-01-15",
            amount: 50000,
            service_type: "standard",
            appointment_count: 5,
            contract_count: 2,
          },
          validation_passed: true,
          errors: [],
        },
        {
          test_case_id: "test_002_missing_customer_id",
          test_data: {
            customer_id: "",
            transaction_date: "2024-01-15",
            amount: 50000,
            service_type: "standard",
            appointment_count: 5,
            contract_count: 2,
          },
          validation_passed: false,
          errors: ["顧客IDは必須項目です"],
        },
        {
          test_case_id: "test_003_invalid_amount",
          test_data: {
            customer_id: "CUST-001",
            transaction_date: "2024-01-15",
            amount: -10000,
            service_type: "standard",
            appointment_count: 5,
            contract_count: 2,
          },
          validation_passed: false,
          errors: ["金額が許容範囲を超えています"],
        },
        {
          test_case_id: "test_004_invalid_date_format",
          test_data: {
            customer_id: "CUST-001",
            transaction_date: "2024/01/15",
            amount: 50000,
            service_type: "standard",
            appointment_count: 5,
            contract_count: 2,
          },
          validation_passed: false,
          errors: ["取引日の形式が不正です"],
        },
        {
          test_case_id: "test_005_contract_exceeds_appointment",
          test_data: {
            customer_id: "CUST-001",
            transaction_date: "2024-01-15",
            amount: 50000,
            service_type: "standard",
            appointment_count: 2,
            contract_count: 5,
          },
          validation_passed: false,
          errors: ["成約数がアポイント数を超えることはできません"],
        },
        {
          test_case_id: "test_006_invalid_service_type",
          test_data: {
            customer_id: "CUST-001",
            transaction_date: "2024-01-15",
            amount: 50000,
            service_type: "invalid_type",
            appointment_count: 5,
            contract_count: 2,
          },
          validation_passed: false,
          errors: ["サービス種別が無効です"],
        },
      ],
      framework_consistency: {
        all_fields_defined: true,
        all_validations_consistent: true,
        all_error_messages_clear: true,
        total_required_fields: 4,
        total_optional_fields: 2,
        total_validation_rules: 6,
        total_abnormal_detections: 6,
        total_consistency_checks: 2,
      },
      confirmation_timestamp: "2024-01-15T09:00:00Z",
      confirmation_user: "representative_operator_001",
    });

    // 追加検証: 検証ルールが完全に定義されているか確認
    expect(result.framework_consistency.all_fields_defined).toBe(true);
    expect(result.framework_consistency.all_validations_consistent).toBe(true);
    expect(result.framework_consistency.all_error_messages_clear).toBe(true);

    // 追加検証: テストデータが実際に検証ルールに従って動作しているか確認
    const validTestResult = result.validation_test_results.find(
      (t) => t.test_case_id === "test_001_valid_data"
    );
    expect(validTestResult?.validation_passed).toBe(true);
    expect(validTestResult?.errors.length).toBe(0);

    // 追加検証: エラーケースが正しく検出されているか確認
    const missingCustomerIdTest = result.validation_test_results.find(
      (t) => t.test_case_id === "test_002_missing_customer_id"
    );
    expect(missingCustomerIdTest?.validation_passed).toBe(false);
    expect(missingCustomerIdTest?.errors).toContain("顧客IDは必須項目です");

    // 追加検証: 異常値検出が機能しているか確認
    const invalidAmountTest = result.validation_test_results.find(
      (t) => t.test_case_id === "test_003_invalid_amount"
    );
    expect(invalidAmountTest?.validation_passed).toBe(false);
    expect(invalidAmountTest?.errors).toContain("金額が許容範囲を超えています");

    // 追加検証: 一貫性チェックが機能しているか確認
    const contractExceedsTest = result.validation_test_results.find(
      (t) => t.test_case_id === "test_005_contract_exceeds_appointment"
    );
    expect(contractExceedsTest?.validation_passed).toBe(false);
    expect(contractExceedsTest?.errors).toContain("成約数がアポイント数を超えることはできません");

    // 追加検証: 必須項目数が正確か確認
    expect(result.framework_consistency.total_required_fields).toBe(4);
    expect(result.framework_consistency.total_optional_fields).toBe(2);

    // 追加検証: 検証ルール総数が正確か確認
    expect(result.validation_framework.required_fields.length).toBe(6);
    expect(result.validation_framework.data_type_validations.length).toBe(6);
    expect(result.validation_framework.value_range_validations.length).toBe(3);
    expect(result.validation_framework.abnormal_value_detection.length).toBe(6);
    expect(result.validation_framework.consistency_checks.length).toBe(2);
  });
});