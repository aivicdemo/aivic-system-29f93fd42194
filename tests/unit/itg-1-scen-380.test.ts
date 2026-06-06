import { validateQualityRecordCompleteness } from '../../src/logic/it-1-br-1-2-1';

describe("作業完了実績の登録と次工程引き継ぎ情報の記録機能", () => {
  test("品質チェック結果が未入力状態でエラーが発生する", () => {
    // SCEN-380
    const qualityCheckResults = {
      "寸法検査": null,
      "外観検査": "",
      "強度検査": undefined
    };
    const requiredQualityItems = ["寸法検査", "外観検査", "強度検査"];
    const productionOrderId = "PO-2024-001";

    expect(() => validateQualityRecordCompleteness(
      qualityCheckResults,
      requiredQualityItems,
      productionOrderId
    )).toThrow(/品質検査/);
  });
});