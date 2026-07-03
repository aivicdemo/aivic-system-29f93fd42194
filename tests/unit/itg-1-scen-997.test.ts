import { defineMonthlyReportTemplate } from "../../src/logic/it-1-br-1781935279444-1-2-1";

describe("月次サマリーテンプレートの定義・管理機能", () => {
  test("SCEN-997: 営業データ抽出・集計ルール定義 - 月次サマリーレポートの構成要素と出力形式が正確に確定される", () => {
    // Precondition: 営業データ品質管理・請求自動化システムにログインし、営業データ抽出・集計ルール定義画面にアクセス
    const user_id = "user_001";
    const organization_id = "org_001";

    // Template configuration input with all required elements
    const template_config = {
      template_id: "tmpl_monthly_summary_001",
      template_name: "月次営業成果サマリーレポート",
      organization_id: organization_id,
      created_by: user_id,
      created_at: new Date("2024-01-15T09:00:00Z"),
      effective_from: new Date("2024-01-01T00:00:00Z"),
      output_formats: ["PDF", "Excel", "CSV"],
      components: [
        {
          component_id: "comp_001",
          component_name: "売上金額集計",
          component_type: "summary_metric",
          display_order: 1,
          calculation_logic: "SUM(sales_amount)",
          unit: "JPY",
          decimal_places: 0,
        },
        {
          component_id: "comp_002",
          component_name: "件数集計",
          component_type: "summary_metric",
          display_order: 2,
          calculation_logic: "COUNT(transaction_id)",
          unit: "件",
          decimal_places: 0,
        },
        {
          component_id: "comp_003",
          component_name: "部門別集計",
          component_type: "breakdown_table",
          display_order: 3,
          calculation_logic: "GROUP_BY(department)",
          dimensions: ["department", "sales_amount", "count"],
          aggregate_functions: ["SUM", "COUNT"],
        },
        {
          component_id: "comp_004",
          component_name: "顧客別集計",
          component_type: "breakdown_table",
          display_order: 4,
          calculation_logic: "GROUP_BY(customer_id)",
          dimensions: ["customer_id", "customer_name", "sales_amount", "count"],
          aggregate_functions: ["SUM", "COUNT"],
        },
        {
          component_id: "comp_005",
          component_name: "平均単価",
          component_type: "summary_metric",
          display_order: 5,
          calculation_logic: "AVG(sales_amount / count)",
          unit: "JPY",
          decimal_places: 2,
        },
      ],
      header_config: {
        title: "月次営業成果サマリーレポート",
        report_period: "当月",
        organization_name_display: true,
        generation_date_display: true,
      },
      footer_config: {
        page_number_display: true,
        total_page_display: true,
        generated_by_display: true,
        generated_timestamp_display: true,
      },
      page_layout: {
        page_size: "A4",
        page_orientation: "portrait",
        margin_top_mm: 20,
        margin_bottom_mm: 20,
        margin_left_mm: 15,
        margin_right_mm: 15,
      },
      aggregation_rules: [
        {
          rule_id: "agg_rule_001",
          rule_name: "月次合計集計",
          aggregation_type: "SUM",
          target_fields: ["sales_amount"],
        },
        {
          rule_id: "agg_rule_002",
          rule_name: "取引件数集計",
          aggregation_type: "COUNT",
          target_fields: ["transaction_id"],
        },
        {
          rule_id: "agg_rule_003",
          rule_name: "部門別分類集計",
          aggregation_type: "GROUP_BY",
          target_fields: ["department"],
          nested_aggregations: ["SUM(sales_amount)", "COUNT(transaction_id)"],
        },
      ],
      status: "active",
    };

    // Trigger: defineMonthlyReportTemplate を呼び出して月次サマリーテンプレートを定義
    const result = defineMonthlyReportTemplate(template_config);

    // Expected Outcome: テンプレート定義が正確に確定され、生成可能な状態になる
    expect(result).toBeDefined();
    expect(result.template_id).toBe("tmpl_monthly_summary_001");
    expect(result.template_name).toBe("月次営業成果サマリーレポート");
    expect(result.organization_id).toBe(organization_id);

    // Verify output formats are properly set
    expect(result.output_formats).toEqual(["PDF", "Excel", "CSV"]);
    expect(result.output_formats).toHaveLength(3);

    // Verify components are correctly ordered and configured
    expect(result.components).toHaveLength(5);
    expect(result.components[0].component_name).toBe("売上金額集計");
    expect(result.components[0].display_order).toBe(1);
    expect(result.components[0].calculation_logic).toBe("SUM(sales_amount)");

    expect(result.components[1].component_name).toBe("件数集計");
    expect(result.components[1].display_order).toBe(2);
    expect(result.components[1].calculation_logic).toBe("COUNT(transaction_id)");

    expect(result.components[2].component_name).toBe("部門別集計");
    expect(result.components[2].display_order).toBe(3);
    expect(result.components[2].component_type).toBe("breakdown_table");
    expect(result.components[2].dimensions).toEqual([
      "department",
      "sales_amount",
      "count",
    ]);

    expect(result.components[3].component_name).toBe("顧客別集計");
    expect(result.components[3].display_order).toBe(4);
    expect(result.components[3].dimensions).toEqual([
      "customer_id",
      "customer_name",
      "sales_amount",
      "count",
    ]);

    expect(result.components[4].component_name).toBe("平均単価");
    expect(result.components[4].display_order).toBe(5);
    expect(result.components[4].decimal_places).toBe(2);

    // Verify header configuration
    expect(result.header_config.title).toBe("月次営業成果サマリーレポート");
    expect(result.header_config.report_period).toBe("当月");
    expect(result.header_config.organization_name_display).toBe(true);
    expect(result.header_config.generation_date_display).toBe(true);

    // Verify footer configuration
    expect(result.footer_config.page_number_display).toBe(true);
    expect(result.footer_config.total_page_display).toBe(true);
    expect(result.footer_config.generated_by_display).toBe(true);
    expect(result.footer_config.generated_timestamp_display).toBe(true);

    // Verify page layout configuration
    expect(result.page_layout.page_size).toBe("A4");
    expect(result.page_layout.page_orientation).toBe("portrait");
    expect(result.page_layout.margin_top_mm).toBe(20);
    expect(result.page_layout.margin_bottom_mm).toBe(20);
    expect(result.page_layout.margin_left_mm).toBe(15);
    expect(result.page_layout.margin_right_mm).toBe(15);

    // Verify aggregation rules are correctly set
    expect(result.aggregation_rules).toHaveLength(3);
    expect(result.aggregation_rules[0].rule_name).toBe("月次合計集計");
    expect(result.aggregation_rules[0].aggregation_type).toBe("SUM");
    expect(result.aggregation_rules[0].target_fields).toEqual(["sales_amount"]);

    expect(result.aggregation_rules[1].rule_name).toBe("取引件数集計");
    expect(result.aggregation_rules[1].aggregation_type).toBe("COUNT");

    expect(result.aggregation_rules[2].rule_name).toBe("部門別分類集計");
    expect(result.aggregation_rules[2].aggregation_type).toBe("GROUP_BY");
    expect(result.aggregation_rules[2].nested_aggregations).toEqual([
      "SUM(sales_amount)",
      "COUNT(transaction_id)",
    ]);

    // Verify template status is active and ready for report generation
    expect(result.status).toBe("active");
    expect(result.created_by).toBe(user_id);
    expect(result.created_at).toEqual(new Date("2024-01-15T09:00:00Z"));
    expect(result.effective_from).toEqual(new Date("2024-01-01T00:00:00Z"));

    // Verify that the template can be used to generate reports with these exact specifications
    expect(result.is_valid).toBe(true);
    expect(result.can_generate_report).toBe(true);
  });
});