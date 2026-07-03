import { validateMonthlySummaryMapping } from "../../src/logic/it-1-br-1781935279444-1-2-1";

describe("月次サマリーテンプレートの定義・管理機能", () => {
  // SCEN-1122: [error] 営業データから月次サマリーへの自動マッピング - 存在しないメタデータ項目をマッピング対象とした場合にエラーが検出される
  test("should detect and reject non-existent metadata field in monthly summary mapping", () => {
    const existingMetadataFields = [
      "appointment_count",
      "contract_count",
      "customer_response",
      "service_type",
      "sales_amount"
    ];

    const mappingConfig = {
      source_field: "non_existent_field",
      target_template_field: "monthly_summary_metrics",
      transformation_rule: "sum"
    };

    expect(() =>
      validateMonthlySummaryMapping(mappingConfig, existingMetadataFields)
    ).toThrow(/メタデータ項目/);
  });
});