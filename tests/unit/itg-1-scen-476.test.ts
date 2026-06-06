import { detectProductionAnomalies } from "../../src/logic/it-1780551301636-1-2-1";

describe("生産実績データの異常値を自動検出し原因調査に必要な関連データを抽出する機能", () => {
  test("SCEN-476: 生産実績データが存在しない場合にエラーが返される", () => {
    // 空の生産実績データで異常値検出を実行
    expect(() => detectProductionAnomalies(
      [],
      {
        quantityThreshold: 2.0,
        workHoursThreshold: 1.5,
        qualityThreshold: 0.8
      }
    )).toThrow(/生産実績データ/);
  });
});