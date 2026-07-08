import { describe, test, expect } from "@jest/globals";
import { calculateDeviationRateDisplay } from "../../src/logic/it-6-2-2-2";

describe("相場乖離率段階別表示ダッシュボード", () => {
  // SCEN-730: [normal] 相場乖離率が警告範囲（±20%超過）の場合、赤色で表示される
  test("乖離率±20%超過時に赤色で表示", () => {
    // ケース1: +25%（上限超過）
    const result_plus_25 = calculateDeviationRateDisplay({
      estimate_amount: 1000000,
      market_reference_amount: 800000,
    });
    expect(result_plus_25.deviation_rate).toBe(25);
    expect(result_plus_25.display_color).toBe("red");
    expect(result_plus_25.warning_level).toBe("high");

    // ケース2: -22%（下限超過）
    const result_minus_22 = calculateDeviationRateDisplay({
      estimate_amount: 780000,
      market_reference_amount: 1000000,
    });
    expect(result_minus_22.deviation_rate).toBe(-22);
    expect(result_minus_22.display_color).toBe("red");
    expect(result_minus_22.warning_level).toBe("high");

    // ケース3: +30%（大幅上限超過）
    const result_plus_30 = calculateDeviationRateDisplay({
      estimate_amount: 1300000,
      market_reference_amount: 1000000,
    });
    expect(result_plus_30.deviation_rate).toBe(30);
    expect(result_plus_30.display_color).toBe("red");
    expect(result_plus_30.warning_level).toBe("high");

    // ケース4: -25%（大幅下限超過）
    const result_minus_25 = calculateDeviationRateDisplay({
      estimate_amount: 750000,
      market_reference_amount: 1000000,
    });
    expect(result_minus_25.deviation_rate).toBe(-25);
    expect(result_minus_25.display_color).toBe("red");
    expect(result_minus_25.warning_level).toBe("high");

    // ケース5: +20%（上限境界値・赤色）
    const result_boundary_plus_20 = calculateDeviationRateDisplay({
      estimate_amount: 1200000,
      market_reference_amount: 1000000,
    });
    expect(result_boundary_plus_20.deviation_rate).toBe(20);
    expect(result_boundary_plus_20.display_color).toBe("red");
    expect(result_boundary_plus_20.warning_level).toBe("high");

    // ケース6: -20%（下限境界値・赤色）
    const result_boundary_minus_20 = calculateDeviationRateDisplay({
      estimate_amount: 800000,
      market_reference_amount: 1000000,
    });
    expect(result_boundary_minus_20.deviation_rate).toBe(-20);
    expect(result_boundary_minus_20.display_color).toBe("red");
    expect(result_boundary_minus_20.warning_level).toBe("high");

    // ケース7: +15%（黄色・警告範囲内）
    const result_yellow_plus_15 = calculateDeviationRateDisplay({
      estimate_amount: 1150000,
      market_reference_amount: 1000000,
    });
    expect(result_yellow_plus_15.deviation_rate).toBe(15);
    expect(result_yellow_plus_15.display_color).toBe("yellow");
    expect(result_yellow_plus_15.warning_level).toBe("medium");

    // ケース8: -15%（黄色・警告範囲内）
    const result_yellow_minus_15 = calculateDeviationRateDisplay({
      estimate_amount: 850000,
      market_reference_amount: 1000000,
    });
    expect(result_yellow_minus_15.deviation_rate).toBe(-15);
    expect(result_yellow_minus_15.display_color).toBe("yellow");
    expect(result_yellow_minus_15.warning_level).toBe("medium");

    // ケース9: +5%（緑色・正常範囲）
    const result_green_plus_5 = calculateDeviationRateDisplay({
      estimate_amount: 1050000,
      market_reference_amount: 1000000,
    });
    expect(result_green_plus_5.deviation_rate).toBe(5);
    expect(result_green_plus_5.display_color).toBe("green");
    expect(result_green_plus_5.warning_level).toBe("normal");

    // ケース10: -5%（緑色・正常範囲）
    const result_green_minus_5 = calculateDeviationRateDisplay({
      estimate_amount: 950000,
      market_reference_amount: 1000000,
    });
    expect(result_green_minus_5.deviation_rate).toBe(-5);
    expect(result_green_minus_5.display_color).toBe("green");
    expect(result_green_minus_5.warning_level).toBe("normal");

    // ケース11: 0%（緑色・乖離なし）
    const result_green_zero = calculateDeviationRateDisplay({
      estimate_amount: 1000000,
      market_reference_amount: 1000000,
    });
    expect(result_green_zero.deviation_rate).toBe(0);
    expect(result_green_zero.display_color).toBe("green");
    expect(result_green_zero.warning_level).toBe("normal");
  });
});