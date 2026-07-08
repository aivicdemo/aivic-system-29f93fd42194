import { generatePrecisionAlerts } from '../../src/logic/it-6-2-2-2';

describe('査定員別の判定精度・乖離パターン分析ダッシュボード', () => {
  // SCEN-1177: [normal] アラート通知 - 精度低下兆候検知時に、運用者・査定部署長・経営層に対して優先度付きアラートが通知される
  test('精度低下兆候検知時に、運用者・査定部署長・経営層に対して優先度付きアラートが通知される', () => {
    const precision_threshold_percentage = 70;
    const current_ocr_precision = 65;
    const previous_ocr_precision = 72;
    const precision_decline_rate_percentage = ((previous_ocr_precision - current_ocr_precision) / previous_ocr_precision) * 100;

    const ai_judgment_precision_threshold_percentage = 75;
    const current_ai_judgment_precision = 68;
    const previous_ai_judgment_precision = 78;
    const ai_precision_decline_rate_percentage = ((previous_ai_judgment_precision - current_ai_judgment_precision) / previous_ai_judgment_precision) * 100;

    const user_feedback_count_threshold = 50;
    const current_user_feedback_count = 68;

    const alert_input = {
      current_ocr_precision,
      previous_ocr_precision,
      precision_threshold_percentage,
      current_ai_judgment_precision,
      previous_ai_judgment_precision,
      ai_judgment_precision_threshold_percentage,
      current_user_feedback_count,
      user_feedback_count_threshold,
      timestamp_iso: '2024-01-15T14:30:00Z',
      monitored_region: 'Tokyo',
      monitored_construction_type: 'Building',
    };

    const result = generatePrecisionAlerts(alert_input);

    expect(result).toBeDefined();
    expect(result.alert_detected).toBe(true);
    expect(result.alerts).toHaveLength(3);

    const operator_alert = result.alerts.find(
      (a: any) => a.recipient_role === 'operator'
    );
    expect(operator_alert).toBeDefined();
    expect(operator_alert?.priority_level).toBe('high');
    expect(operator_alert?.alert_type).toBe('precision_decline');
    expect(operator_alert?.details).toContain('OCR');
    expect(operator_alert?.details).toContain('65');
    expect(operator_alert?.notification_channel).toBe('email');

    const section_chief_alert = result.alerts.find(
      (a: any) => a.recipient_role === 'section_chief'
    );
    expect(section_chief_alert).toBeDefined();
    expect(section_chief_alert?.priority_level).toBe('medium');
    expect(section_chief_alert?.alert_type).toBe('precision_decline');
    expect(section_chief_alert?.details).toContain('AI');
    expect(section_chief_alert?.details).toContain('68');
    expect(section_chief_alert?.notification_channel).toBe('app_notification');

    const management_alert = result.alerts.find(
      (a: any) => a.recipient_role === 'management'
    );
    expect(management_alert).toBeDefined();
    expect(management_alert?.priority_level).toBe('low');
    expect(management_alert?.alert_type).toBe('precision_decline');
    expect(management_alert?.details).toContain('feedback');
    expect(management_alert?.details).toContain('68');
    expect(management_alert?.notification_channel).toBe('email');

    expect(operator_alert?.generated_timestamp_iso).toBe('2024-01-15T14:30:00Z');
    expect(section_chief_alert?.generated_timestamp_iso).toBe('2024-01-15T14:30:00Z');
    expect(management_alert?.generated_timestamp_iso).toBe('2024-01-15T14:30:00Z');

    expect(result.ocr_precision_decline_rate_percentage).toBe(
      Math.round(precision_decline_rate_percentage * 100) / 100
    );
    expect(result.ai_precision_decline_rate_percentage).toBe(
      Math.round(ai_precision_decline_rate_percentage * 100) / 100
    );
    expect(result.user_feedback_count_excess).toBe(
      current_user_feedback_count - user_feedback_count_threshold
    );

    expect(result.monitored_region).toBe('Tokyo');
    expect(result.monitored_construction_type).toBe('Building');
  });
});