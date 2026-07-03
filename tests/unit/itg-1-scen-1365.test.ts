import { describe, test, expect, beforeEach } from "@jest/globals";
import { generateMonthlySummary } from "../../src/logic/it-1-br-1781935279444-1-2-1";

describe("月次サマリーテンプレートの定義・管理機能", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // SCEN-1365
  test("参照項目が存在しないテンプレートでサマリー生成がエラー中断される", () => {
    const incompleteTemplate = {
      template_id: "tpl_001",
      template_name: "月次サマリー（欠落版）",
      year_month: "2024-01",
      items: [
        {
          item_id: "item_001",
          item_name: "売上合計",
          field_reference: "sales_total",
          display_order: 1,
          calculation_logic: "SUM",
        },
        {
          item_id: "item_002",
          item_name: "成約数",
          field_reference: null,
          display_order: 2,
          calculation_logic: "COUNT",
        },
      ],
    };

    const summaryData = {
      summary_id: "smry_001",
      year_month: "2024-01",
      customer_id: "cust_001",
      service_id: "svc_001",
      generated_at: "2024-01-31T09:00:00Z",
      generated_by: "user_001",
    };

    expect(() => {
      generateMonthlySummary({
        template: incompleteTemplate,
        summary_data: summaryData,
      });
    }).toThrow(/参照項目/);
  });
});