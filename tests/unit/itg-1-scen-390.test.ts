import { recordDefectiveProductDetails } from "../../src/logic/it-1-br-1-2-1";

describe("作業完了実績の登録と次工程引き継ぎ情報の記録機能", () => {
  test("不良品情報記録機能 - 不良品発生数量が製造数量と等しい場合、全数不良として正常に記録される", () => {
    // SCEN-390
    const productionQuantity = 10;
    const defectiveQuantity = 10;
    const defectType = "寸法不良";
    const defectProcess = "仕上げ工程";
    const estimatedCause = "設備調整不良による寸法精度低下";
    const countermeasure = "設備再調整と検査基準の見直しを実施";

    const result = recordDefectiveProductDetails(
      productionQuantity,
      defectiveQuantity,
      defectType,
      defectProcess,
      estimatedCause,
      countermeasure
    );

    expect(result.defectRecord.defectiveQuantity).toBe(10);
    expect(result.defectRecord.defectType).toBe("寸法不良");
    expect(result.defectRecord.defectProcess).toBe("仕上げ工程");
    expect(result.defectRecord.estimatedCause).toBe("設備調整不良による寸法精度低下");
    expect(result.defectRecord.countermeasure).toBe("設備再調整と検査基準の見直しを実施");
    expect(result.defectRecord.defectRate).toBe(1.0);
    expect(result.qualityAlertRequired).toBe(true);
    expect(result.recordingComplete).toBe(true);
  });
});