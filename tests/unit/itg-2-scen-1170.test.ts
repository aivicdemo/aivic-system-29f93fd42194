import { calculateAIPrecisionInsufficientFlag } from "../../src/logic/it-6-2-1-1";

describe("査定担当者別・工種別・金額帯別の判定精度指標の自動集計と可視化", () => {
  test("SCEN-1170: モデル更新前後精度計測 - 学習データ更新後のAI判定精度が絶対値69%で測定された場合、精度不足フラグが立つ", () => {
    // 入力: 学習データ更新後のAI判定精度が絶対値69%
    const ai_precision_after_update = 69;
    const precision_threshold = 70;

    // 実行: 精度不足フラグの計算
    const result = calculateAIPrecisionInsufficientFlag({
      ai_precision_after_update,
      precision_threshold,
    });

    // 期待結果: 精度が70%未満（69%）なので精度不足フラグはtrueになる
    expect(result.insufficient_flag).toBe(true);
    expect(result.ai_precision_value).toBe(69);
    expect(result.threshold_value).toBe(70);
    expect(result.precision_deficit_amount).toBe(1);
  });
});