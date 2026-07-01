import { mapMonthlySummaryTemplateFromSalesData } from "../../src/logic/it-1-br-1781935279444-1-2-1";

describe("月次サマリーテンプレートの定義・管理機能", () => {
  // SCEN-1149: [error] 営業データから月次サマリーテンプレートへの自動マッピング - テンプレート項目の必須フィールドが営業データに不足している場合、不完全マッピングとして検出される
  test("必須フィールドが欠落した営業データをマッピングすると、不完全マッピングエラーが発生する", () => {
    // テンプレート定義：必須フィールド: apoCount, contractCount, customerFeedback
    const templateDef = {
      template_id: "tpl_20240101_monthly_v1",
      template_name: "月次営業成果サマリー",
      required_fields: ["apoCount", "contractCount", "customerFeedback"],
      optional_fields: ["discountAmount"],
    };

    // 営業データ：contractCount と customerFeedback が欠落
    const salesData = {
      period: "2024-01",
      customer_id: "cust_001",
      service_id: "svc_sales",
      apoCount: 12,
      // contractCount 欠落
      // customerFeedback 欠落
      discountAmount: 5000,
    };

    // マッピング処理を実行
    const result = mapMonthlySummaryTemplateFromSalesData(
      templateDef,
      salesData
    );

    // 不完全マッピングとして検出されることを確認
    expect(result.status).toBe("error");
    expect(result.mapping_result).toBe("incomplete");
    expect(result.missing_fields).toEqual(["contractCount", "customerFeedback"]);
    expect(result.error_message).toContain("contractCount");
    expect(result.error_message).toContain("customerFeedback");
  });
});