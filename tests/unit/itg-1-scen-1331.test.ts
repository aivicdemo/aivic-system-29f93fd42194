import { generateMonthlySummary } from "../../src/logic/it-1-br-1781935279444-1-2-1";

describe("月次サマリーテンプレート定義・管理", () => {
  test("SCEN-1331: テンプレートに定義された全項目が月次サマリーに正しく集計・配置される", () => {
    // テンプレート定義：複数の集計項目
    const templateDefinition = {
      template_id: "tpl_monthly_001",
      template_name: "標準月次サマリー",
      items: [
        {
          item_id: "item_total_sales",
          item_name: "売上合計",
          aggregation_rule: "SUM",
          source_field: "sales_amount",
          position_row: 1,
          position_col: 1,
        },
        {
          item_id: "item_transaction_count",
          item_name: "取引件数",
          aggregation_rule: "COUNT",
          source_field: "transaction_id",
          position_row: 1,
          position_col: 2,
        },
        {
          item_id: "item_average_sales",
          item_name: "平均売上",
          aggregation_rule: "AVG",
          source_field: "sales_amount",
          position_row: 2,
          position_col: 1,
        },
        {
          item_id: "item_category_a_sales",
          item_name: "カテゴリA売上",
          aggregation_rule: "SUM",
          source_field: "sales_amount",
          filter_condition: { category: "A" },
          position_row: 2,
          position_col: 2,
        },
      ],
    };

    // 月次営業データ
    const monthlyData = {
      period: "2024-01",
      records: [
        {
          transaction_id: "tx_001",
          sales_amount: 100000,
          category: "A",
        },
        {
          transaction_id: "tx_002",
          sales_amount: 150000,
          category: "B",
        },
        {
          transaction_id: "tx_003",
          sales_amount: 120000,
          category: "A",
        },
        {
          transaction_id: "tx_004",
          sales_amount: 80000,
          category: "C",
        },
      ],
    };

    // 月次サマリー生成処理を実行
    const generatedSummary = generateMonthlySummary(
      templateDefinition,
      monthlyData
    );

    // (1) 定義された全項目が漏れなくサマリーに表示されることを検証
    expect(generatedSummary.summary_items).toHaveLength(4);
    expect(generatedSummary.summary_items.map((item) => item.item_id)).toEqual(
      [
        "item_total_sales",
        "item_transaction_count",
        "item_average_sales",
        "item_category_a_sales",
      ]
    );

    // (2) 各項目の集計ルールに基づいた正確な集計値が反映されることを検証
    // 売上合計: 100000 + 150000 + 120000 + 80000 = 450000
    const totalSalesItem = generatedSummary.summary_items.find(
      (item) => item.item_id === "item_total_sales"
    );
    expect(totalSalesItem).toBeDefined();
    expect(totalSalesItem?.aggregated_value).toBe(450000);

    // 取引件数: 4件
    const transactionCountItem = generatedSummary.summary_items.find(
      (item) => item.item_id === "item_transaction_count"
    );
    expect(transactionCountItem).toBeDefined();
    expect(transactionCountItem?.aggregated_value).toBe(4);

    // 平均売上: 450000 / 4 = 112500
    const averageSalesItem = generatedSummary.summary_items.find(
      (item) => item.item_id === "item_average_sales"
    );
    expect(averageSalesItem).toBeDefined();
    expect(averageSalesItem?.aggregated_value).toBe(112500);

    // カテゴリA売上: 100000 + 120000 = 220000
    const categoryASalesItem = generatedSummary.summary_items.find(
      (item) => item.item_id === "item_category_a_sales"
    );
    expect(categoryASalesItem).toBeDefined();
    expect(categoryASalesItem?.aggregated_value).toBe(220000);

    // (3) 各項目がテンプレートで指定された行・列の位置に正しく配置されることを検証
    expect(totalSalesItem?.position_row).toBe(1);
    expect(totalSalesItem?.position_col).toBe(1);

    expect(transactionCountItem?.position_row).toBe(1);
    expect(transactionCountItem?.position_col).toBe(2);

    expect(averageSalesItem?.position_row).toBe(2);
    expect(averageSalesItem?.position_col).toBe(1);

    expect(categoryASalesItem?.position_row).toBe(2);
    expect(categoryASalesItem?.position_col).toBe(2);

    // (4) レポートに必要な汎用フィールドが存在することを確認
    expect(generatedSummary.summary_id).toBeDefined();
    expect(generatedSummary.template_id).toBe("tpl_monthly_001");
    expect(generatedSummary.period).toBe("2024-01");
    expect(generatedSummary.generated_at).toBeDefined();

    // 複数テンプレートでの動作確認：異なる集計ルールを持つテンプレート
    const alternateTemplateDefinition = {
      template_id: "tpl_monthly_002",
      template_name: "詳細月次サマリー",
      items: [
        {
          item_id: "item_max_sales",
          item_name: "最大売上",
          aggregation_rule: "MAX",
          source_field: "sales_amount",
          position_row: 1,
          position_col: 1,
        },
        {
          item_id: "item_min_sales",
          item_name: "最小売上",
          aggregation_rule: "MIN",
          source_field: "sales_amount",
          position_row: 1,
          position_col: 2,
        },
      ],
    };

    const alternateGeneratedSummary = generateMonthlySummary(
      alternateTemplateDefinition,
      monthlyData
    );

    // 最大売上: 150000
    const maxSalesItem = alternateGeneratedSummary.summary_items.find(
      (item) => item.item_id === "item_max_sales"
    );
    expect(maxSalesItem).toBeDefined();
    expect(maxSalesItem?.aggregated_value).toBe(150000);

    // 最小売上: 80000
    const minSalesItem = alternateGeneratedSummary.summary_items.find(
      (item) => item.item_id === "item_min_sales"
    );
    expect(minSalesItem).toBeDefined();
    expect(minSalesItem?.aggregated_value).toBe(80000);

    // 複数テンプレートでも位置指定が正しく機能
    expect(maxSalesItem?.position_row).toBe(1);
    expect(maxSalesItem?.position_col).toBe(1);
    expect(minSalesItem?.position_row).toBe(1);
    expect(minSalesItem?.position_col).toBe(2);
  });
});