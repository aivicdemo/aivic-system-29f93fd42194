import { validateStandardFormatConversion } from "../../src/logic/it-1-br-1781935279444-1-2-1";

describe("月次サマリーテンプレートの定義・管理機能", () => {
  // SCEN-1144: [normal] 標準フォーマット変換検証
  test("標準フォーマット変換検証 - 営業データ項目が標準レポートフォーマットに正確にマッピングされ、変換ルールが検証される", () => {
    const salesData = {
      customer_name: "ABC株式会社",
      sales_amount: 250000,
      transaction_date: "2024-01-15",
      product_category: "ソフトウェアライセンス",
    };

    const conversionRules = {
      customer_name: { target_field: "顧客名", data_type: "string" },
      sales_amount: {
        target_field: "売上金額",
        data_type: "number",
        format: "currency",
      },
      transaction_date: {
        target_field: "取引日",
        data_type: "date",
        format: "YYYY-MM-DD",
      },
      product_category: { target_field: "商品区分", data_type: "string" },
    };

    const result = validateStandardFormatConversion(salesData, conversionRules);

    expect(result).toBeDefined();
    expect(result.is_valid).toBe(true);
    expect(result.mapped_data).toEqual({
      顧客名: "ABC株式会社",
      売上金額: 250000,
      取引日: "2024-01-15",
      商品区分: "ソフトウェアライセンス",
    });
    expect(result.conversion_errors).toEqual([]);
    expect(result.data_integrity_check).toBe(true);
    expect(result.data_completeness).toBe(true);
    expect(result.format_validation_status).toBe("success");
    expect(result.applied_rules_count).toBe(4);
    expect(result.output_format).toEqual({
      顧客名: "ABC株式会社",
      売上金額: "¥250,000",
      取引日: "2024-01-15",
      商品区分: "ソフトウェアライセンス",
    });
  });
});