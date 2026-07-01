import { validateReportCompleteness } from "../../src/logic/it-1781935279444-2-2-1";

describe("営業データの完全性・正確性の自動検証", () => {
  // SCEN-1154: [edge] レポート完全性・正確性の自動検証 - レポートに含まれる必須項目がすべて揃っている場合、完全性検証が合格する
  test("すべての必須項目が揃っているレポートの完全性検証が合格する", () => {
    const reportData = {
      sales_amount: 150000,
      customer_id: "CUST001",
      transaction_datetime: "2024-01-15T10:30:00Z",
      product_name: "営業支援ツール A",
      quantity: 5,
      unit_price: 30000,
      total_amount: 150000,
      sales_representative_name: "山田太郎",
      department: "営業部",
      status: "completed",
    };

    const validation_log: string[] = [];

    const result = validateReportCompleteness(reportData, validation_log);

    expect(result.validation_status).toBe("PASS");
    expect(result.is_complete).toBe(true);
    expect(result.missing_fields).toEqual([]);
    expect(result.error_message).toBe("");
    expect(validation_log).toContain("必須項目チェック: 完了");
  });
});