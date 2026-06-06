import { detectProductionAnomalies } from '../../src/logic/it-1780551301636-1-2-1';

describe('生産実績データの異常値を自動検出し原因調査に必要な関連データを抽出する機能', () => {
  test('すべてのデータが正常範囲の場合に異常値なしと判定される', () => {
    // SCEN-475

    // 正常範囲内のテストデータを準備
    const productionRecords = [
      { id: 'PR001', quantity: 95, workTime: 8.5, qualityScore: 85 },
      { id: 'PR002', quantity: 102, workTime: 8.2, qualityScore: 88 },
      { id: 'PR003', quantity: 98, workTime: 8.0, qualityScore: 90 },
      { id: 'PR004', quantity: 105, workTime: 8.3, qualityScore: 87 },
      { id: 'PR005', quantity: 92, workTime: 8.1, qualityScore: 86 },
      { id: 'PR006', quantity: 100, workTime: 8.4, qualityScore: 89 },
      { id: 'PR007', quantity: 97, workTime: 8.2, qualityScore: 84 },
      { id: 'PR008', quantity: 103, workTime: 8.3, qualityScore: 91 },
      { id: 'PR009', quantity: 99, workTime: 8.1, qualityScore: 88 },
      { id: 'PR010', quantity: 96, workTime: 8.0, qualityScore: 87 }
    ];

    const statisticalThresholds = {
      quantityStdDevMultiplier: 2,
      workHoursStdDevMultiplier: 2,
      qualityThreshold: { minValue: 70, maxValue: 100 }
    };

    const result = detectProductionAnomalies(productionRecords, statisticalThresholds);

    // 異常値なしの結果を確認
    expect(result.detectedAnomalies).toEqual([]);
    expect(result.relatedProductionOrders).toEqual([]);
    expect(result.workHistories).toEqual([]);
    expect(result.alertLevel).toBe('minor');
  });
});