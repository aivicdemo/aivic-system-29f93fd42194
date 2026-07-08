import { calculateAccuracyImprovementMetrics } from '../../src/logic/it-6-2-2-2';

describe('精度指標の改善度可視化機能', () => {
  // SCEN-1222
  test('改善前後のOCR精度・AI判定精度・処理時間を計測・比較して改善度を数値とグラフで可視化する', () => {
    // 改善前のデータセット
    const before_ocr_accuracy = 82.5;
    const before_ai_judgment_accuracy = 78.3;
    const before_processing_time_seconds = 450;

    // 改善後のデータセット
    const after_ocr_accuracy = 91.8;
    const after_ai_judgment_accuracy = 87.6;
    const after_processing_time_seconds = 320;

    const input = {
      before_metrics: {
        ocr_accuracy: before_ocr_accuracy,
        ai_judgment_accuracy: before_ai_judgment_accuracy,
        processing_time_seconds: before_processing_time_seconds,
      },
      after_metrics: {
        ocr_accuracy: after_ocr_accuracy,
        ai_judgment_accuracy: after_ai_judgment_accuracy,
        processing_time_seconds: after_processing_time_seconds,
      },
    };

    const result = calculateAccuracyImprovementMetrics(input);

    // 改善前後のOCR精度が正確に計測される
    expect(result.before_ocr_accuracy).toBe(82.5);
    expect(result.after_ocr_accuracy).toBe(91.8);

    // 改善前後のAI判定精度が正確に計測される
    expect(result.before_ai_judgment_accuracy).toBe(78.3);
    expect(result.after_ai_judgment_accuracy).toBe(87.6);

    // 改善前後の処理時間が正確に計測される
    expect(result.before_processing_time_seconds).toBe(450);
    expect(result.after_processing_time_seconds).toBe(320);

    // OCR精度の絶対値改善度を検証: 91.8 - 82.5 = 9.3
    expect(result.ocr_accuracy_absolute_improvement).toBe(9.3);

    // OCR精度の向上率を検証: (9.3 / 82.5) * 100 = 11.27%
    expect(result.ocr_accuracy_improvement_rate).toBeCloseTo(11.27, 1);

    // AI判定精度の絶対値改善度を検証: 87.6 - 78.3 = 9.3
    expect(result.ai_judgment_accuracy_absolute_improvement).toBe(9.3);

    // AI判定精度の向上率を検証: (9.3 / 78.3) * 100 = 11.87%
    expect(result.ai_judgment_accuracy_improvement_rate).toBeCloseTo(11.87, 1);

    // 処理時間の短縮時間を検証: 450 - 320 = 130秒
    expect(result.processing_time_reduction_seconds).toBe(130);

    // 処理時間の短縮率を検証: (130 / 450) * 100 = 28.89%
    expect(result.processing_time_reduction_rate).toBeCloseTo(28.89, 1);

    // グラフデータの構造を検証
    expect(result.graph_data).toBeDefined();
    expect(result.graph_data.chart_type).toBe('comparison_bar');

    // グラフデータに改善前後のシリーズが含まれる
    expect(result.graph_data.series).toBeDefined();
    expect(result.graph_data.series).toHaveLength(2);

    const before_series = result.graph_data.series.find(
      (s: any) => s.label === 'before'
    );
    const after_series = result.graph_data.series.find(
      (s: any) => s.label === 'after'
    );

    expect(before_series).toBeDefined();
    expect(after_series).toBeDefined();

    // 改善前シリーズの値を検証
    expect(before_series.data).toEqual([82.5, 78.3, 450]);

    // 改善後シリーズの値を検証
    expect(after_series.data).toEqual([91.8, 87.6, 320]);

    // グラフラベルが正確に設定される
    expect(result.graph_data.labels).toEqual([
      'OCR読取精度',
      'AI判定精度',
      '処理時間（秒）',
    ]);

    // 改善度サマリーが生成される
    expect(result.improvement_summary).toBeDefined();
    expect(result.improvement_summary.summary_text).toContain('向上');
    expect(result.improvement_summary.status).toBe('improved');

    // 推移グラフデータが生成される
    expect(result.trend_data).toBeDefined();
    expect(result.trend_data.chart_type).toBe('line');
    expect(result.trend_data.series).toHaveLength(3);

    const ocr_trend = result.trend_data.series.find(
      (s: any) => s.name === 'OCR精度'
    );
    const ai_trend = result.trend_data.series.find(
      (s: any) => s.name === 'AI判定精度'
    );
    const time_trend = result.trend_data.series.find(
      (s: any) => s.name === '処理時間'
    );

    expect(ocr_trend).toBeDefined();
    expect(ai_trend).toBeDefined();
    expect(time_trend).toBeDefined();

    // 推移グラフのデータ値を検証
    expect(ocr_trend.values).toEqual([82.5, 91.8]);
    expect(ai_trend.values).toEqual([78.3, 87.6]);
    expect(time_trend.values).toEqual([450, 320]);

    // 総合改善度スコアが計算される: (11.27 + 11.87 + 28.89) / 3 = 17.34
    expect(result.overall_improvement_score).toBeCloseTo(17.34, 1);

    // 改善レベルが判定される
    expect(result.improvement_level).toBe('high');

    // すべての指標が正常値で返される
    expect(result.validation_status).toBe('valid');
  });
});