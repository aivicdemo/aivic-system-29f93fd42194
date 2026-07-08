import { calculateModelUpdateEffect } from "../../src/logic/it-6-2-2-2";

describe("査定員別の判定精度・乖離パターン分析ダッシュボード", () => {
  // SCEN-1163: [normal] モデル更新効果定量化機能 - 学習データ更新前後のOCR精度・AI判定精度を数値とグラフで可視化し、改善度が基準値を超えた場合は改善成功と判定する
  test("should quantify model update effect with before/after OCR and AI judgment accuracy metrics, visualize improvements, and determine success when improvement rate exceeds threshold", () => {
    // テストデータ: 学習データ更新前後のOCR精度・AI判定精度
    const before_ocr_accuracy = 0.78;
    const before_ai_accuracy = 0.82;
    const after_ocr_accuracy = 0.87;
    const after_ai_accuracy = 0.91;
    const improvement_threshold = 0.05;

    const input = {
      before_metrics: {
        ocr_accuracy: before_ocr_accuracy,
        ai_judgment_accuracy: before_ai_accuracy,
        measurement_date: "2024-01-15T10:00:00Z",
      },
      after_metrics: {
        ocr_accuracy: after_ocr_accuracy,
        ai_judgment_accuracy: after_ai_accuracy,
        measurement_date: "2024-01-22T10:00:00Z",
      },
      improvement_threshold_rate: improvement_threshold,
    };

    // 関数実行
    const result = calculateModelUpdateEffect(input);

    // 期待値計算
    // OCR精度改善度 = (0.87 - 0.78) / 0.78 = 0.09 / 0.78 = 0.1154 (11.54%)
    const ocr_improvement_rate = (after_ocr_accuracy - before_ocr_accuracy) / before_ocr_accuracy;
    // AI判定精度改善度 = (0.91 - 0.82) / 0.82 = 0.09 / 0.82 = 0.1098 (10.98%)
    const ai_improvement_rate = (after_ai_accuracy - before_ai_accuracy) / before_ai_accuracy;
    // 平均改善度 = (11.54% + 10.98%) / 2 = 11.26%
    const average_improvement_rate = (ocr_improvement_rate + ai_improvement_rate) / 2;

    // 改善度が基準値 5% を超えるため、改善成功
    const is_success = average_improvement_rate >= improvement_threshold;

    // アサーション: 数値精度の検証
    expect(result.before_metrics.ocr_accuracy).toBe(0.78);
    expect(result.before_metrics.ai_judgment_accuracy).toBe(0.82);
    expect(result.after_metrics.ocr_accuracy).toBe(0.87);
    expect(result.after_metrics.ai_judgment_accuracy).toBe(0.91);

    // 改善度の計算結果を検証 (小数点以下4桁で比較)
    expect(Math.round(result.ocr_improvement_rate * 10000) / 10000).toBeCloseTo(
      Math.round(ocr_improvement_rate * 10000) / 10000,
      4
    );
    expect(Math.round(result.ai_improvement_rate * 10000) / 10000).toBeCloseTo(
      Math.round(ai_improvement_rate * 10000) / 10000,
      4
    );
    expect(Math.round(result.average_improvement_rate * 10000) / 10000).toBeCloseTo(
      Math.round(average_improvement_rate * 10000) / 10000,
      4
    );

    // 改善度の判定結果を検証
    expect(result.is_improvement_success).toBe(is_success);
    expect(result.improvement_status).toBe("改善成功");

    // グラフデータが生成されていることを確認
    expect(result.graph_data).toBeDefined();
    expect(result.graph_data.before_values).toEqual([0.78, 0.82]);
    expect(result.graph_data.after_values).toEqual([0.87, 0.91]);
    expect(result.graph_data.improvement_rates).toEqual([
      Math.round(ocr_improvement_rate * 10000) / 10000,
      Math.round(ai_improvement_rate * 10000) / 10000,
    ]);
    expect(result.graph_data.labels).toEqual(["OCR精度", "AI判定精度"]);

    // 改善度が基準値を超えた場合の結果を検証
    expect(result.average_improvement_rate).toBeGreaterThanOrEqual(improvement_threshold);
  });

  test("should determine improvement failure when improvement rate is below threshold", () => {
    // テストデータ: 改善度が基準値以下の場合
    const before_ocr_accuracy = 0.85;
    const before_ai_accuracy = 0.88;
    const after_ocr_accuracy = 0.86;
    const after_ai_accuracy = 0.89;
    const improvement_threshold = 0.05;

    const input = {
      before_metrics: {
        ocr_accuracy: before_ocr_accuracy,
        ai_judgment_accuracy: before_ai_accuracy,
        measurement_date: "2024-01-15T10:00:00Z",
      },
      after_metrics: {
        ocr_accuracy: after_ocr_accuracy,
        ai_judgment_accuracy: after_ai_accuracy,
        measurement_date: "2024-01-22T10:00:00Z",
      },
      improvement_threshold_rate: improvement_threshold,
    };

    const result = calculateModelUpdateEffect(input);

    // OCR精度改善度 = (0.86 - 0.85) / 0.85 = 0.01 / 0.85 = 0.0118 (1.18%)
    const ocr_improvement_rate = (after_ocr_accuracy - before_ocr_accuracy) / before_ocr_accuracy;
    // AI判定精度改善度 = (0.89 - 0.88) / 0.88 = 0.01 / 0.88 = 0.0114 (1.14%)
    const ai_improvement_rate = (after_ai_accuracy - before_ai_accuracy) / before_ai_accuracy;
    // 平均改善度 = (1.18% + 1.14%) / 2 = 1.16%
    const average_improvement_rate = (ocr_improvement_rate + ai_improvement_rate) / 2;

    // 改善度が基準値 5% 未満のため、改善失敗
    expect(result.is_improvement_success).toBe(false);
    expect(result.improvement_status).toBe("改善失敗");
    expect(result.average_improvement_rate).toBeLessThan(improvement_threshold);
  });

  test("should throw error when before_metrics has missing required fields", () => {
    const input = {
      before_metrics: {
        ocr_accuracy: 0.78,
        // ai_judgment_accuracy 欠落
        measurement_date: "2024-01-15T10:00:00Z",
      },
      after_metrics: {
        ocr_accuracy: 0.87,
        ai_judgment_accuracy: 0.91,
        measurement_date: "2024-01-22T10:00:00Z",
      },
      improvement_threshold_rate: 0.05,
    };

    expect(() => calculateModelUpdateEffect(input as any)).toThrow(/精度指標/);
  });

  test("should throw error when after_metrics has missing required fields", () => {
    const input = {
      before_metrics: {
        ocr_accuracy: 0.78,
        ai_judgment_accuracy: 0.82,
        measurement_date: "2024-01-15T10:00:00Z",
      },
      after_metrics: {
        ocr_accuracy: 0.87,
        // ai_judgment_accuracy 欠落
        measurement_date: "2024-01-22T10:00:00Z",
      },
      improvement_threshold_rate: 0.05,
    };

    expect(() => calculateModelUpdateEffect(input as any)).toThrow(/精度指標/);
  });

  test("should throw error when improvement_threshold_rate is invalid", () => {
    const input = {
      before_metrics: {
        ocr_accuracy: 0.78,
        ai_judgment_accuracy: 0.82,
        measurement_date: "2024-01-15T10:00:00Z",
      },
      after_metrics: {
        ocr_accuracy: 0.87,
        ai_judgment_accuracy: 0.91,
        measurement_date: "2024-01-22T10:00:00Z",
      },
      improvement_threshold_rate: -0.05,
    };

    expect(() => calculateModelUpdateEffect(input)).toThrow(/基準値/);
  });

  test("should throw error when OCR or AI accuracy values are out of valid range", () => {
    const input = {
      before_metrics: {
        ocr_accuracy: 1.5, // 無効: 0-1の範囲外
        ai_judgment_accuracy: 0.82,
        measurement_date: "2024-01-15T10:00:00Z",
      },
      after_metrics: {
        ocr_accuracy: 0.87,
        ai_judgment_accuracy: 0.91,
        measurement_date: "2024-01-22T10:00:00Z",
      },
      improvement_threshold_rate: 0.05,
    };

    expect(() => calculateModelUpdateEffect(input)).toThrow(/精度範囲/);
  });

  test("should include visualization metadata in graph_data for charting", () => {
    const before_ocr_accuracy = 0.80;
    const before_ai_accuracy = 0.84;
    const after_ocr_accuracy = 0.90;
    const after_ai_accuracy = 0.93;
    const improvement_threshold = 0.05;

    const input = {
      before_metrics: {
        ocr_accuracy: before_ocr_accuracy,
        ai_judgment_accuracy: before_ai_accuracy,
        measurement_date: "2024-01-15T10:00:00Z",
      },
      after_metrics: {
        ocr_accuracy: after_ocr_accuracy,
        ai_judgment_accuracy: after_ai_accuracy,
        measurement_date: "2024-01-22T10:00:00Z",
      },
      improvement_threshold_rate: improvement_threshold,
    };

    const result = calculateModelUpdateEffect(input);

    // グラフメタデータの検証
    expect(result.graph_data.title).toBe("学習データ更新前後の精度比較");
    expect(result.graph_data.x_axis_label).toBe("精度指標");
    expect(result.graph_data.y_axis_label).toBe("精度 (0-1)");
    expect(result.graph_data.before_label).toBe("更新前");
    expect(result.graph_data.after_label).toBe("更新後");
    expect(result.graph_data.chart_type).toBe("bar");
  });
});