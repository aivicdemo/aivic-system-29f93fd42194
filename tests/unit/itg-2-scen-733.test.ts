import { calculateDeviationRateLevel } from "../../src/logic/it-6-2-2-2";

describe("査定員別の判定精度・乖離パターン分析ダッシュボード", () => {
  // SCEN-733: [edge] 相場乖離率段階別表示 - 乖離率が±20%ちょうどの境界値で警告表示に正確に変遷する
  test("相場乖離率が±20%の境界値で警告レベルが正確に切り替わる", () => {
    // 基準相場価格を 100 とした場合の乖離率テスト
    const base_price = 100;

    // ケース1: +19.9% → 警告表示なし（正常レベル）
    const result_plus_19_9 = calculateDeviationRateLevel({
      current_price: 119.9,
      base_price: base_price,
    });
    expect(result_plus_19_9).toEqual({
      deviation_rate: 19.9,
      warning_level: "normal",
      display_color: "#4CAF50",
      warning_text: "",
      warning_icon: null,
    });

    // ケース2: +20.0% → 警告表示に変遷（警告レベル）
    const result_plus_20_0 = calculateDeviationRateLevel({
      current_price: 120.0,
      base_price: base_price,
    });
    expect(result_plus_20_0).toEqual({
      deviation_rate: 20.0,
      warning_level: "warning",
      display_color: "#FFA500",
      warning_text: "相場から±20%以上の乖離があります",
      warning_icon: "warning",
    });

    // ケース3: +20.1% → 警告表示継続（警告レベル）
    const result_plus_20_1 = calculateDeviationRateLevel({
      current_price: 120.1,
      base_price: base_price,
    });
    expect(result_plus_20_1).toEqual({
      deviation_rate: 20.1,
      warning_level: "warning",
      display_color: "#FFA500",
      warning_text: "相場から±20%以上の乖離があります",
      warning_icon: "warning",
    });

    // ケース4: -19.9% → 警告表示なし（正常レベル）
    const result_minus_19_9 = calculateDeviationRateLevel({
      current_price: 80.1,
      base_price: base_price,
    });
    expect(result_minus_19_9).toEqual({
      deviation_rate: -19.9,
      warning_level: "normal",
      display_color: "#4CAF50",
      warning_text: "",
      warning_icon: null,
    });

    // ケース5: -20.0% → 警告表示に変遷（警告レベル）
    const result_minus_20_0 = calculateDeviationRateLevel({
      current_price: 80.0,
      base_price: base_price,
    });
    expect(result_minus_20_0).toEqual({
      deviation_rate: -20.0,
      warning_level: "warning",
      display_color: "#FFA500",
      warning_text: "相場から±20%以上の乖離があります",
      warning_icon: "warning",
    });

    // ケース6: -20.1% → 警告表示継続（警告レベル）
    const result_minus_20_1 = calculateDeviationRateLevel({
      current_price: 79.9,
      base_price: base_price,
    });
    expect(result_minus_20_1).toEqual({
      deviation_rate: -20.1,
      warning_level: "warning",
      display_color: "#FFA500",
      warning_text: "相場から±20%以上の乖離があります",
      warning_icon: "warning",
    });

    // 境界値テスト: ±50% 超過で注意レベルへ昇格
    const result_plus_50_0 = calculateDeviationRateLevel({
      current_price: 150.0,
      base_price: base_price,
    });
    expect(result_plus_50_0.deviation_rate).toBe(50.0);
    expect(result_plus_50_0.warning_level).toBe("caution");
    expect(result_plus_50_0.display_color).toBe("#FF6B6B");
    expect(result_plus_50_0.warning_icon).toBe("alert");

    const result_minus_50_0 = calculateDeviationRateLevel({
      current_price: 50.0,
      base_price: base_price,
    });
    expect(result_minus_50_0.deviation_rate).toBe(-50.0);
    expect(result_minus_50_0.warning_level).toBe("caution");
    expect(result_minus_50_0.display_color).toBe("#FF6B6B");
    expect(result_minus_50_0.warning_icon).toBe("alert");
  });
});