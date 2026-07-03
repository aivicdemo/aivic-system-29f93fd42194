import {
  validateSalesDataFinal,
} from "../../src/logic/it-1781935279444-2-2-1";

describe("営業データ最終検証・レポート生成可否判定", () => {
  // SCEN-728
  test("確定済みデータの欠落・異常値がすべて検出され、承認されず生成がスキップされる", () => {
    // 準備: 複数の確定済み営業データレコード（意図的に欠落値や異常値を含める）
    const sales_data_records = [
      {
        id: "sd_001",
        customer_id: "cust_123",
        service_id: "svc_A",
        appointment_count: 5,
        contract_count: 2,
        contact_date: "2024-01-15",
        amount: 50000,
        status: "confirmed",
        created_at: "2024-01-10T09:00:00Z",
      },
      {
        id: "sd_002",
        customer_id: "cust_124",
        service_id: "svc_B",
        appointment_count: null, // 欠落値
        contract_count: 1,
        contact_date: "2024-01-16",
        amount: 75000,
        status: "confirmed",
        created_at: "2024-01-11T10:30:00Z",
      },
      {
        id: "sd_003",
        customer_id: "cust_125",
        service_id: "svc_A",
        appointment_count: 3,
        contract_count: 5, // 異常値（アポ数より成約数が多い）
        contact_date: "2024-01-17",
        amount: -10000, // 異常値（負の金額）
        status: "confirmed",
        created_at: "2024-01-12T11:45:00Z",
      },
      {
        id: "sd_004",
        customer_id: "cust_126",
        service_id: "svc_C",
        appointment_count: 2,
        contract_count: 1,
        contact_date: "", // 欠落値
        amount: 120000,
        status: "confirmed",
        created_at: "2024-01-13T14:20:00Z",
      },
    ];

    // 実行: データ最終検証機能を実行
    const validation_result = validateSalesDataFinal({
      records: sales_data_records,
      target_period_start: "2024-01-01",
      target_period_end: "2024-01-31",
    });

    // 検証: 検証結果レポートを確認
    expect(validation_result.is_valid).toBe(false);
    expect(validation_result.total_records_checked).toBe(4);
    expect(validation_result.records_with_errors).toBe(3);

    // 欠落値検出確認
    expect(validation_result.error_details).toContainEqual(
      expect.objectContaining({
        record_id: "sd_002",
        error_type: "missing_field",
        field_name: "appointment_count",
      })
    );

    expect(validation_result.error_details).toContainEqual(
      expect.objectContaining({
        record_id: "sd_004",
        error_type: "missing_field",
        field_name: "contact_date",
      })
    );

    // 異常値検出確認
    expect(validation_result.error_details).toContainEqual(
      expect.objectContaining({
        record_id: "sd_003",
        error_type: "logical_inconsistency",
        description: "contract_count exceeds appointment_count",
      })
    );

    expect(validation_result.error_details).toContainEqual(
      expect.objectContaining({
        record_id: "sd_003",
        error_type: "invalid_value",
        field_name: "amount",
        description: "amount must be non-negative",
      })
    );

    // 承認フロー進行ブロック確認
    expect(validation_result.can_proceed_to_approval).toBe(false);
    expect(validation_result.approval_status).toBe("blocked");

    // レポート生成スキップ確認
    expect(validation_result.should_generate_report).toBe(false);

    // 検証エラーの詳細が明確に記録されていることを確認
    expect(validation_result.error_details.length).toBe(4);
    expect(validation_result.error_summary).toBe(
      "3 records contain errors: 2 missing fields, 1 logical inconsistency, 1 invalid value"
    );

    // 検証完了タイムスタンプが正しく記録されていることを確認
    expect(validation_result.validation_completed_at).toBeDefined();
    expect(typeof validation_result.validation_completed_at).toBe("string");

    // 成功したレコードも特定されていることを確認
    expect(validation_result.valid_records).toEqual(["sd_001"]);
  });
});