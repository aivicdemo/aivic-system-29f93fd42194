import { calculatePrecisionImprovement } from "../../src/logic/it-6-2-2-2";

describe("査定員別の判定精度・乖離パターン分析ダッシュボード - モデル更新前後精度計測・比較", () => {
  // SCEN-1119: [edge] モデル更新前後精度計測・比較機能 - 精度改善度がマイナス値（低下）の境界ケースで正しく診断できる
  test("精度改善度計算と品質低下診断 - 複수の境界ケースを検証", () => {
    // ケース1: 精度改善度 = -0.1% （低下）
    const result_decline_01 = calculatePrecisionImprovement({
      before_precision: 98.5,
      after_precision: 98.4,
    });

    expect(result_decline_01.improvement_rate).toBe(-0.1);
    expect(result_decline_01.status).toBe("declined");
    expect(result_decline_01.diagnosis_message).toMatch(/精度が低下/);
    expect(result_decline_01.warning_level).toBe("warning");
    expect(result_decline_01.requires_intervention).toBe(true);

    // ケース2: 精度改善度 = 0.0% （変化なし）
    const result_no_change = calculatePrecisionImprovement({
      before_precision: 98.5,
      after_precision: 98.5,
    });

    expect(result_no_change.improvement_rate).toBe(0.0);
    expect(result_no_change.status).toBe("no_change");
    expect(result_no_change.diagnosis_message).toMatch(/変化なし/);
    expect(result_no_change.warning_level).toBe("info");
    expect(result_no_change.requires_intervention).toBe(false);

    // ケース3: 精度改善度 = -0.01% （微小マイナス値）
    const result_micro_decline = calculatePrecisionImprovement({
      before_precision: 98.50,
      after_precision: 98.49,
    });

    expect(result_micro_decline.improvement_rate).toBe(-0.01);
    expect(result_micro_decline.status).toBe("declined");
    expect(result_micro_decline.diagnosis_message).toMatch(/精度が低下/);
    expect(result_micro_decline.warning_level).toBe("warning");
    expect(result_micro_decline.requires_intervention).toBe(true);

    // ケース4: 精度改善度がマイナスで大きな値（-5.0%）の場合
    const result_large_decline = calculatePrecisionImprovement({
      before_precision: 95.0,
      after_precision: 90.0,
    });

    expect(result_large_decline.improvement_rate).toBe(-5.0);
    expect(result_large_decline.status).toBe("declined");
    expect(result_large_decline.diagnosis_message).toMatch(/深刻|重大|低下/);
    expect(result_large_decline.warning_level).toBe("critical");
    expect(result_large_decline.requires_intervention).toBe(true);

    // ケース5: 精度改善度がプラス値（改善した場合）
    const result_improve = calculatePrecisionImprovement({
      before_precision: 95.0,
      after_precision: 96.5,
    });

    expect(result_improve.improvement_rate).toBe(1.5);
    expect(result_improve.status).toBe("improved");
    expect(result_improve.diagnosis_message).toMatch(/改善/);
    expect(result_improve.warning_level).toBe("success");
    expect(result_improve.requires_intervention).toBe(false);

    // 診断結果オブジェクトが必須フィールドをすべて含むことを検証
    expect(result_decline_01).toHaveProperty("improvement_rate");
    expect(result_decline_01).toHaveProperty("status");
    expect(result_decline_01).toHaveProperty("diagnosis_message");
    expect(result_decline_01).toHaveProperty("warning_level");
    expect(result_decline_01).toHaveProperty("requires_intervention");
    expect(result_decline_01).toHaveProperty("system_log_entry");

    // システムログエントリが正しく記録されていることを確認
    expect(result_decline_01.system_log_entry).toHaveProperty("timestamp");
    expect(result_decline_01.system_log_entry).toHaveProperty("event_type");
    expect(result_decline_01.system_log_entry.event_type).toMatch(/model_update|precision_measurement/);
    expect(result_decline_01.system_log_entry).toHaveProperty("severity");
    expect(result_decline_01.system_log_entry.severity).toBe("warning");
    expect(result_decline_01.system_log_entry).toHaveProperty("details");
    expect(result_decline_01.system_log_entry.details).toHaveProperty("before_precision");
    expect(result_decline_01.system_log_entry.details).toHaveProperty("after_precision");
    expect(result_decline_01.system_log_entry.details).toHaveProperty("improvement_rate");
  });

  test("無効な入力値に対するエラーハンドリング", () => {
    // 精度値が負数の場合
    expect(() =>
      calculatePrecisionImprovement({
        before_precision: -5.0,
        after_precision: 95.0,
      })
    ).toThrow(/精度値/);

    // 精度値が100を超える場合
    expect(() =>
      calculatePrecisionImprovement({
        before_precision: 105.0,
        after_precision: 95.0,
      })
    ).toThrow(/精度値/);

    // after_precision が undefined の場合
    expect(() =>
      calculatePrecisionImprovement({
        before_precision: 95.0,
        after_precision: undefined as any,
      })
    ).toThrow(/必須/);

    // before_precision が null の場合
    expect(() =>
      calculatePrecisionImprovement({
        before_precision: null as any,
        after_precision: 95.0,
      })
    ).toThrow(/必須/);
  });
});