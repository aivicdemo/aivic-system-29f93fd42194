import { calculateAccuracyMetrics } from "../../src/logic/it-6-2-1-1";

describe("査定担当者別・工種別・金額帯別の判定精度指標の自動集計と可視化", () => {
  // SCEN-1436: [error] 相場判定精度検証機能 - 過去案件データ・物価本が存在しない場合に精度判定失敗エラーが発生する
  test("should throw error when both past_project_data and pricing_book are missing", () => {
    const input = {
      past_project_data: [],
      pricing_book_data: [],
      ocr_read_results: [
        {
          item_id: "item_001",
          work_type: "construction",
          region: "tokyo",
          amount: 1000000,
          quantity: 10,
          unit_price: 100000,
        },
      ],
      assessor_judgments: [
        {
          assessor_id: "assessor_001",
          item_id: "item_001",
          judgment_amount: 950000,
          reason: "based on market data",
        },
      ],
    };

    expect(() => calculateAccuracyMetrics(input)).toThrow(/過去案件データ/);
  });
});