import { calculateOCRErrorPriorityScore } from '../../src/logic/it-6-2-2-2';

describe('査定員別の判定精度・乖離パターン分析ダッシュボード', () => {
  // SCEN-1445
  test('同一日時に2件以上の読取誤り報告があった場合に優先度スコアが算出される', () => {
    const report_timestamp = new Date('2024-01-15T10:30:00Z');

    const error_reports = [
      {
        report_id: 'ERR_001',
        timestamp: report_timestamp,
        error_type: 'OCR_MISRECOGNITION',
        impact_level: 'HIGH',
        affected_item_count: 1,
        affected_amount: 500000,
      },
      {
        report_id: 'ERR_002',
        timestamp: report_timestamp,
        error_type: 'CHARACTER_OMISSION',
        impact_level: 'MEDIUM',
        affected_item_count: 1,
        affected_amount: 250000,
      },
      {
        report_id: 'ERR_003',
        timestamp: report_timestamp,
        error_type: 'IMAGE_UNCLEAR',
        impact_level: 'LOW',
        affected_item_count: 1,
        affected_amount: 100000,
      },
    ];

    const result = calculateOCRErrorPriorityScore(error_reports);

    expect(result).toBeDefined();
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBe(3);

    result.forEach((scored_report: any) => {
      expect(scored_report.report_id).toBeDefined();
      expect(typeof scored_report.priority_score).toBe('number');
      expect(scored_report.priority_score).toBeGreaterThanOrEqual(0);
      expect(scored_report.priority_score).toBeLessThanOrEqual(100);
    });

    const score_001 = result.find((r: any) => r.report_id === 'ERR_001')?.priority_score;
    const score_002 = result.find((r: any) => r.report_id === 'ERR_002')?.priority_score;
    const score_003 = result.find((r: any) => r.report_id === 'ERR_003')?.priority_score;

    expect(score_001).toBeGreaterThan(score_002);
    expect(score_002).toBeGreaterThan(score_003);

    const error_type_weights: Record<string, number> = {
      OCR_MISRECOGNITION: 3,
      CHARACTER_OMISSION: 2,
      IMAGE_UNCLEAR: 1,
    };

    const impact_level_weights: Record<string, number> = {
      HIGH: 3,
      MEDIUM: 2,
      LOW: 1,
    };

    result.forEach((scored_report: any, index: number) => {
      const original_report = error_reports[index];
      const expected_base_score =
        (error_type_weights[original_report.error_type] *
          impact_level_weights[original_report.impact_level] *
          original_report.affected_amount) /
        10000;

      expect(scored_report.priority_score).toBeCloseTo(
        Math.min(expected_base_score, 100),
        1
      );
    });

    const unique_error_types = new Set(
      error_reports.map((r) => r.error_type)
    );
    const unique_impact_levels = new Set(
      error_reports.map((r) => r.impact_level)
    );

    expect(unique_error_types.size).toBe(3);
    expect(unique_impact_levels.size).toBe(3);

    const timestamp_consistency = error_reports.every(
      (r) =>
        r.timestamp.getTime() === report_timestamp.getTime()
    );
    expect(timestamp_consistency).toBe(true);
  });
});