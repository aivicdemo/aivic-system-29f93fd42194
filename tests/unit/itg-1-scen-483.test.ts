import { detectProductionAnomalies } from '../../src/logic/it-1780551301636-1-2-1';

describe("生産実績データの異常値を自動検出し原因調査に必要な関連データを抽出する機能", () => {
  test("棚卸差異調査判定機能 - 棚卸差異データが存在しない場合にエラーが返される", () => {
    // SCEN-483
    const productionRecords = [];
    const statisticalThresholds = {
      standardDeviationMultiplier: 2,
      minValue: 0,
      maxValue: 1000
    };

    expect(() => {
      detectProductionAnomalies(productionRecords, statisticalThresholds);
    }).toThrow(/生産実績データ/);
  });
});