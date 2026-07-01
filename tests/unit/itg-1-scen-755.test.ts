import { generateMonthlySummaryTemplate } from "../../src/logic/it-1-br-1781935279444-1-2-1";

describe("月次サマリーテンプレート定義・管理", () => {
  test("SCEN-755: 参照できない営業データ項目が指定されている場合、テンプレート生成時にエラーが発生する", () => {
    const template_name = "テストテンプレート755";
    const template_items = [
      {
        item_id: "ITEM_001",
        sales_field_id: "INVALID_SALES_FIELD_999",
        display_order: 1,
        calculation_logic: "SUM"
      }
    ];
    const execution_timestamp = new Date("2024-01-15T09:00:00Z");

    expect(() =>
      generateMonthlySummaryTemplate({
        template_name,
        template_items,
        execution_timestamp
      })
    ).toThrow(/INVALID_SALES_FIELD_999/);
  });
});