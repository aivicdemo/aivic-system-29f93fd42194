import { calculateDeviationWarning } from "../../src/logic/it-6-2-2-2";

describe("査定員別の判定精度・乖離パターン分析ダッシュボード", () => {
  // SCEN-991: [normal] 乖離許容範囲の自動判定 - 乖離率が許容範囲を超過（例：±10%以上）の場合、警告が表示され査定員の確認が促される
  test("乖離率+15%時に警告メッセージと確認ボタンが表示される", () => {
    const standard_assessment_amount = 1000000; // 標準査定額: 100万円
    const assessor_input_amount = 1150000; // 査定員入力額: 115万円
    const tolerance_threshold = 10; // 許容範囲: ±10%

    const result = calculateDeviationWarning({
      standard_amount: standard_assessment_amount,
      input_amount: assessor_input_amount,
      tolerance_percent: tolerance_threshold,
    });

    // 乖離率の計算: (1150000 - 1000000) / 1000000 * 100 = 15%
    expect(result.deviation_rate).toBe(15);

    // 乖離率が許容範囲を超過しているため、警告が必要
    expect(result.exceeds_tolerance).toBe(true);

    // 警告メッセージの確認
    expect(result.warning_message).toMatch(/査定額が標準査定額から15%上回っています/);
    expect(result.warning_message).toMatch(/確認をお願いします/);

    // 確認ボタンが表示される状態を確認
    expect(result.display_confirmation_button).toBe(true);

    // 確認プロンプト（ユーザーへの認識促進）の存在確認
    expect(result.confirmation_prompt).toMatch(/確認が必要です/);

    // 警告レベルが「HIGH」に設定される（±10%超過時）
    expect(result.warning_level).toBe("HIGH");

    // 画面表示フラグ
    expect(result.display_warning).toBe(true);
  });
});