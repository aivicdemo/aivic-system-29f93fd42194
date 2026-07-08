import { describe, test, expect } from '@jest/globals';
import {
  calculateAccuracyImprovementDegree,
  visualizeAccuracyImprovement,
  validateAccuracyDataPoints,
  generateAccuracyComparisonGraph,
} from '../../src/logic/it-6-2-2-2';

describe('査定員別の判定精度・乖離パターン分析ダッシュボード', () => {
  // SCEN-1095: [normal] 精度改善度可視化機能 - 再学習前後のOCR精度・AI判定精度の改善度が数値とグラフで正確に可視化される
  test('SCEN-1095: 再学習前後の精度改善度が数値とグラフで正確に可視化される', () => {
    // ===== 前提: 再学習前のOCR精度・AI判定精度データが蓄積されている状態 =====
    const pre_relearning_ocr_accuracy = 78.5; // %
    const pre_relearning_ai_judgment_accuracy = 82.3; // %
    const pre_relearning_measurement_date = new Date('2024-01-15T09:00:00Z');

    // ===== 再学習処理を実行 =====
    // モデル再学習完了後、新しい精度数値を計測
    const post_relearning_ocr_accuracy = 85.2; // %
    const post_relearning_ai_judgment_accuracy = 89.7; // %
    const post_relearning_measurement_date = new Date('2024-01-22T09:00:00Z');

    // ===== 改善度の数値計算結果を検証 =====
    // structured: calculateAccuracyImprovementDegree
    // inputs: { preOcrAccuracy: number, postOcrAccuracy: number, preAiAccuracy: number, postAiAccuracy: number }
    // formula: ocrImprovementRate = ((postOcr - preOcr) / preOcr) * 100, aiImprovementRate = ((postAi - preAi) / preAi) * 100, totalImprovementDegree = (ocrImprovementRate + aiImprovementRate) / 2
    
    const improvement_result = calculateAccuracyImprovementDegree({
      preOcrAccuracy: pre_relearning_ocr_accuracy,
      postOcrAccuracy: post_relearning_ocr_accuracy,
      preAiAccuracy: pre_relearning_ai_judgment_accuracy,
      postAiAccuracy: post_relearning_ai_judgment_accuracy,
    });

    // OCR精度改善率: ((85.2 - 78.5) / 78.5) * 100 = 8.516...%
    const expected_ocr_improvement_rate = ((85.2 - 78.5) / 78.5) * 100;
    // AI判定精度改善率: ((89.7 - 82.3) / 82.3) * 100 = 9.001...%
    const expected_ai_improvement_rate = ((89.7 - 82.3) / 82.3) * 100;
    // 総合改善度: (8.516... + 9.001...) / 2 = 8.758...%
    const expected_total_improvement_degree = (expected_ocr_improvement_rate + expected_ai_improvement_rate) / 2;

    expect(improvement_result.ocrImprovementRate).toBeCloseTo(expected_ocr_improvement_rate, 2);
    expect(improvement_result.aiImprovementRate).toBeCloseTo(expected_ai_improvement_rate, 2);
    expect(improvement_result.totalImprovementDegree).toBeCloseTo(expected_total_improvement_degree, 2);

    // ===== 改善度を可視化データに変換 =====
    // structured: visualizeAccuracyImprovement
    // inputs: { preOcrAccuracy, postOcrAccuracy, preAiAccuracy, postAiAccuracy, improvementDegree: { ocrImprovementRate, aiImprovementRate, totalImprovementDegree } }
    
    const visualization_data = visualizeAccuracyImprovement({
      preOcrAccuracy: pre_relearning_ocr_accuracy,
      postOcrAccuracy: post_relearning_ocr_accuracy,
      preAiAccuracy: pre_relearning_ai_judgment_accuracy,
      postAiAccuracy: post_relearning_ai_judgment_accuracy,
      improvementDegree: improvement_result,
    });

    // 再学習前後の精度数値が正確に格納されていることを検証
    expect(visualization_data.pre_metrics.ocr_accuracy).toBe(pre_relearning_ocr_accuracy);
    expect(visualization_data.pre_metrics.ai_judgment_accuracy).toBe(pre_relearning_ai_judgment_accuracy);
    expect(visualization_data.post_metrics.ocr_accuracy).toBe(post_relearning_ocr_accuracy);
    expect(visualization_data.post_metrics.ai_judgment_accuracy).toBe(post_relearning_ai_judgment_accuracy);

    // 改善度が正確に格納されていることを検証
    expect(visualization_data.improvement_metrics.ocr_improvement_rate).toBeCloseTo(expected_ocr_improvement_rate, 2);
    expect(visualization_data.improvement_metrics.ai_improvement_rate).toBeCloseTo(expected_ai_improvement_rate, 2);
    expect(visualization_data.improvement_metrics.total_improvement_degree).toBeCloseTo(expected_total_improvement_degree, 2);

    // ===== 改善度をグラフ表示で確認 =====
    // structured: generateAccuracyComparisonGraph
    // inputs: { preOcr, postOcr, preAi, postAi, improvementDegree: number }
    // constraints: グラフのデータポイント数は4個（preOcr, postOcr, preAi, postAi）、軸ラベル・凡例・データポイントが正確に表示される
    
    const graph_data = generateAccuracyComparisonGraph({
      preOcr: pre_relearning_ocr_accuracy,
      postOcr: post_relearning_ocr_accuracy,
      preAi: pre_relearning_ai_judgment_accuracy,
      postAi: post_relearning_ai_judgment_accuracy,
      improvementDegree: expected_total_improvement_degree,
    });

    // グラフのデータポイント数が4個であることを検証
    expect(graph_data.data_points.length).toBe(4);

    // グラフの軸ラベルが正確に設定されていることを検証
    expect(graph_data.x_axis_label).toBe('精度測定時期');
    expect(graph_data.y_axis_label).toBe('精度 (%)');

    // グラフの凡例が正確に設定されていることを検証
    expect(graph_data.legend).toContain('OCR精度');
    expect(graph_data.legend).toContain('AI判定精度');

    // データポイントが正確にプロットされていることを検証
    const expected_data_points = [
      { label: '再学習前_OCR', value: pre_relearning_ocr_accuracy, x_position: 0, y_position: pre_relearning_ocr_accuracy },
      { label: '再学習後_OCR', value: post_relearning_ocr_accuracy, x_position: 1, y_position: post_relearning_ocr_accuracy },
      { label: '再学習前_AI', value: pre_relearning_ai_judgment_accuracy, x_position: 2, y_position: pre_relearning_ai_judgment_accuracy },
      { label: '再学習後_AI', value: post_relearning_ai_judgment_accuracy, x_position: 3, y_position: post_relearning_ai_judgment_accuracy },
    ];

    for (let i = 0; i < expected_data_points.length; i++) {
      expect(graph_data.data_points[i].label).toBe(expected_data_points[i].label);
      expect(graph_data.data_points[i].value).toBe(expected_data_points[i].value);
      expect(graph_data.data_points[i].x_position).toBe(expected_data_points[i].x_position);
      expect(graph_data.data_points[i].y_position).toBe(expected_data_points[i].y_position);
    }

    // ===== グラフのメタデータを検証 =====
    expect(graph_data.graph_type).toBe('line');
    expect(graph_data.title).toBe('再学習前後の精度改善度');

    // ===== データポイント検証 =====
    // structured: validateAccuracyDataPoints
    // inputs: { dataPoints: Array<{label, value, x_position, y_position}> }
    // constraints: すべてのデータポイントが妥当な値であること、y_position が 0-100 の範囲内であること
    
    const validation_result = validateAccuracyDataPoints({
      dataPoints: graph_data.data_points,
    });

    expect(validation_result.is_valid).toBe(true);
    expect(validation_result.validation_errors.length).toBe(0);
    expect(validation_result.total_data_points_validated).toBe(4);

    // ===== 再学習前後の精度差分が正確に計算されていることを検証 =====
    const ocr_accuracy_difference = post_relearning_ocr_accuracy - pre_relearning_ocr_accuracy; // 85.2 - 78.5 = 6.7
    const ai_accuracy_difference = post_relearning_ai_judgment_accuracy - pre_relearning_ai_judgment_accuracy; // 89.7 - 82.3 = 7.4

    expect(ocr_accuracy_difference).toBe(6.7);
    expect(ai_accuracy_difference).toBe(7.4);

    // ===== 改善度の統計的妥当性を検証 =====
    // 改善度が正の値（改善している）であることを検証
    expect(improvement_result.totalImprovementDegree).toBeGreaterThan(0);
    
    // OCR精度およびAI判定精度の改善率が正の値であることを検証
    expect(improvement_result.ocrImprovementRate).toBeGreaterThan(0);
    expect(improvement_result.aiImprovementRate).toBeGreaterThan(0);

    // ===== 整合性チェック =====
    // visualization_data に含まれる改善度とgraph_data の改善度が一致することを検証
    expect(visualization_data.improvement_metrics.total_improvement_degree).toBeCloseTo(graph_data.improvement_degree_percentage, 2);
  });
});