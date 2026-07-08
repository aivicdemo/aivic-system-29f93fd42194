import { calculateManualRevisionPrecisionTracking } from '../../src/logic/it-6-2-2-2';

describe('Manual Revision Precision Tracking Dashboard', () => {
  // SCEN-1589: [normal] マニュアル改版精度追跡機能 - 改版前後のOCR精度・AI判定精度の変化差分を定量化し、次回改版の優先度判定に活用する値を算出する
  test('should calculate manual revision precision differential and generate priority score for next revision', () => {
    const pre_revision_ocr_accuracy_score = 92.5;
    const pre_revision_ocr_error_rate = 7.5;
    const pre_revision_ocr_processed_count = 450;
    
    const pre_revision_ai_judgment_accuracy = 88.0;
    const pre_revision_ai_misjudgment_rate = 12.0;
    const pre_revision_ai_target_count = 420;
    
    const post_revision_ocr_accuracy_score = 95.8;
    const post_revision_ocr_error_rate = 4.2;
    const post_revision_ocr_processed_count = 480;
    
    const post_revision_ai_judgment_accuracy = 92.5;
    const post_revision_ai_misjudgment_rate = 7.5;
    const post_revision_ai_target_count = 450;
    
    const ocr_accuracy_differential = post_revision_ocr_accuracy_score - pre_revision_ocr_accuracy_score;
    const ocr_accuracy_change_rate = (ocr_accuracy_differential / pre_revision_ocr_accuracy_score) * 100;
    
    const ocr_error_rate_differential = pre_revision_ocr_error_rate - post_revision_ocr_error_rate;
    const ocr_error_rate_improvement = (ocr_error_rate_differential / pre_revision_ocr_error_rate) * 100;
    
    const ai_judgment_accuracy_differential = post_revision_ai_judgment_accuracy - pre_revision_ai_judgment_accuracy;
    const ai_judgment_accuracy_change_rate = (ai_judgment_accuracy_differential / pre_revision_ai_judgment_accuracy) * 100;
    
    const ai_misjudgment_rate_differential = pre_revision_ai_misjudgment_rate - post_revision_ai_misjudgment_rate;
    const ai_misjudgment_rate_improvement = (ai_misjudgment_rate_differential / pre_revision_ai_misjudgment_rate) * 100;
    
    const ocr_accuracy_component = (ocr_accuracy_change_rate * 0.35) + (ocr_error_rate_improvement * 0.15);
    const ai_judgment_component = (ai_judgment_accuracy_change_rate * 0.35) + (ai_misjudgment_rate_improvement * 0.15);
    
    const composite_priority_score = ocr_accuracy_component + ai_judgment_component;
    
    let revision_priority_level: string;
    if (composite_priority_score >= 5.0) {
      revision_priority_level = 'HIGH';
    } else if (composite_priority_score >= 2.0) {
      revision_priority_level = 'MEDIUM';
    } else {
      revision_priority_level = 'LOW';
    }
    
    const result = calculateManualRevisionPrecisionTracking({
      pre_revision_ocr_accuracy_score,
      pre_revision_ocr_error_rate,
      pre_revision_ocr_processed_count,
      pre_revision_ai_judgment_accuracy,
      pre_revision_ai_misjudgment_rate,
      pre_revision_ai_target_count,
      post_revision_ocr_accuracy_score,
      post_revision_ocr_error_rate,
      post_revision_ocr_processed_count,
      post_revision_ai_judgment_accuracy,
      post_revision_ai_misjudgment_rate,
      post_revision_ai_target_count,
    });
    
    expect(result.ocr_accuracy_differential).toBe(3.3);
    expect(result.ocr_accuracy_change_rate).toBeCloseTo(3.568, 2);
    expect(result.ocr_error_rate_differential).toBe(3.3);
    expect(result.ocr_error_rate_improvement).toBeCloseTo(44.0, 1);
    
    expect(result.ai_judgment_accuracy_differential).toBe(4.5);
    expect(result.ai_judgment_accuracy_change_rate).toBeCloseTo(5.114, 2);
    expect(result.ai_misjudgment_rate_differential).toBe(4.5);
    expect(result.ai_misjudgment_rate_improvement).toBeCloseTo(37.5, 1);
    
    expect(result.ocr_accuracy_component).toBeCloseTo(7.623, 2);
    expect(result.ai_judgment_component).toBeCloseTo(7.915, 2);
    
    expect(result.composite_priority_score).toBeCloseTo(15.538, 2);
    expect(result.revision_priority_level).toBe('HIGH');
    
    expect(result.report_output).toEqual({
      report_type: 'manual_revision_precision_differential',
      ocr_accuracy_differential: 3.3,
      ocr_accuracy_change_rate_percent: 3.568,
      ocr_error_rate_differential: 3.3,
      ocr_error_rate_improvement_percent: 44.0,
      ai_judgment_accuracy_differential: 4.5,
      ai_judgment_accuracy_change_rate_percent: 5.114,
      ai_misjudgment_rate_differential: 4.5,
      ai_misjudgment_rate_improvement_percent: 37.5,
      composite_priority_score: 15.538,
      revision_priority_level: 'HIGH',
      export_format_csv: true,
      export_format_report: true,
    });
  });
});