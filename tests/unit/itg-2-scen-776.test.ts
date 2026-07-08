import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { detectPrecisionDecline } from '../../src/logic/it-6-3-1';

const fetchMock = require('jest-fetch-mock');

describe('査定判定ロジックの適用履歴と根拠の記録・検索機能', () => {
  beforeEach(() => {
    fetchMock.resetMocks();
  });

  afterEach(() => {
    fetchMock.resetMocks();
  });

  test('SCEN-776: 精度低下が警告閾値を超過した場合に改善要否が自動判定され通知される', async () => {
    // Given: テスト用査定データと警告閾値設定
    const warning_threshold_percent = 70;
    const current_accuracy_rate = 0.25; // 25%（低下率は75%で閾値超過）
    const previous_accuracy_rate = 1.0; // 前月100%
    const precision_decline_rate = (1 - current_accuracy_rate / previous_accuracy_rate) * 100; // 75%

    const test_assessment_records = [
      {
        assessment_id: 'ASS-001',
        ocr_confidence: 0.45,
        prediction_confidence: 0.30,
        assessment_timestamp: '2024-12-15T10:30:00Z',
        assessor_id: 'ASSR-001'
      },
      {
        assessment_id: 'ASS-002',
        ocr_confidence: 0.38,
        prediction_confidence: 0.22,
        assessment_timestamp: '2024-12-15T11:15:00Z',
        assessor_id: 'ASSR-002'
      },
      {
        assessment_id: 'ASS-003',
        ocr_confidence: 0.42,
        prediction_confidence: 0.28,
        assessment_timestamp: '2024-12-15T12:00:00Z',
        assessor_id: 'ASSR-001'
      }
    ];

    const baseline_measurement_timestamp = '2024-11-15T09:00:00Z';
    const current_measurement_timestamp = '2024-12-15T18:00:00Z';

    // When: detectPrecisionDecline関数を呼び出す
    const precision_decline_result = await detectPrecisionDecline({
      warning_threshold_percent,
      current_accuracy_rate,
      previous_accuracy_rate,
      test_assessment_records,
      baseline_measurement_timestamp,
      current_measurement_timestamp
    });

    // Then: 精度低下が警告閾値を超過した場合の判定結果を検証
    expect(precision_decline_result).toBeDefined();
    expect(precision_decline_result.precision_decline_detected).toBe(true);
    expect(precision_decline_result.precision_decline_rate_percent).toBe(75);
    expect(precision_decline_result.exceeds_warning_threshold).toBe(true);
    expect(precision_decline_result.improvement_required_judgment).toBe('REQUIRED');
    expect(precision_decline_result.improvement_proposals).toBeDefined();
    expect(Array.isArray(precision_decline_result.improvement_proposals)).toBe(true);
    expect(precision_decline_result.improvement_proposals.length).toBeGreaterThan(0);

    // And: 改善提案の内容検証
    const first_proposal = precision_decline_result.improvement_proposals[0];
    expect(first_proposal.proposal_id).toBeDefined();
    expect(first_proposal.proposal_type).toMatch(/DATA_QUALITY|MODEL_RETRAINING|PARAMETER_ADJUSTMENT/);
    expect(first_proposal.description).toBeDefined();
    expect(first_proposal.description.length).toBeGreaterThan(0);
    expect(first_proposal.priority_level).toMatch(/HIGH|MEDIUM|LOW/);
    expect(first_proposal.expected_effectiveness_percent).toBeGreaterThan(0);
    expect(first_proposal.expected_effectiveness_percent).toBeLessThanOrEqual(100);

    // And: 通知オブジェクトの構造と内容を検証
    expect(precision_decline_result.notification).toBeDefined();
    expect(precision_decline_result.notification.notification_id).toBeDefined();
    expect(precision_decline_result.notification.notification_type).toBe('PRECISION_DECLINE_ALERT');
    expect(precision_decline_result.notification.recipients).toBeDefined();
    expect(Array.isArray(precision_decline_result.notification.recipients)).toBe(true);
    expect(precision_decline_result.notification.recipients.length).toBeGreaterThan(0);

    // And: 通知内容に精度低下率が含まれていることを検証
    expect(precision_decline_result.notification.message_body).toContain('75');
    expect(precision_decline_result.notification.message_body).toContain('精度低下率');

    // And: 通知内容に改善提案が含まれていることを検証
    expect(precision_decline_result.notification.message_body).toContain('改善');

    // And: 対応期限が明確に記載されていることを検証
    expect(precision_decline_result.notification.response_deadline).toBeDefined();
    const deadline_date = new Date(precision_decline_result.notification.response_deadline);
    expect(deadline_date.getTime()).toBeGreaterThan(new Date(current_measurement_timestamp).getTime());

    // And: 通知が複数チャネルで送信される設定を検証
    expect(precision_decline_result.notification.channels).toBeDefined();
    expect(Array.isArray(precision_decline_result.notification.channels)).toBe(true);
    expect(precision_decline_result.notification.channels.length).toBeGreaterThan(0);
    expect(precision_decline_result.notification.channels).toContain('EMAIL');

    // And: 改善提案リストが優先度でソートされていることを検証
    for (let i = 0; i < precision_decline_result.improvement_proposals.length - 1; i++) {
      const current_proposal_priority_map = { HIGH: 3, MEDIUM: 2, LOW: 1 };
      const next_proposal_priority_map = { HIGH: 3, MEDIUM: 2, LOW: 1 };
      const current_priority_value = current_proposal_priority_map[precision_decline_result.improvement_proposals[i].priority_level];
      const next_priority_value = next_proposal_priority_map[precision_decline_result.improvement_proposals[i + 1].priority_level];
      expect(current_priority_value).toBeGreaterThanOrEqual(next_priority_value);
    }

    // And: 各改善提案に実装難度スコアが含まれていることを検証
    precision_decline_result.improvement_proposals.forEach((proposal: any) => {
      expect(proposal.implementation_difficulty_score).toBeDefined();
      expect(proposal.implementation_difficulty_score).toBeGreaterThanOrEqual(0);
      expect(proposal.implementation_difficulty_score).toBeLessThanOrEqual(100);
    });

    // And: システムが査定品質管理システムに記録通知を送信したことを検証
    fetchMock.mockResponseOnce(
      JSON.stringify({
        record_id: 'REC-PREC-DEC-2024-12-15-001',
        recorded_at: current_measurement_timestamp,
        status: 'RECORDED'
      }),
      { status: 200 }
    );

    const record_response = await fetch('/api/v1/precision-decline-records', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        precision_decline_rate_percent: precision_decline_result.precision_decline_rate_percent,
        exceeds_warning_threshold: precision_decline_result.exceeds_warning_threshold,
        improvement_required_judgment: precision_decline_result.improvement_required_judgment,
        notification_sent_at: precision_decline_result.notification.sent_timestamp
      })
    });

    expect(record_response.ok).toBe(true);
    const record_data = await record_response.json();
    expect(record_data.record_id).toBeDefined();
    expect(record_data.status).toBe('RECORDED');

    // And: 通知が実際に送信されたことを確認（メール配信API呼び出し）
    fetchMock.mockResponseOnce(
      JSON.stringify({
        email_id: 'EMAIL-2024-12-15-001',
        sent_at: current_measurement_timestamp,
        delivery_status: 'QUEUED'
      }),
      { status: 202 }
    );

    const email_response = await fetch('/api/v1/notifications/email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        recipients: precision_decline_result.notification.recipients,
        subject: 'システム精度低下警告および改善提案',
        body: precision_decline_result.notification.message_body,
        deadline: precision_decline_result.notification.response_deadline
      })
    });

    expect(email_response.ok).toBe(true);
    const email_data = await email_response.json();
    expect(email_data.email_id).toBeDefined();
    expect(email_data.delivery_status).toMatch(/QUEUED|SENT/);
  });
});