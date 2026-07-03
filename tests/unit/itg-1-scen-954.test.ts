import { validateSalesData } from "../../src/logic/it-1781935279444-2-2-1";

describe("営業成果データの自動検証", () => {
  // SCEN-954: [error] 営業成果データの自動検証 - 必須項目が複数欠落している場合、すべての欠落項目を検証エラーとして通知できる
  test("複数の必須項目が欠落している場合、すべての欠落項目に対する個別の検証エラーを返す", () => {
    const input_data = {
      customer_name: "",
      transaction_amount: "",
      contract_date: "",
      sales_representative: "",
      service_type: "basic",
      contact_date: "2024-01-15T10:00:00Z",
    };

    const result = validateSalesData(input_data);

    expect(result.is_valid).toBe(false);
    expect(result.error_messages).toHaveLength(4);
    expect(result.error_messages).toContain("顧客名");
    expect(result.error_messages).toContain("取引金額");
    expect(result.error_messages).toContain("契約日");
    expect(result.error_messages).toContain("営業担当者");
    expect(result.validation_errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ field: "customer_name" }),
        expect.objectContaining({ field: "transaction_amount" }),
        expect.objectContaining({ field: "contract_date" }),
        expect.objectContaining({ field: "sales_representative" }),
      ])
    );
  });
});