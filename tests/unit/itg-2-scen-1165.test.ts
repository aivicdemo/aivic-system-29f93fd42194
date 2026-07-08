import { describe, test, expect, beforeEach } from '@jest/globals';
import { calculateModelUpdateEffect } from '../../src/logic/it-6-2-2-2';

describe('Model Update Effect Quantification - Precision Degradation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // SCEN-1165: [normal] モデル更新効果定量化機能 - 更新前精度90%・更新後85%で精度が低下した場合、改善失敗としてネガティブな効果を可視化する
  test('should detect precision degradation from 90% to 85% and display negative effect visualization', () => {
    const baseline_precision = 90;
    const post_update_precision = 85;
    const acceptable_threshold = 87;

    const result = calculateModelUpdateEffect({
      baseline_precision: baseline_precision,
      post_update_precision: post_update_precision,
      acceptable_threshold: acceptable_threshold,
    });

    expect(result.precision_change_percent).toBe(-5);
    expect(result.is_improvement_success).toBe(false);
    expect(result.status).toBe('失敗');
    expect(result.visual_indicator_color).toBe('red');
    expect(result.visual_direction_arrow).toBe('down');
    expect(result.graph_trend).toBe('declining');
    expect(result.meets_threshold).toBe(false);
    expect(result.root_cause_candidates).toContain('学習データ不足');
    expect(result.recommended_actions.length).toBeGreaterThan(0);
    expect(result.recommended_actions[0]).toMatch(/学習データ/);
  });
});