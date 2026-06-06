import { recordDefectiveProductDetails } from '../../src/logic/it-1-br-1-2-1';

describe('作業完了実績の登録と次工程引き継ぎ情報の記録機能', () => {
  test('製造工程で不良品が発生した場合、不良品の詳細情報と品質管理部門への通知フラグが正常に記録される', () => {
    // SCEN-388
    const productionQuantity = 1000;
    const defectiveQuantity = 50;
    const defectType = "寸法不良";
    const defectProcess = "機械加工工程";
    const estimatedCause = "工具の磨耗による加工精度低下";
    const countermeasure = "工具交換と再加工実施";

    const result = recordDefectiveProductDetails(
      productionQuantity,
      defectiveQuantity,
      defectType,
      defectProcess,
      estimatedCause,
      countermeasure
    );

    // 不良率計算: 50/1000 = 0.05 (5%)
    const expectedDefectRate = 0.05;
    // 寸法不良は重大な品質問題のため品質管理部門への通知が必要
    const expectedQualityAlertRequired = true;
    // 推定原因と対応措置が両方入力されているため記録完了
    const expectedRecordingComplete = true;

    expect(result.defectRecord.defectiveQuantity).toBe(50);
    expect(result.defectRecord.defectType).toBe("寸法不良");
    expect(result.defectRecord.defectProcess).toBe("機械加工工程");
    expect(result.defectRecord.estimatedCause).toBe("工具の磨耗による加工精度低下");
    expect(result.defectRecord.countermeasure).toBe("工具交換と再加工実施");
    expect(result.defectRecord.defectRate).toBe(expectedDefectRate);
    expect(result.qualityAlertRequired).toBe(expectedQualityAlertRequired);
    expect(result.recordingComplete).toBe(expectedRecordingComplete);

    // エラーテスト: 不良品数量が製造数量を超過する場合
    expect(() => recordDefectiveProductDetails(100, 150, "外観不良", "検査工程", "原因不明", "再検査")).toThrow(/不良品数量/);

    // エラーテスト: 不良品が発生しているのに不良種別が未入力の場合
    expect(() => recordDefectiveProductDetails(100, 10, "", "検査工程", "原因不明", "再検査")).toThrow(/不良種別/);
  });
});