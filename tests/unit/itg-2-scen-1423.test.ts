import { aggregateAccuracyIndicators } from '../../src/logic/it-6-2-1-1';

describe('査定担当者別・工種別・金額帯別の判定精度指標の自動集計と可視化', () => {
  // SCEN-1423: [normal] 修正内容承認基準判定機能 - OCR精度・AI判定精度・査定時間短縮の3指標すべてが承認基準を満たす場合に承認可能と判定される
  test('OCR精度95%以上、AI判定精度92%以上、査定時間短縮率15%以上の3指標すべてが基準を満たす場合、承認可能と判定される', () => {
    const input = {
      assessor_id: 'ASSESSOR_001',
      construction_type: 'RC_CONCRETE',
      amount_band: 'BAND_5M_10M',
      ocr_accuracy: 0.95,
      ocr_accuracy_threshold: 0.95,
      ai_judgment_accuracy: 0.92,
      ai_judgment_accuracy_threshold: 0.92,
      assessment_time_reduction_rate: 0.15,
      assessment_time_reduction_rate_threshold: 0.15,
      reference_period_days: 30,
      total_assessments_count: 125,
      assessment_by_construction_type: {
        'RC_CONCRETE': 45,
        'STEEL_FRAME': 38,
        'WOODEN': 42,
      },
      assessment_by_amount_band: {
        'BAND_0_1M': 15,
        'BAND_1_5M': 35,
        'BAND_5M_10M': 40,
        'BAND_10M_PLUS': 35,
      },
      ocr_deviation_count: 6,
      ai_judgment_deviation_count: 10,
      average_assessment_time_before_minutes: 30,
      average_assessment_time_after_minutes: 25.5,
    };

    const result = aggregateAccuracyIndicators(input);

    expect(result.approval_status).toBe('APPROVED');
    expect(result.ocr_accuracy_judgment).toBe('PASS');
    expect(result.ai_judgment_accuracy_judgment).toBe('PASS');
    expect(result.assessment_time_reduction_judgment).toBe('PASS');
    expect(result.all_criteria_met).toBe(true);
    expect(result.ocr_accuracy_actual).toBe(0.95);
    expect(result.ai_judgment_accuracy_actual).toBe(0.92);
    expect(result.assessment_time_reduction_rate_actual).toBe(0.15);
    expect(result.assessor_id).toBe('ASSESSOR_001');
    expect(result.construction_type).toBe('RC_CONCRETE');
    expect(result.amount_band).toBe('BAND_5M_10M');
    expect(result.total_assessments_count).toBe(125);
    expect(result.ocr_failure_count).toBe(6);
    expect(result.ai_judgment_failure_count).toBe(10);
  });
});