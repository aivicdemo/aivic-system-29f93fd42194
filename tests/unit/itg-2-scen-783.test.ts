import { judgeModelRetrainingTiming } from '../../src/logic/it-6-2-2-1';

describe('Model Retraining Execution Timing Auto-Judgment Feature', () => {
  // SCEN-783
  test('should judge immediate retraining timing with high priority when accuracy falls below threshold', () => {
    const precondition = {
      accuracy_threshold_percent: 70,
      current_model_accuracy_percent: 65,
    };

    const result = judgeModelRetrainingTiming(precondition);

    expect(result.accuracy_below_threshold).toBe(true);
    expect(result.execution_timing).toBe('immediate');
    expect(result.priority_level).toBe('high');
    expect(result.recommended_reason).toBe(
      'accuracy_falls_below_threshold'
    );
    expect(result.retraining_button_enabled).toBe(true);
    expect(result.accuracy_shortfall_percent).toBe(5);
  });
});