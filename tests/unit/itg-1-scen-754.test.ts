import { defineMonthlyTemplateSummary, generateMonthlySummaryReport } from "../../src/logic/it-1-br-1781935279444-1-2-1";

describe("月次サマリーテンプレート定義・管理機能", () => {
  // SCEN-754
  test("月次サマリーテンプレートに定義された項目が正確に組み立てられ、各項目の表示順序・計算ロジック・フォーマットが統制される", () => {
    const template_id = "tpl_20250101_001";
    const template_name = "標準営業サマリー202501";
    const organization_id = "org_001";

    // テンプレート項目定義
    const template_items = [
      {
        item_id: "item_001",
        item_name: "売上合計",
        display_order: 1,
        calculation_logic: "SUM",
        calculation_formula: "SUM(service_revenue)",
        format_type: "currency",
        format_pattern: "#,##0.00",
        unit: "JPY",
      },
      {
        item_id: "item_002",
        item_name: "目標売上",
        display_order: 2,
        calculation_logic: "FIXED",
        calculation_formula: "5000000",
        format_type: "currency",
        format_pattern: "#,##0.00",
        unit: "JPY",
      },
      {
        item_id: "item_003",
        item_name: "達成率",
        display_order: 3,
        calculation_logic: "FORMULA",
        calculation_formula: "(売上合計/目標売上)*100",
        format_type: "percentage",
        format_pattern: "0.0%",
        unit: "percent",
      },
      {
        item_id: "item_004",
        item_name: "成約件数",
        display_order: 4,
        calculation_logic: "COUNT",
        calculation_formula: "COUNT(contracts)",
        format_type: "number",
        format_pattern: "0",
        unit: "count",
      },
    ];

    // テンプレート定義
    const defined_template = defineMonthlyTemplateSummary({
      template_id,
      template_name,
      organization_id,
      items: template_items,
      version: "1.0",
      created_at: new Date("2025-01-01T00:00:00Z"),
      updated_at: new Date("2025-01-01T00:00:00Z"),
      is_active: true,
    });

    // テンプレート定義の検証
    expect(defined_template.template_id).toBe(template_id);
    expect(defined_template.template_name).toBe(template_name);
    expect(defined_template.organization_id).toBe(organization_id);
    expect(defined_template.is_active).toBe(true);

    // 項目数検証
    expect(defined_template.items.length).toBe(4);

    // 表示順序検証
    expect(defined_template.items[0].display_order).toBe(1);
    expect(defined_template.items[1].display_order).toBe(2);
    expect(defined_template.items[2].display_order).toBe(3);
    expect(defined_template.items[3].display_order).toBe(4);

    // 項目名検証
    expect(defined_template.items[0].item_name).toBe("売上合計");
    expect(defined_template.items[1].item_name).toBe("目標売上");
    expect(defined_template.items[2].item_name).toBe("達成率");
    expect(defined_template.items[3].item_name).toBe("成約件数");

    // 売上合計の計算ロジック検証
    expect(defined_template.items[0].calculation_logic).toBe("SUM");
    expect(defined_template.items[0].calculation_formula).toBe("SUM(service_revenue)");

    // 達成率の計算ロジック検証
    expect(defined_template.items[2].calculation_logic).toBe("FORMULA");
    expect(defined_template.items[2].calculation_formula).toBe("(売上合計/目標売上)*100");

    // 金額フォーマット検証（売上合計）
    expect(defined_template.items[0].format_type).toBe("currency");
    expect(defined_template.items[0].format_pattern).toBe("#,##0.00");
    expect(defined_template.items[0].unit).toBe("JPY");

    // パーセンテージフォーマット検証（達成率）
    expect(defined_template.items[2].format_type).toBe("percentage");
    expect(defined_template.items[2].format_pattern).toBe("0.0%");
    expect(defined_template.items[2].unit).toBe("percent");

    // 月次営業データ
    const monthly_data = {
      period: "202501",
      organization_id,
      data_rows: [
        {
          customer_id: "cust_001",
          service_id: "svc_001",
          service_revenue: 1500000,
        },
        {
          customer_id: "cust_002",
          service_id: "svc_002",
          service_revenue: 2000000,
        },
        {
          customer_id: "cust_003",
          service_id: "svc_001",
          service_revenue: 1200000,
        },
      ],
      contracts: [
        { contract_id: "contract_001", amount: 1500000 },
        { contract_id: "contract_002", amount: 2000000 },
        { contract_id: "contract_003", amount: 1200000 },
      ],
    };

    // レポート生成
    const generated_report = generateMonthlySummaryReport({
      template_id,
      template_name,
      template_items,
      monthly_data,
      generated_at: new Date("2025-02-01T09:00:00Z"),
    });

    // レポート基本情報検証
    expect(generated_report.template_id).toBe(template_id);
    expect(generated_report.template_name).toBe(template_name);
    expect(generated_report.period).toBe("202501");

    // レポート項目数検証
    expect(generated_report.report_items.length).toBe(4);

    // 項目配置検証
    expect(generated_report.report_items[0].item_name).toBe("売上合計");
    expect(generated_report.report_items[0].display_order).toBe(1);
    expect(generated_report.report_items[1].item_name).toBe("目標売上");
    expect(generated_report.report_items[1].display_order).toBe(2);
    expect(generated_report.report_items[2].item_name).toBe("達成率");
    expect(generated_report.report_items[2].display_order).toBe(3);
    expect(generated_report.report_items[3].item_name).toBe("成約件数");
    expect(generated_report.report_items[3].display_order).toBe(4);

    // 売上合計計算結果検証 (1500000 + 2000000 + 1200000 = 4700000)
    const sales_total_value = generated_report.report_items[0].calculated_value;
    expect(sales_total_value).toBe(4700000);

    // 目標売上検証
    const target_sales_value = generated_report.report_items[1].calculated_value;
    expect(target_sales_value).toBe(5000000);

    // 達成率計算結果検証 (4700000 / 5000000 * 100 = 94.0)
    const achievement_rate_value = generated_report.report_items[2].calculated_value;
    expect(achievement_rate_value).toBe(94.0);

    // 成約件数計算結果検証
    const contract_count_value = generated_report.report_items[3].calculated_value;
    expect(contract_count_value).toBe(3);

    // 売上合計フォーマット検証
    const sales_formatted = generated_report.report_items[0].formatted_value;
    expect(sales_formatted).toBe("4,700,000.00");

    // 目標売上フォーマット検証
    const target_formatted = generated_report.report_items[1].formatted_value;
    expect(target_formatted).toBe("5,000,000.00");

    // 達成率フォーマット検証
    const achievement_formatted = generated_report.report_items[2].formatted_value;
    expect(achievement_formatted).toBe("94.0%");

    // 成約件数フォーマット検証
    const count_formatted = generated_report.report_items[3].formatted_value;
    expect(count_formatted).toBe("3");

    // レポート全体の整合性検証
    expect(generated_report.report_items).toHaveLength(4);
    expect(generated_report.report_items.every((item) => item.formatted_value)).toBe(
      true
    );
  });
});