import { describe, test, expect } from "@jest/globals";
import { validateMonthlyReportChecklistTemplate } from "../../src/logic/it-1-br-1781935279444-1-2-1";

describe("月次サマリーテンプレートの定義・管理機能", () => {
  test("SCEN-669: チェックリスト項目が空の場合、エラーが適切に発生する", () => {
    const invalidTemplateData = {
      templateId: "monthly_summary_tpl_001",
      templateName: "月次営業成果レポート",
      checklistItems: [],
      targetPeriodStart: "2024-01-01",
      targetPeriodEnd: "2024-01-31",
      createdBy: "user_12345",
      createdAt: "2024-01-15T09:00:00Z",
    };

    expect(() =>
      validateMonthlyReportChecklistTemplate(invalidTemplateData)
    ).toThrow(/チェックリスト項目/);
  });
});