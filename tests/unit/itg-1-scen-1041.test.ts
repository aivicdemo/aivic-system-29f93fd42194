import { describe, test, expect } from "@jest/globals";
import { validateSalesDataItemMetadata } from "../../src/logic/it-1781935279444-1-1-1";

describe("営業データ項目のメタデータ一元管理", () => {
  // SCEN-1041
  test("項目名が空文字列の場合、エラーが発生してデータベースに保存されない", () => {
    const metadataItem = {
      itemName: "",
      dataType: "string",
      description: "顧客名",
      unit: "件",
      calculationLogic: "直接入力",
      reportMapping: "customer_name",
    };

    expect(() => validateSalesDataItemMetadata(metadataItem)).toThrow(
      /項目名/
    );

    const result = validateSalesDataItemMetadata(metadataItem);
    expect(result).toEqual({
      isValid: false,
      errorMessage: "項目名は必須項目です",
      savedInDatabase: false,
    });
  });
});