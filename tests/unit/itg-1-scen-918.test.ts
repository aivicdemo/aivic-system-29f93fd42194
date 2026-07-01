import { aggregateMonthlySalesReportSummary } from "../../src/logic/it-1-br-1781935279444-1-2-1";

describe("月次サマリーテンプレート定義・管理機能", () => {
  // SCEN-918: [error] 営業報告書月次サマリー自動集計機能 - サービス種別の不正値検出とエラー通知
  test("should detect invalid service types and notify error with detailed information", () => {
    const invalid_sales_data = [
      {
        id: "sales_001",
        customer_id: "cust_001",
        service_type: "INVALID_SERVICE",
        appointment_count: 5,
        contract_count: 2,
        revenue_amount: 50000,
        record_date: "2024-01-15",
      },
      {
        id: "sales_002",
        customer_id: "cust_002",
        service_type: "",
        appointment_count: 3,
        contract_count: 1,
        revenue_amount: 30000,
        record_date: "2024-01-16",
      },
      {
        id: "sales_003",
        customer_id: "cust_003",
        service_type: null,
        appointment_count: 4,
        contract_count: 2,
        revenue_amount: 40000,
        record_date: "2024-01-17",
      },
    ];

    const valid_service_types = ["SERVICE_A", "SERVICE_B", "SERVICE_C"];
    const month_date = "2024-01";
    const user_id = "user_admin_001";

    const result = aggregateMonthlySalesReportSummary({
      sales_data: invalid_sales_data,
      valid_service_types: valid_service_types,
      target_month: month_date,
      requesting_user_id: user_id,
    });

    expect(result.status).toBe("ERROR");
    expect(result.aggregation_result).toBeNull();
    expect(result.error_notification).toBeDefined();
    expect(result.error_notification.error_code).toBe("INVALID_SERVICE_TYPE");
    expect(result.error_notification.error_details).toBeDefined();
    expect(
      result.error_notification.error_details.invalid_records.length
    ).toBe(3);

    const first_invalid = result.error_notification.error_details
      .invalid_records[0];
    expect(first_invalid.record_id).toBe("sales_001");
    expect(first_invalid.customer_id).toBe("cust_001");
    expect(first_invalid.invalid_value).toBe("INVALID_SERVICE");
    expect(first_invalid.field_name).toBe("service_type");

    const second_invalid = result.error_notification.error_details
      .invalid_records[1];
    expect(second_invalid.record_id).toBe("sales_002");
    expect(second_invalid.invalid_value).toBe("");
    expect(second_invalid.reason).toMatch(/空文字列|empty/i);

    const third_invalid = result.error_notification.error_details
      .invalid_records[2];
    expect(third_invalid.record_id).toBe("sales_003");
    expect(third_invalid.invalid_value).toBeNull();
    expect(third_invalid.reason).toMatch(/null|未定義/i);

    expect(result.error_notification.summary).toMatch(/3件の不正値が検出/);
    expect(result.error_notification.summary).toMatch(/集計処理が中断/);

    expect(result.error_notification.affected_records_count).toBe(3);
    expect(result.error_notification.affected_records_count).toBe(
      result.error_notification.error_details.invalid_records.length
    );

    expect(result.processing_status).toBe("ABORTED");
    expect(result.summary_generated).toBe(false);

    expect(result.error_notification.notification_recipient).toBe(user_id);
    expect(result.error_notification.timestamp).toBeDefined();
    expect(typeof result.error_notification.timestamp).toBe("string");
  });
});