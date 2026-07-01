import { validateInvoiceInput } from "../../src/logic/it-1781935279444-2-1-1";

describe("営業データ入力時の品質検証ルール定義・実行機能", () => {
  // SCEN-1097
  test("請求額が0円の場合、検証ルールの許容範囲として判定されること", () => {
    const invoiceInput = {
      invoice_number: "INV-2024-001",
      billing_date: "2024-01-15",
      billing_target: "Customer A",
      amount: 0,
      service_type: "consulting",
    };

    const result = validateInvoiceInput(invoiceInput);

    expect(result.is_valid).toBe(true);
    expect(result.validation_status).toBe("検証完了");
    expect(result.error_count).toBe(0);
    expect(result.errors).toEqual([]);
    expect(result.amount_in_range).toBe(true);
  });
});