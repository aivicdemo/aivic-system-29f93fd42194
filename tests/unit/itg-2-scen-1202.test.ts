import { calculateImprovalMeasurePriority } from '../../src/logic/it-6-2-2-2';

describe('査定員別の判定精度・乖離パターン分析ダッシュボード - 改善施策優先度判定', () => {
  // SCEN-1202
  test('should throw error when required fields for improvement measure are incomplete', () => {
    const incompleteInput = {
      measure_name: '',
      effect_indicator: 'OCR精度改善率',
      implementation_cost: 500000,
      implementation_period_days: 14,
    };

    expect(() => calculateImprovalMeasurePriority(incompleteInput)).toThrow(/施策名/);
  });

  // SCEN-1202: 効果測定指標が未入力
  test('should throw error when effect_indicator is missing', () => {
    const incompleteInput = {
      measure_name: 'モデル再学習',
      effect_indicator: '',
      implementation_cost: 500000,
      implementation_period_days: 14,
    };

    expect(() => calculateImprovalMeasurePriority(incompleteInput)).toThrow(/効果測定指標/);
  });

  // SCEN-1202: 実装コストが未入力
  test('should throw error when implementation_cost is missing', () => {
    const incompleteInput = {
      measure_name: 'モデル再学習',
      effect_indicator: 'OCR精度改善率',
      implementation_cost: 0,
      implementation_period_days: 14,
    };

    expect(() => calculateImprovalMeasurePriority(incompleteInput)).toThrow(/実装コスト/);
  });

  // SCEN-1202: 実装期間が未入力
  test('should throw error when implementation_period_days is missing', () => {
    const incompleteInput = {
      measure_name: 'モデル再学習',
      effect_indicator: 'OCR精度改善率',
      implementation_cost: 500000,
      implementation_period_days: 0,
    };

    expect(() => calculateImprovalMeasurePriority(incompleteInput)).toThrow(/実装期間/);
  });

  // SCEN-1202: 成功ケース - すべての必須項目が入力されている
  test('should calculate priority score successfully when all required fields are provided', () => {
    const validInput = {
      measure_name: 'モデル再学習',
      effect_indicator: 'OCR精度改善率',
      implementation_cost: 500000,
      implementation_period_days: 14,
      impact_score: 85,
      difficulty_score: 60,
    };

    const result = calculateImprovalMeasurePriority(validInput);

    expect(result).toHaveProperty('priority_score');
    expect(result).toHaveProperty('priority_rank');
    expect(typeof result.priority_score).toBe('number');
    expect(result.priority_score).toBeGreaterThanOrEqual(0);
    expect(result.priority_score).toBeLessThanOrEqual(100);
    expect(['高', '中', '低']).toContain(result.priority_rank);
  });

  // SCEN-1202: 複数の必須項目が欠落している場合、最初に検出された欠落項目についてエラーを返す
  test('should throw error for first missing required field when multiple fields are incomplete', () => {
    const incompleteInput = {
      measure_name: '',
      effect_indicator: '',
      implementation_cost: 0,
      implementation_period_days: 0,
    };

    expect(() => calculateImprovalMeasurePriority(incompleteInput)).toThrow(/施策名/);
  });
});