import { validateSalesData } from "../../src/logic/it-1781935279444-2-2-1";

describe("営業データ品質検証 - 金額項目の上限値検証", () => {
  test("SCEN-1133: 金額項目が定義された範囲の上限値と同値のとき検証を通過する", () => {
    // Arrange
    const salesDataRecord = {
      sales_id: "SALES-20240115-001",
      customer_id: "CUST-12345",
      sales_amount: 1000000, // 定義された上限値と同値
      sales_date: "2024-01-15",
      sales_person: "営業太郎",
      service_type: "basic_plan",
      appointment_count: 5,
      contract_count: 2,
      status: "completed"
    };

    const validationRule = {
      field_name: "sales_amount",
      data_type: "number",
      is_required: true,
      min_value: 0,
      max_value: 1000000, // 上限値を定義
      allowed_values: null
    };

    // Act
    const result = validateSalesData(salesDataRecord, validationRule);

    // Assert
    expect(result.is_valid).toBe(true);
    expect(result.error_message).toBe("");
    expect(result.error_code).toBeNull();
    expect(result.field_name).toBe("sales_amount");
    expect(result.validated_value).toBe(1000000);
  });
});