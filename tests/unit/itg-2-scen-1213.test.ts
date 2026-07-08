import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { generateAlternativeProposalsOnRejection } from '../../src/logic/it-6-2-1-1';

const fetchMock = require('jest-fetch-mock');

describe('改善提案却下時代替案自動生成機能 - エラーハンドリング', () => {
  beforeEach(() => {
    fetchMock.resetMocks();
  });

  afterEach(() => {
    fetchMock.resetMocks();
  });

  // SCEN-1213: [error] 改善提案却下時代替案自動生成機能 - 適用可能な代替案が存在しない場合にエラーハンドリングを行う
  test('適用可能な代替案が存在しない場合、エラーハンドリング実行とエラーログ記録、ユーザー通知が正しく行われる', async () => {
    const rejection_proposal_id = 'PROPOSAL-20250526-001';
    const assessment_category = 'data_quality_improvement';
    const implementation_difficulty_score = 85;
    const effect_prediction_score = 30;
    const risk_assessment_score = 92;
    const rejection_timestamp = new Date('2025-05-26T14:00:00Z').toISOString();
    const rejection_reason = '実装リソース不足によるため却下';
    const available_alternative_candidates = [];
    const system_status_before = 'stable';

    const mockErrorResponse = {
      status: 'error',
      error_code: 'NO_ALTERNATIVE_AVAILABLE',
      error_message: '適用可能な代替案が存在しません',
      proposal_id: rejection_proposal_id,
      timestamp: rejection_timestamp,
      user_notification: {
        message: '代替案の生成に失敗しました。別の改善方針をご検討ください。',
        severity: 'warning',
        action_required: true
      },
      error_log: {
        error_id: 'ERR-ALT-001',
        category: 'no_alternative_candidates',
        severity_level: 'warning',
        timestamp: rejection_timestamp,
        user_id: 'assessor-5001',
        proposal_details: {
          proposal_id: rejection_proposal_id,
          category: assessment_category,
          difficulty_score: implementation_difficulty_score,
          effect_score: effect_prediction_score,
          risk_score: risk_assessment_score
        },
        system_state_before: system_status_before,
        recovery_action: 'user_fallback_to_manual_plan'
      },
      system_recovery_status: 'stable'
    };

    fetchMock.mockResponseOnce(JSON.stringify(mockErrorResponse), { status: 400 });

    const input = {
      rejection_proposal_id,
      assessment_category,
      implementation_difficulty_score,
      effect_prediction_score,
      risk_assessment_score,
      rejection_timestamp,
      rejection_reason,
      available_alternative_candidates,
      system_status_before
    };

    const result = await generateAlternativeProposalsOnRejection(input);

    expect(result).toEqual({
      status: 'error',
      error_code: 'NO_ALTERNATIVE_AVAILABLE',
      error_message: '適用可能な代替案が存在しません',
      proposal_id: rejection_proposal_id,
      timestamp: rejection_timestamp,
      user_notification: {
        message: '代替案の生成に失敗しました。別の改善方針をご検討ください。',
        severity: 'warning',
        action_required: true
      },
      error_log: {
        error_id: 'ERR-ALT-001',
        category: 'no_alternative_candidates',
        severity_level: 'warning',
        timestamp: rejection_timestamp,
        user_id: 'assessor-5001',
        proposal_details: {
          proposal_id: rejection_proposal_id,
          category: assessment_category,
          difficulty_score: implementation_difficulty_score,
          effect_score: effect_prediction_score,
          risk_score: risk_assessment_score
        },
        system_state_before: system_status_before,
        recovery_action: 'user_fallback_to_manual_plan'
      },
      system_recovery_status: 'stable'
    });

    expect(result.error_code).toBe('NO_ALTERNATIVE_AVAILABLE');
    expect(result.user_notification.severity).toBe('warning');
    expect(result.user_notification.action_required).toBe(true);
    expect(result.error_log.category).toBe('no_alternative_candidates');
    expect(result.error_log.severity_level).toBe('warning');
    expect(result.error_log.recovery_action).toBe('user_fallback_to_manual_plan');
    expect(result.system_recovery_status).toBe('stable');

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(result).toHaveProperty('error_log');
    expect(result.error_log).toHaveProperty('error_id');
    expect(result.error_log.error_id).toMatch(/ERR-/);
  });
});