import { validateQualityRecordCompleteness } from '../../src/logic/it-1780551315784-2-2-1';

describe("作業完了時に品質基準への適合状況を測定し記録する機能", () => {
  test("全品質基準項目に測定値が入力された状態で記録が完了する", () => {
    // SCEN-385
    const qualityCheckResults = {
      "寸法": 25.8,
      "重量": 1.95,
      "外観": "良好",
      "機能性": 98.5
    };
    
    const requiredQualityItems = ["寸法", "重量", "外観", "機能性"];
    
    const productionOrderId = "PO-2024-001";

    const result = validateQualityRecordCompleteness(
      qualityCheckResults,
      requiredQualityItems,
      productionOrderId
    );

    expect(result.isValid).toBe(true);
    expect(result.missingItems).toEqual([]);
    expect(result.validationMessage).toBe("品質記録が完了しました");
  });
});