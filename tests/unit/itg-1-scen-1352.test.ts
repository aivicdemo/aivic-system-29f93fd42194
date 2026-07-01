import { describe, test, expect, beforeEach } from "@jest/globals";
import { generateSalesDataMappingSpecification } from "../../src/logic/it-1781935279444-1-1-1";

describe("営業データ項目のメタデータ管理機能", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // SCEN-1352: [error] 営業データマッピング仕様書の生成機能 - マッピング対象のデータ項目が存在しない場合にエラーが返される
  test("should throw error when mapping target data item does not exist", () => {
    const nonExistentDataItemName = "non_existent_field_12345";
    const mappingConfig = {
      targetItemName: nonExistentDataItemName,
      reportFieldName: "sales_report_field_1",
      dataType: "number",
      unit: "count",
      calculationLogic: "sum",
    };

    expect(() =>
      generateSalesDataMappingSpecification(mappingConfig)
    ).toThrow(/マッピング対象/);
  });
});