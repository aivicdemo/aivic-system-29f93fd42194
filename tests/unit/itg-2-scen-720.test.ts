import { validateEstimateCompleteness } from "../../src/logic/it-6-2-1-1";

describe("査定担当者別・工種別・金額帯別の判定精度指標の自動集計と可視化", () => {
  // SCEN-720: [edge] 見積書必須項目完全性検証 - 金額が0円である場合、警告が表示される
  test("金額が0円である場合、警告メッセージが表示され見積書保存が制限される", () => {
    const estimate_item = {
      product_name: "コンクリート打設工事",
      quantity: 50,
      unit_price: 12000,
      amount: 0,
      worker_count: 3,
      construction_type: "RC造",
      region: "東京都",
    };

    const result = validateEstimateCompleteness(estimate_item);

    expect(result.is_valid).toBe(false);
    expect(result.warning_message).toMatch(/金額は0円以上/);
    expect(result.can_save).toBe(false);
  });
});