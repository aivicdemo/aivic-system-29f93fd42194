import {
  createMonthlySummaryTemplate,
  updateMonthlySummaryTemplateItem,
  generateMonthlySummaryReport,
} from "../../src/logic/it-1-br-1781935279444-1-2-1";

describe("月次サマリーテンプレート定義・管理", () => {
  test("SCEN-1332: テンプレート項目の表示順序と計算ロジックが正しく反映される", () => {
    // テンプレート作成: 売上、原価、粗利益、粗利益率を定義順序通りに追加
    const template_id = "tpl_20240201_001";
    const organization_id = "org_12345";

    const template_definition = {
      template_id: template_id,
      organization_id: organization_id,
      template_name: "月次営業成果サマリー",
      template_items: [
        {
          item_sequence: 1,
          item_name: "売上",
          item_key: "revenue",
          data_type: "number",
          calculation_formula: null,
          display_format: "currency_jpy",
          is_required: true,
        },
        {
          item_sequence: 2,
          item_name: "原価",
          item_key: "cost",
          data_type: "number",
          calculation_formula: null,
          display_format: "currency_jpy",
          is_required: true,
        },
        {
          item_sequence: 3,
          item_name: "粗利益",
          item_key: "gross_profit",
          data_type: "number",
          calculation_formula: "revenue - cost",
          display_format: "currency_jpy",
          is_required: false,
        },
        {
          item_sequence: 4,
          item_name: "粗利益率",
          item_key: "gross_profit_ratio",
          data_type: "number",
          calculation_formula: "(revenue - cost) / revenue * 100",
          display_format: "percent_2dp",
          is_required: false,
        },
      ],
    };

    // テンプレート作成実行
    const created_template = createMonthlySummaryTemplate({
      template_id: template_definition.template_id,
      organization_id: template_definition.organization_id,
      template_name: template_definition.template_name,
      template_items: template_definition.template_items,
    });

    // 作成結果の検証: 項目の表示順序が定義通り
    expect(created_template.template_id).toBe("tpl_20240201_001");
    expect(created_template.template_items.length).toBe(4);
    expect(created_template.template_items[0].item_sequence).toBe(1);
    expect(created_template.template_items[0].item_name).toBe("売上");
    expect(created_template.template_items[1].item_sequence).toBe(2);
    expect(created_template.template_items[1].item_name).toBe("原価");
    expect(created_template.template_items[2].item_sequence).toBe(3);
    expect(created_template.template_items[2].item_name).toBe("粗利益");
    expect(created_template.template_items[3].item_sequence).toBe(4);
    expect(created_template.template_items[3].item_name).toBe("粗利益率");

    // テンプレート項目の計算ロジック検証
    expect(created_template.template_items[2].calculation_formula).toBe(
      "revenue - cost"
    );
    expect(created_template.template_items[3].calculation_formula).toBe(
      "(revenue - cost) / revenue * 100"
    );

    // サンプルデータ1: 売上1000万円、原価600万円の場合
    const sample_data_1 = {
      template_id: template_id,
      revenue: 10000000,
      cost: 6000000,
    };

    const report_1 = generateMonthlySummaryReport({
      template_id: sample_data_1.template_id,
      monthly_data: sample_data_1,
    });

    // 計算結果の検証: 粗利益 = 10000000 - 6000000 = 4000000
    expect(report_1.report_items[0].item_name).toBe("売上");
    expect(report_1.report_items[0].item_value).toBe(10000000);
    expect(report_1.report_items[1].item_name).toBe("原価");
    expect(report_1.report_items[1].item_value).toBe(6000000);
    expect(report_1.report_items[2].item_name).toBe("粗利益");
    expect(report_1.report_items[2].item_value).toBe(4000000);
    // 粗利益率 = (10000000 - 6000000) / 10000000 * 100 = 40.0
    expect(report_1.report_items[3].item_name).toBe("粗利益率");
    expect(report_1.report_items[3].item_value).toBe(40.0);

    // サンプルデータ2: 売上2500万円、原価750万円の場合
    const sample_data_2 = {
      template_id: template_id,
      revenue: 25000000,
      cost: 7500000,
    };

    const report_2 = generateMonthlySummaryReport({
      template_id: sample_data_2.template_id,
      monthly_data: sample_data_2,
    });

    // 計算結果の検証: 粗利益 = 25000000 - 7500000 = 17500000
    // 粗利益率 = (25000000 - 7500000) / 25000000 * 100 = 70.0
    expect(report_2.report_items[0].item_value).toBe(25000000);
    expect(report_2.report_items[1].item_value).toBe(7500000);
    expect(report_2.report_items[2].item_value).toBe(17500000);
    expect(report_2.report_items[3].item_value).toBe(70.0);

    // テンプレート項目の表示順序を変更: 粗利益率を2番目に移動
    const updated_template = updateMonthlySummaryTemplateItem({
      template_id: template_id,
      items_update: [
        {
          item_key: "revenue",
          item_sequence: 1,
        },
        {
          item_key: "gross_profit_ratio",
          item_sequence: 2,
        },
        {
          item_key: "cost",
          item_sequence: 3,
        },
        {
          item_key: "gross_profit",
          item_sequence: 4,
        },
      ],
    });

    // 項目順序変更後の検証
    expect(updated_template.template_items[0].item_sequence).toBe(1);
    expect(updated_template.template_items[0].item_name).toBe("売上");
    expect(updated_template.template_items[1].item_sequence).toBe(2);
    expect(updated_template.template_items[1].item_name).toBe("粗利益率");
    expect(updated_template.template_items[2].item_sequence).toBe(3);
    expect(updated_template.template_items[2].item_name).toBe("原価");
    expect(updated_template.template_items[3].item_sequence).toBe(4);
    expect(updated_template.template_items[3].item_name).toBe("粗利益");

    // 変更後のレポート生成: 項目順序が反映されているか確認
    const report_3 = generateMonthlySummaryReport({
      template_id: template_id,
      monthly_data: sample_data_1,
    });

    // 新しい順序でレポートが生成されることを確認
    expect(report_3.report_items[0].item_name).toBe("売上");
    expect(report_3.report_items[0].item_value).toBe(10000000);
    expect(report_3.report_items[1].item_name).toBe("粗利益率");
    expect(report_3.report_items[1].item_value).toBe(40.0);
    expect(report_3.report_items[2].item_name).toBe("原価");
    expect(report_3.report_items[2].item_value).toBe(6000000);
    expect(report_3.report_items[3].item_name).toBe("粗利益");
    expect(report_3.report_items[3].item_value).toBe(4000000);

    // 計算ロジックが引き続き正しく動作していることを確認
    const report_4 = generateMonthlySummaryReport({
      template_id: template_id,
      monthly_data: sample_data_2,
    });

    expect(report_4.report_items[0].item_value).toBe(25000000);
    expect(report_4.report_items[1].item_value).toBe(70.0);
    expect(report_4.report_items[2].item_value).toBe(7500000);
    expect(report_4.report_items[3].item_value).toBe(17500000);
  });
});