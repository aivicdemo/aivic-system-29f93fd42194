import { validateQualityRecordCompleteness } from "../../src/logic/it-1780551315784-2-2-1";

describe("作業完了時に品質基準への適合状況を測定し記録する機能", () => {
  test("品質検査結果記録機能 - 品質基準項目が1項目のみ設定された場合でも必須チェックが動作する", () => {
    // SCEN-387
    const requiredQualityItems = ["寸法精度"];
    const productionOrderId = "PO-2024-001";

    // 品質基準項目が1項目のみで、その項目を空白のまま残すケース
    const qualityCheckResultsEmpty = {
      "寸法精度": null
    };

    const resultEmpty = validateQualityRecordCompleteness(
      qualityCheckResultsEmpty,
      requiredQualityItems,
      productionOrderId
    );

    expect(resultEmpty.isValid).toBe(false);
    expect(resultEmpty.missingItems).toEqual(["寸法精度"]);
    expect(resultEmpty.validationMessage).toBe("未入力項目があります: 寸法精度");

    // 品質基準項目が1項目のみで、有効な値を入力するケース
    const qualityCheckResultsValid = {
      "寸法精度": "合格"
    };

    const resultValid = validateQualityRecordCompleteness(
      qualityCheckResultsValid,
      requiredQualityItems,
      productionOrderId
    );

    expect(resultValid.isValid).toBe(true);
    expect(resultValid.missingItems).toEqual([]);
    expect(resultValid.validationMessage).toBe("品質記録が完了しました");
  });
});