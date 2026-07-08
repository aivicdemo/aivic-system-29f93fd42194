import { calculateAccuracyImprovement } from "../../src/logic/it-6-2-2-1";

describe("精度改善度可視化機能", () => {
  // SCEN-1096: [edge] 精度改善度可視化機能 - 再学習前後の精度が同一の場合、改善度0として正常に表示される
  test("再学習前後の精度が同一（85.5%）の場合、改善度0として正常に計算・表示される", () => {
    // 再学習前の精度: 85.5%
    const pre_relearning_accuracy = 85.5;
    
    // 再学習後の精度: 85.5%（同一値）
    const post_relearning_accuracy = 85.5;
    
    // 精度改善度の計算処理を実行
    const result = calculateAccuracyImprovement({
      pre_relearning_accuracy,
      post_relearning_accuracy,
    });
    
    // 期待結果: 改善度が0として計算される
    expect(result.improvement_rate).toBe(0);
    
    // 期待結果: 改善度ゲージ状態が初期値（0%）を示す
    expect(result.gauge_percentage).toBe(0);
    
    // 期待結果: 改善なしのメッセージが表示される
    expect(result.display_message).toBe("改善なし");
    
    // 期待結果: 改善度レベルが「なし」に分類される
    expect(result.improvement_level).toBe("none");
    
    // 期待結果: エラーフラグが立たない
    expect(result.error).toBe(false);
    
    // 期待結果: 前後の精度値が記録されている
    expect(result.pre_accuracy_display).toBe("85.5%");
    expect(result.post_accuracy_display).toBe("85.5%");
  });
});