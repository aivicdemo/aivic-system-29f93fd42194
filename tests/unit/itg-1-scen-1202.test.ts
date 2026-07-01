import { validateReportAccuracy } from "../../src/logic/it-1781935279444-2-2-1";

describe("レポート数値正確性判定機能", () => {
  test("SCEN-1202: 誤差が許容範囲の境界値ちょうどの場合、『正確』と判定される", () => {
    // テスト用のレポート数値データを準備する（基準値：1000）
    const baseline_value = 1000;

    // 許容誤差範囲を設定する（許容誤差率：±5%）
    const tolerance_rate = 0.05;
    const upper_limit = baseline_value * (1 + tolerance_rate); // 1050
    const lower_limit = baseline_value * (1 - tolerance_rate); // 950

    // 誤差がちょうど許容範囲の上限値となるレポート数値を入力する（1050）
    const upper_boundary_value = 1050;
    const upper_result = validateReportAccuracy({
      baseline_value: baseline_value,
      reported_value: upper_boundary_value,
      tolerance_rate: tolerance_rate,
    });

    // 上限値（1050）の判定結果をアサーションで検証する
    expect(upper_result).toEqual({
      is_accurate: true,
      error_rate: 0.05,
      judgment: "正確",
    });

    // 誤差がちょうど許容範囲の下限値となるレポート数値を入力する（950）
    const lower_boundary_value = 950;
    const lower_result = validateReportAccuracy({
      baseline_value: baseline_value,
      reported_value: lower_boundary_value,
      tolerance_rate: tolerance_rate,
    });

    // 下限値（950）の判定結果をアサーションで検証する
    expect(lower_result).toEqual({
      is_accurate: true,
      error_rate: -0.05,
      judgment: "正確",
    });
  });
});