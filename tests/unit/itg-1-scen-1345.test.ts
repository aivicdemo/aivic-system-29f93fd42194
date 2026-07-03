import {
  validateSalesData,
} from "../../src/logic/it-1781935279444-2-2-1";

describe("営業データ品質検証ルール実行機能", () => {
  // SCEN-1345
  test("すべての検証ルール条件を満たす営業データが正常と判定される", () => {
    // 準備: 複数の検証ルール条件を満たすテスト営業データ
    const testSalesData = {
      sales_id: "SALE001",
      customer_id: "CUST001",
      customer_name: "テスト顧客A",
      contact_date: "2024-01-15",
      service_type: "SERVICE_A",
      appointment_confirmed: true,
      transaction_amount: 150000,
      transaction_currency: "JPY",
      sales_rep_id: "REP001",
      sales_rep_name: "営業太郎",
      status: "COMPLETED",
      notes: "正常なテストデータ",
    };

    // 検証ルール条件の定義
    const validationRules = [
      {
        rule_id: "RULE001",
        field_name: "transaction_amount",
        rule_type: "REQUIRED",
        condition: "NOT_NULL",
        expected_result: true,
      },
      {
        rule_id: "RULE002",
        field_name: "transaction_amount",
        rule_type: "DATA_TYPE",
        condition: "IS_NUMBER",
        expected_result: true,
      },
      {
        rule_id: "RULE003",
        field_name: "transaction_amount",
        rule_type: "RANGE",
        condition: "BETWEEN_0_AND_10000000",
        min_value: 0,
        max_value: 10000000,
        expected_result: true,
      },
      {
        rule_id: "RULE004",
        field_name: "customer_name",
        rule_type: "FORMAT",
        condition: "NOT_EMPTY_STRING",
        expected_result: true,
      },
      {
        rule_id: "RULE005",
        field_name: "contact_date",
        rule_type: "DATE_VALIDITY",
        condition: "VALID_ISO_DATE",
        expected_result: true,
      },
    ];

    // 検証実行
    const validationResult = validateSalesData(testSalesData, validationRules);

    // 検証結果の期待値
    expect(validationResult).toEqual({
      validation_status: "PASSED",
      is_valid: true,
      error_count: 0,
      warning_count: 0,
      errors: [],
      warnings: [],
      validation_timestamp: expect.any(String),
      execution_log_id: expect.any(String),
    });

    // 検証結果ステータスが合格または OK
    expect(validationResult.validation_status).toBe("PASSED");
    expect(validationResult.is_valid).toBe(true);

    // エラーや警告がないこと
    expect(validationResult.error_count).toBe(0);
    expect(validationResult.warning_count).toBe(0);
    expect(validationResult.errors.length).toBe(0);
    expect(validationResult.warnings.length).toBe(0);

    // 検証実行ログが記録されていること
    expect(validationResult.validation_timestamp).toBeTruthy();
    expect(validationResult.execution_log_id).toBeTruthy();
  });
});