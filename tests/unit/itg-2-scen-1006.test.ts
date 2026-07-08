import { it, describe, beforeEach, afterEach } from '@jest/globals';

const fetchMock = require('jest-fetch-mock');

describe('査定部署長による妥当性判定結果の確認・承認', () => {
  beforeEach(() => {
    fetchMock.resetMocks();
  });

  afterEach(() => {
    fetchMock.resetMocks();
  });

  // SCEN-1006
  it('自動判定結果と査定員の判定根拠が一致し、承認基準を満たす場合に承認判定が実行される', async () => {
    const case_id = 'CASE-2024-001';
    const assessment_case_status_before = '判定待ち';
    const assessment_case_status_after = '承認済み';
    const auto_judgment_result_match_degree = 100;
    const auto_judgment_result = {
      case_id: case_id,
      quote_amount: 1500000,
      deviation_rate_percent: 8.5,
      deviation_amount_yen: 120000,
      reference_past_cases_count: 45,
      applicable_correction_coefficient: 1.05,
      confidence_score: 92,
      judgment_logic_applied: 'REGION_SEASON_ADJUSTED_COMPARATIVE',
    };

    const assessor_judgment_basis = {
      case_id: case_id,
      assessor_id: 'ASSESSOR-0042',
      assessed_quote_amount: 1500000,
      assessed_deviation_rate_percent: 8.5,
      assessed_deviation_amount_yen: 120000,
      verification_reference_past_count: 45,
      verification_applied_coefficient: 1.05,
      basis_remark: '物価本2024年版と過去案件データの照合確認済み',
      assessment_timestamp: '2024-12-15T10:30:00Z',
    };

    const approval_criteria_checklist = [
      {
        criterion_name: 'auto_judgment_match',
        criterion_description: '自動判定結果と査定員判定の一致度',
        acceptance_threshold_percent: 90,
        actual_match_degree_percent: auto_judgment_result_match_degree,
        is_satisfied: auto_judgment_result_match_degree >= 90,
      },
      {
        criterion_name: 'deviation_within_tolerance',
        criterion_description: '乖離率が許容範囲内',
        acceptance_threshold_percent: 15,
        actual_deviation_rate_percent: 8.5,
        is_satisfied: 8.5 <= 15,
      },
      {
        criterion_name: 'reference_data_sufficiency',
        criterion_description: '参照データ件数が最小要件以上',
        acceptance_threshold_count: 30,
        actual_reference_count: 45,
        is_satisfied: 45 >= 30,
      },
      {
        criterion_name: 'confidence_score_threshold',
        criterion_description: '信頼度スコアが基準値以上',
        acceptance_threshold_score: 85,
        actual_confidence_score: 92,
        is_satisfied: 92 >= 85,
      },
    ];

    const all_criteria_satisfied = approval_criteria_checklist.every(
      (c) => c.is_satisfied
    );

    fetchMock.mockResponseOnce(
      JSON.stringify({
        status: 'success',
        case_id: case_id,
        assessment_case_status_before: assessment_case_status_before,
        assessment_case_status_after: assessment_case_status_after,
        auto_judgment_result: auto_judgment_result,
        assessor_judgment_basis: assessor_judgment_basis,
        approval_criteria_checklist: approval_criteria_checklist,
        all_criteria_satisfied: all_criteria_satisfied,
        approval_judgment_executed: true,
      }),
      { status: 200 }
    );

    const approval_request_payload = {
      case_id: case_id,
      approver_id: 'SUPERVISOR-0015',
      approval_action: 'APPROVE',
      approval_timestamp: '2024-12-15T10:35:00Z',
    };

    const response = await fetch('/api/assessment/cases/approve', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(approval_request_payload),
    });

    const result = await response.json();

    expect(response.status).toBe(200);
    expect(result.status).toBe('success');
    expect(result.case_id).toBe(case_id);
    expect(result.assessment_case_status_before).toBe(assessment_case_status_before);
    expect(result.assessment_case_status_after).toBe(assessment_case_status_after);
    expect(result.approval_judgment_executed).toBe(true);

    expect(result.approval_criteria_checklist).toHaveLength(4);
    expect(
      result.approval_criteria_checklist.every((c: any) => c.is_satisfied)
    ).toBe(true);

    expect(result.auto_judgment_result.case_id).toBe(case_id);
    expect(result.auto_judgment_result.quote_amount).toBe(1500000);
    expect(result.auto_judgment_result.deviation_rate_percent).toBe(8.5);
    expect(result.auto_judgment_result.deviation_amount_yen).toBe(120000);
    expect(result.auto_judgment_result.reference_past_cases_count).toBe(45);
    expect(result.auto_judgment_result.applicable_correction_coefficient).toBe(
      1.05
    );
    expect(result.auto_judgment_result.confidence_score).toBe(92);

    expect(result.assessor_judgment_basis.assessor_id).toBe('ASSESSOR-0042');
    expect(result.assessor_judgment_basis.assessed_quote_amount).toBe(1500000);
    expect(result.assessor_judgment_basis.assessed_deviation_rate_percent).toBe(
      8.5
    );
    expect(result.assessor_judgment_basis.verified_reference_past_count).toBe(45);

    const criterion_auto_match = result.approval_criteria_checklist.find(
      (c: any) => c.criterion_name === 'auto_judgment_match'
    );
    expect(criterion_auto_match).toBeDefined();
    expect(criterion_auto_match.acceptance_threshold_percent).toBe(90);
    expect(criterion_auto_match.actual_match_degree_percent).toBe(100);
    expect(criterion_auto_match.is_satisfied).toBe(true);

    const criterion_deviation_tolerance = result.approval_criteria_checklist.find(
      (c: any) => c.criterion_name === 'deviation_within_tolerance'
    );
    expect(criterion_deviation_tolerance).toBeDefined();
    expect(criterion_deviation_tolerance.acceptance_threshold_percent).toBe(15);
    expect(criterion_deviation_tolerance.actual_deviation_rate_percent).toBe(8.5);
    expect(criterion_deviation_tolerance.is_satisfied).toBe(true);

    const criterion_ref_data = result.approval_criteria_checklist.find(
      (c: any) => c.criterion_name === 'reference_data_sufficiency'
    );
    expect(criterion_ref_data).toBeDefined();
    expect(criterion_ref_data.acceptance_threshold_count).toBe(30);
    expect(criterion_ref_data.actual_reference_count).toBe(45);
    expect(criterion_ref_data.is_satisfied).toBe(true);

    const criterion_confidence = result.approval_criteria_checklist.find(
      (c: any) => c.criterion_name === 'confidence_score_threshold'
    );
    expect(criterion_confidence).toBeDefined();
    expect(criterion_confidence.acceptance_threshold_score).toBe(85);
    expect(criterion_confidence.actual_confidence_score).toBe(92);
    expect(criterion_confidence.is_satisfied).toBe(true);

    expect(result.all_criteria_satisfied).toBe(true);
  });
});