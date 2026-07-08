import { calculateDeviationRateDisplay } from "../../src/logic/it-6-2-2-2";

describe("査定員別の判定精度・乖離パターン分析ダッシュボード", () => {
  test("SCEN-729: 相場乖離率段階別表示 - 乖離率が要注意範囲の場合、黄色で表示される", () => {
    // ハッピーパス: 乖離率が±10～20%範囲（要注意）
    const assessment_caution_lower = {
      assessment_id: "ASS-001",
      deviation_rate: 10.5,
      item_name: "土工事",
      reference_count: 5,
    };

    const result_caution_lower = calculateDeviationRateDisplay(
      assessment_caution_lower
    );

    expect(result_caution_lower).toEqual({
      assessment_id: "ASS-001",
      deviation_rate: 10.5,
      display_color: "#FFFF00",
      risk_level: "caution",
      display_label: "要注意",
    });

    // ハッピーパス: 乖離率が要注意範囲の上限付近
    const assessment_caution_upper = {
      assessment_id: "ASS-002",
      deviation_rate: -19.8,
      item_name: "鉄骨工事",
      reference_count: 8,
    };

    const result_caution_upper = calculateDeviationRateDisplay(
      assessment_caution_upper
    );

    expect(result_caution_upper).toEqual({
      assessment_id: "ASS-002",
      deviation_rate: -19.8,
      display_color: "#FFFF00",
      risk_level: "caution",
      display_label: "要注意",
    });

    // ハッピーパス: 乖離率が正常範囲（±10%以下）の場合、緑色で表示
    const assessment_normal = {
      assessment_id: "ASS-003",
      deviation_rate: 5.2,
      item_name: "基礎工事",
      reference_count: 12,
    };

    const result_normal = calculateDeviationRateDisplay(assessment_normal);

    expect(result_normal).toEqual({
      assessment_id: "ASS-003",
      deviation_rate: 5.2,
      display_color: "#00FF00",
      risk_level: "normal",
      display_label: "正常",
    });

    // ハッピーパス: 乖離率が警告範囲（±20%超）の場合、赤色で表示
    const assessment_warning = {
      assessment_id: "ASS-004",
      deviation_rate: 25.3,
      item_name: "電気工事",
      reference_count: 3,
    };

    const result_warning = calculateDeviationRateDisplay(assessment_warning);

    expect(result_warning).toEqual({
      assessment_id: "ASS-004",
      deviation_rate: 25.3,
      display_color: "#FF0000",
      risk_level: "warning",
      display_label: "警告",
    });

    // ハッピーパス: 負の乖離率が警告範囲の場合、赤色で表示
    const assessment_warning_negative = {
      assessment_id: "ASS-005",
      deviation_rate: -22.7,
      item_name: "塗装工事",
      reference_count: 4,
    };

    const result_warning_negative = calculateDeviationRateDisplay(
      assessment_warning_negative
    );

    expect(result_warning_negative).toEqual({
      assessment_id: "ASS-005",
      deviation_rate: -22.7,
      display_color: "#FF0000",
      risk_level: "warning",
      display_label: "警告",
    });

    // 境界値テスト: 乖離率が正確に±10.0%の場合
    const assessment_boundary_10_positive = {
      assessment_id: "ASS-006",
      deviation_rate: 10.0,
      item_name: "内装工事",
      reference_count: 6,
    };

    const result_boundary_10_positive = calculateDeviationRateDisplay(
      assessment_boundary_10_positive
    );

    // ±10.0%は要注意範囲の下限なので黄色
    expect(result_boundary_10_positive.display_color).toBe("#FFFF00");
    expect(result_boundary_10_positive.risk_level).toBe("caution");

    // 境界値テスト: 乖離率が正確に-10.0%の場合
    const assessment_boundary_10_negative = {
      assessment_id: "ASS-007",
      deviation_rate: -10.0,
      item_name: "躯体工事",
      reference_count: 7,
    };

    const result_boundary_10_negative = calculateDeviationRateDisplay(
      assessment_boundary_10_negative
    );

    expect(result_boundary_10_negative.display_color).toBe("#FFFF00");
    expect(result_boundary_10_negative.risk_level).toBe("caution");

    // 境界値テスト: 乖離率が正確に±20.0%の場合
    const assessment_boundary_20_positive = {
      assessment_id: "ASS-008",
      deviation_rate: 20.0,
      item_name: "外構工事",
      reference_count: 5,
    };

    const result_boundary_20_positive = calculateDeviationRateDisplay(
      assessment_boundary_20_positive
    );

    // ±20.0%は要注意範囲の上限なので黄色
    expect(result_boundary_20_positive.display_color).toBe("#FFFF00");
    expect(result_boundary_20_positive.risk_level).toBe("caution");

    // 境界値テスト: 乖離率が正確に-20.0%の場合
    const assessment_boundary_20_negative = {
      assessment_id: "ASS-009",
      deviation_rate: -20.0,
      item_name: "防水工事",
      reference_count: 8,
    };

    const result_boundary_20_negative = calculateDeviationRateDisplay(
      assessment_boundary_20_negative
    );

    expect(result_boundary_20_negative.display_color).toBe("#FFFF00");
    expect(result_boundary_20_negative.risk_level).toBe("caution");

    // エラーテスト: assessment_id が空の場合
    expect(() => {
      calculateDeviationRateDisplay({
        assessment_id: "",
        deviation_rate: 15.0,
        item_name: "テスト工事",
        reference_count: 5,
      });
    }).toThrow(/assessment_id/);

    // エラーテスト: deviation_rate が null の場合
    expect(() => {
      calculateDeviationRateDisplay({
        assessment_id: "ASS-010",
        deviation_rate: null as any,
        item_name: "テスト工事",
        reference_count: 5,
      });
    }).toThrow(/deviation_rate/);

    // エラーテスト: reference_count が 0 以下の場合
    expect(() => {
      calculateDeviationRateDisplay({
        assessment_id: "ASS-011",
        deviation_rate: 15.0,
        item_name: "テスト工事",
        reference_count: 0,
      });
    }).toThrow(/reference_count/);

    // エラーテスト: item_name が空の場合
    expect(() => {
      calculateDeviationRateDisplay({
        assessment_id: "ASS-012",
        deviation_rate: 15.0,
        item_name: "",
        reference_count: 5,
      });
    }).toThrow(/item_name/);
  });
});