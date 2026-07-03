import { validateSalesData } from "../../src/logic/it-1781935279444-2-2-1";

describe("営業データの完全性・正確性を自動検証し、不足データ・誤りを検出・通知する機能", () => {
  // SCEN-1249
  test("すべての検証ルール定義を満たす営業データが入力された場合、検証が正常に完了し、次工程へ自動進行フラグが正しく設定される", () => {
    const valid_sales_data = {
      sales_data_id: "SD20240115001",
      customer_id: "CUST00001",
      contact_date: "2024-01-15",
      contact_time: "14:30",
      contact_type: "電話",
      outcome: "アポ確定",
      appointment_confirmed: true,
      service_type: "営業支援",
      amount: 50000,
      notes: "顧客との初回面談実施",
      created_at: "2024-01-15T11:00:00Z",
      created_by: "sales_user_001",
    };

    const result = validateSalesData(valid_sales_data);

    expect(result.is_valid).toBe(true);
    expect(result.validation_errors).toEqual([]);
    expect(result.validation_warnings).toEqual([]);
    expect(result.proceed_to_next_process).toBe(true);
    expect(result.status).toBe("APPROVED");
    expect(result.validated_at).toBeDefined();
    expect(result.validation_rules_checked).toBeGreaterThan(0);
    expect(result.audit_log_recorded).toBe(true);
  });

  test("必須項目が欠落している場合、検証が不合格となり、次工程フラグが設定されない", () => {
    const invalid_sales_data_missing_customer = {
      sales_data_id: "SD20240115002",
      contact_date: "2024-01-15",
      contact_time: "14:30",
      contact_type: "電話",
      outcome: "アポ確定",
      appointment_confirmed: true,
      service_type: "営業支援",
      amount: 50000,
    };

    expect(() => validateSalesData(invalid_sales_data_missing_customer)).toThrow(
      /顧客ID/
    );
  });

  test("データ型が不正な場合、検証が不合格となり、次工程フラグが設定されない", () => {
    const invalid_sales_data_wrong_type = {
      sales_data_id: "SD20240115003",
      customer_id: "CUST00001",
      contact_date: "2024-01-15",
      contact_time: "14:30",
      contact_type: "電話",
      outcome: "アポ確定",
      appointment_confirmed: true,
      service_type: "営業支援",
      amount: "50000",
    };

    expect(() => validateSalesData(invalid_sales_data_wrong_type)).toThrow(
      /金額/
    );
  });

  test("値の範囲外の場合、検証が不合格となり、次工程フラグが設定されない", () => {
    const invalid_sales_data_out_of_range = {
      sales_data_id: "SD20240115004",
      customer_id: "CUST00001",
      contact_date: "2024-01-15",
      contact_time: "14:30",
      contact_type: "電話",
      outcome: "アポ確定",
      appointment_confirmed: true,
      service_type: "営業支援",
      amount: -10000,
      notes: "test",
    };

    expect(() => validateSalesData(invalid_sales_data_out_of_range)).toThrow(
      /金額/
    );
  });

  test("日付形式が不正な場合、検証が不合格となり、次工程フラグが設定されない", () => {
    const invalid_sales_data_bad_date = {
      sales_data_id: "SD20240115005",
      customer_id: "CUST00001",
      contact_date: "2024/01/15",
      contact_time: "14:30",
      contact_type: "電話",
      outcome: "アポ確定",
      appointment_confirmed: true,
      service_type: "営業支援",
      amount: 50000,
    };

    expect(() => validateSalesData(invalid_sales_data_bad_date)).toThrow(
      /日付/
    );
  });

  test("重複チェック対象のデータが既に存在する場合、検証が不合格となり、次工程フラグが設定されない", () => {
    const duplicate_sales_data = {
      sales_data_id: "SD20240115001",
      customer_id: "CUST00001",
      contact_date: "2024-01-15",
      contact_time: "14:30",
      contact_type: "電話",
      outcome: "アポ確定",
      appointment_confirmed: true,
      service_type: "営業支援",
      amount: 50000,
    };

    expect(() => validateSalesData(duplicate_sales_data)).toThrow(
      /重複/
    );
  });

  test("すべての検証ルール定義を満たすデータの場合、監査ログに自動進行フラグ設定イベントが記録される", () => {
    const valid_sales_data_with_audit = {
      sales_data_id: "SD20240115006",
      customer_id: "CUST00002",
      contact_date: "2024-01-16",
      contact_time: "10:00",
      contact_type: "メール",
      outcome: "見送り",
      appointment_confirmed: false,
      service_type: "コンサルティング",
      amount: 75000,
      notes: "フォローアップ予定",
      created_at: "2024-01-16T09:30:00Z",
      created_by: "sales_user_002",
    };

    const result = validateSalesData(valid_sales_data_with_audit);

    expect(result.proceed_to_next_process).toBe(true);
    expect(result.audit_log_recorded).toBe(true);
    expect(result.audit_log_entry).toBeDefined();
    expect(result.audit_log_entry.event_type).toBe("PROCEED_FLAG_SET");
    expect(result.audit_log_entry.timestamp).toBeDefined();
    expect(result.audit_log_entry.record_id).toBe("SD20240115006");
  });

  test("複数の検証ルール項目がすべてパスしたことが個別に確認できる", () => {
    const valid_sales_data_detailed = {
      sales_data_id: "SD20240115007",
      customer_id: "CUST00003",
      contact_date: "2024-01-17",
      contact_time: "15:45",
      contact_type: "対面",
      outcome: "アポ確定",
      appointment_confirmed: true,
      service_type: "マーケティング支援",
      amount: 100000,
      notes: "契約提案実施",
      created_at: "2024-01-17T15:00:00Z",
      created_by: "sales_user_003",
    };

    const result = validateSalesData(valid_sales_data_detailed);

    expect(result.validation_rule_results).toBeDefined();
    expect(result.validation_rule_results.required_fields_check).toBe(true);
    expect(result.validation_rule_results.data_type_check).toBe(true);
    expect(result.validation_rule_results.range_check).toBe(true);
    expect(result.validation_rule_results.duplicate_check).toBe(true);
    expect(result.validation_rule_results.date_format_check).toBe(true);
    expect(result.is_valid).toBe(true);
    expect(result.proceed_to_next_process).toBe(true);
  });

  test("検証完了後、後続処理へのルーティング情報が正しく設定される", () => {
    const valid_sales_data_routing = {
      sales_data_id: "SD20240115008",
      customer_id: "CUST00004",
      contact_date: "2024-01-18",
      contact_time: "11:15",
      contact_type: "電話",
      outcome: "アポ確定",
      appointment_confirmed: true,
      service_type: "営業支援",
      amount: 60000,
      notes: "初期相談完了",
      created_at: "2024-01-18T11:00:00Z",
      created_by: "sales_user_004",
    };

    const result = validateSalesData(valid_sales_data_routing);

    expect(result.next_process_routing).toBeDefined();
    expect(result.next_process_routing.target_process).toBe("invoice_calculation");
    expect(result.next_process_routing.priority_level).toBe("normal");
    expect(result.next_process_routing.scheduled_execution_time).toBeDefined();
    expect(result.proceed_to_next_process).toBe(true);
  });
});