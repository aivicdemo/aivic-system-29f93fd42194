import { validateQualityRecordCompleteness } from "../../src/logic/it-1780551315784-2-2-1";

describe("作業完了時に品質基準への適合状況を測定し記録する機能", () => {
  test("品質基準項目の一部が未入力状態でエラーが発生し処理が停止する", () => {
    // SCEN-386
    
    // 一部の品質基準項目のみ入力された状態
    const qualityCheckResults = {
      "寸法": 150.5,
      "重量": 2.8,
      "外観": null,  // 未入力
      "強度": ""     // 未入力
    };
    
    const requiredQualityItems = ["寸法", "重量", "外観", "強度"];
    const productionOrderId = "PO-2024-001";
    
    const result = validateQualityRecordCompleteness(
      qualityCheckResults,
      requiredQualityItems,
      productionOrderId
    );
    
    expect(result.isValid).toBe(false);
    expect(result.missingItems).toEqual(["外観", "強度"]);
    expect(result.validationMessage).toBe("未入力項目があります: 外観, 強度");
  });
});