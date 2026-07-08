import { calculateProcessingTimeReductionRate } from '../../src/logic/it-1-br-2-2-2-1';

describe('Processing Time Reduction Rate Calculation Dashboard', () => {
  // SCEN-1303
  test('should calculate processing time reduction rate accurately at 33.3% when pre-implementation average is 120 minutes and post-implementation average is 80 minutes', () => {
    const pre_implementation_avg_minutes = 120;
    const post_implementation_avg_minutes = 80;

    const result = calculateProcessingTimeReductionRate(
      pre_implementation_avg_minutes,
      post_implementation_avg_minutes
    );

    expect(result).toBe(33.33);
  });
});