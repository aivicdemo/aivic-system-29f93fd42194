import { validateSalesData } from "../../src/logic/it-1781935279444-2-2-1";

describe("営業データの完全性・正確性を自動検証し、不足データ・誤りを検出・通知する機能", () => {
  test("SCEN-715: [edge] 営業データ完全性・正確性検証 - 金額が0円で検証OK判定となる", () => {
    // Arrange: 金額が0円の営業データを準備
    const sales_data_input = {
      customer_id: "CUST001",
      service_id: "SVC001",
      contact_date: "2024-01-15",
      contact_type: "appointment",
      appointment_confirmed: true,
      amount: 0,
      sales_staff_id: "STAFF001",
      notes: "Zero amount test case",
    };

    // Act: データ検証機能を実行
    const validation_result = validateSalesData(sales_data_input);

    // Assert: 金額が0円でも検証がOK判定されることを確認
    expect(validation_result.is_valid).toBe(true);
    expect(validation_result.validation_status).toBe("合格");
    expect(validation_result.errors).toEqual([]);
    expect(validation_result.warnings).toEqual([]);
    expect(validation_result.amount_checked).toBe(0);
    expect(typeof validation_result.checked_at).toBe("string");
  });
});