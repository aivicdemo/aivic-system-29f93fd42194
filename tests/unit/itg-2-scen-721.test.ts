import { validateEstimateRequiredFields } from "../../src/logic/it-6-2-1-1";

describe("査定担当者別・工種別・金額帯別の判定精度指標の自動集計と可視化", () => {
  // SCEN-721: [error] 見積書必須項目完全性検証 - 数量が0の場合、警告メッセージが表示され処理が中断する
  test("should throw error when quantity is 0 in estimate required fields validation", () => {
    const estimateData = {
      productName: "鉄筋コンクリート工事",
      unitPrice: 150000,
      quantity: 0,
      workType: "RC工",
      amount: 0,
    };

    expect(() => validateEstimateRequiredFields(estimateData)).toThrow(/数量/);
  });
});