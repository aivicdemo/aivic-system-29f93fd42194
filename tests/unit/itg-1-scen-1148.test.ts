import { expect, test, describe } from "@jest/globals";
import { mapSalesDataToMonthlySummaryTemplate } from "../../src/logic/it-1-br-1781935279444-1-2-1";

describe("月次サマリーテンプレートの定義・管理機能", () => {
  test("SCEN-1148: メタデータに存在しない営業データ項目がマッピング対象に含まれた場合、マッピング処理が失敗する", () => {
    const salesDataMetadata = [
      {
        item_id: "ITEM_001",
        item_name: "appointment_count",
        data_type: "integer",
        unit: "件",
      },
      {
        item_id: "ITEM_002",
        item_name: "contract_count",
        data_type: "integer",
        unit: "件",
      },
      {
        item_id: "ITEM_003",
        item_name: "customer_response",
        data_type: "string",
        unit: "text",
      },
    ];

    const monthlySalesData = {
      appointment_count: 15,
      contract_count: 5,
      customer_response: "positive",
      undefined_metric: 100,
    };

    const templateMappingConfig = [
      {
        template_field: "monthly_appointments",
        source_data_item: "appointment_count",
      },
      {
        template_field: "monthly_contracts",
        source_data_item: "contract_count",
      },
      {
        template_field: "additional_metric",
        source_data_item: "undefined_metric",
      },
    ];

    expect(() =>
      mapSalesDataToMonthlySummaryTemplate(
        monthlySalesData,
        templateMappingConfig,
        salesDataMetadata
      )
    ).toThrow(/メタデータ/);
  });
});