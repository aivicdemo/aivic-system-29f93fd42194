import { validateMonthlySummaryTemplate } from "../../src/logic/it-1-br-1781935279444-1-2-1";

describe("月次サマリーテンプレートの定義・管理機能", () => {
  test("SCEN-1043: 月次サマリーテンプレートに必須項目が不足している場合、エラーとして検出される", () => {
    const incompleteTemplate = {
      template_name: "テンプレート名のみ入力",
      template_id: "tpl_incomplete_001",
      aggregation_period: undefined,
      aggregation_target_items: undefined,
      output_format: undefined,
      created_at: "2024-01-15T09:00:00Z",
      status: "invalid" as const,
    };

    expect(() =>
      validateMonthlySummaryTemplate(incompleteTemplate)
    ).toThrow(/集計期間/);

    const incompleteTemplate2 = {
      template_name: "テンプレート名",
      template_id: "tpl_incomplete_002",
      aggregation_period: "2024-01",
      aggregation_target_items: undefined,
      output_format: undefined,
      created_at: "2024-01-15T09:00:00Z",
      status: "invalid" as const,
    };

    expect(() =>
      validateMonthlySummaryTemplate(incompleteTemplate2)
    ).toThrow(/集計対象項目/);

    const incompleteTemplate3 = {
      template_name: "テンプレート名",
      template_id: "tpl_incomplete_003",
      aggregation_period: "2024-01",
      aggregation_target_items: ["apo_count", "deal_count"],
      output_format: undefined,
      created_at: "2024-01-15T09:00:00Z",
      status: "invalid" as const,
    };

    expect(() =>
      validateMonthlySummaryTemplate(incompleteTemplate3)
    ).toThrow(/出力形式/);

    const completeTemplate = {
      template_name: "完全なテンプレート",
      template_id: "tpl_complete_001",
      aggregation_period: "2024-01",
      aggregation_target_items: ["apo_count", "deal_count", "customer_response"],
      output_format: "pdf",
      created_at: "2024-01-15T09:00:00Z",
      status: "valid" as const,
    };

    const result = validateMonthlySummaryTemplate(completeTemplate);
    expect(result).toEqual({
      is_valid: true,
      status: "valid",
      template_id: "tpl_complete_001",
      error_details: null,
    });
  });
});