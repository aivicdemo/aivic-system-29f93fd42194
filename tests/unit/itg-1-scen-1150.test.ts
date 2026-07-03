import { validateSalesData } from "../../src/logic/it-1781935279444-2-2-1";

describe("営業データ品質検証・エラー検出機能", () => {
  // SCEN-1150
  test("データ型不整合を検出し詳細エラー内容が記録される", () => {
    const input_salesData = {
      sales_amount: "ABC123",
      customer_id: "2024-01-15",
      transaction_date: "2024-01-15",
      quantity: 5,
      service_type: "Premium",
    };

    const result = validateSalesData(input_salesData);

    expect(result.is_valid).toBe(false);
    expect(result.errors).toHaveLength(2);

    const sales_amount_error = result.errors.find(
      (err: any) => err.field_name === "sales_amount"
    );
    expect(sales_amount_error).toBeDefined();
    expect(sales_amount_error.expected_type).toBe("number");
    expect(sales_amount_error.actual_value).toBe("ABC123");
    expect(sales_amount_error.severity_level).toBe("HIGH");
    expect(sales_amount_error.error_timestamp).toMatch(
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/
    );

    const customer_id_error = result.errors.find(
      (err: any) => err.field_name === "customer_id"
    );
    expect(customer_id_error).toBeDefined();
    expect(customer_id_error.expected_type).toBe("number");
    expect(customer_id_error.actual_value).toBe("2024-01-15");
    expect(customer_id_error.severity_level).toBe("HIGH");
    expect(customer_id_error.error_timestamp).toMatch(
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/
    );

    expect(result.error_log_persisted).toBe(true);
  });
});