import { generateMonthlySummary } from "../../src/logic/it-1-br-1781935279444-1-2-1";

describe("月次サマリーテンプレート定義・管理機能", () => {
  test("SCEN-623: 月次サマリーテンプレートの項目定義が空である場合、サマリー生成がスキップされ警告が記録される", () => {
    const emptyTemplateItems: any[] = [];
    const templateId = "template_001";
    const templateName = "テスト用テンプレート";
    const salesData = {
      customer_id: "cust_001",
      service_id: "svc_001",
      appointment_count: 5,
      contract_count: 3,
      customer_feedback: "良好",
    };

    const result = generateMonthlySummary({
      template_id: templateId,
      template_name: templateName,
      template_items: emptyTemplateItems,
      sales_data: salesData,
      execution_date: "2024-01-31",
    });

    expect(result.status).toBe("skipped");
    expect(result.summary_content).toBeNull();
    expect(result.warning_message).toMatch(/項目定義が空/);
    expect(result.warning_logged).toBe(true);
  });
});