import { determineLearningDataCorrectionScope } from '../../src/logic/it-6-2-2-1';

describe('学習データ修正範囲決定機能 - 複数原因要素並存時', () => {
  // SCEN-1412
  test('複数の原因要素が並存する場合、各要素ごとの修正対象範囲と優先度が決定される', () => {
    const input = {
      case_id: 'CASE-2024-001',
      detected_issues: [
        {
          issue_id: 'ISSUE-A',
          issue_type: '査定基準の不一致',
          affected_regions: ['関東', '近畿'],
          affected_work_types: ['建築工事', '土木工事'],
          impact_severity_score: 85,
          frequency_count: 24,
          priority_base: 'severity',
        },
        {
          issue_id: 'ISSUE-B',
          issue_type: 'データ入力エラー',
          affected_regions: ['北海道', '九州'],
          affected_work_types: ['設備工事'],
          impact_severity_score: 62,
          frequency_count: 8,
          priority_base: 'frequency',
        },
        {
          issue_id: 'ISSUE-C',
          issue_type: '外部要因の影響',
          affected_regions: ['関東'],
          affected_work_types: ['建築工事', '改修工事'],
          impact_severity_score: 48,
          frequency_count: 15,
          priority_base: 'severity',
        },
      ],
      past_case_data_count: 450,
      material_price_book_version: 'v2024-Q1',
      analysis_timestamp: '2024-05-15T10:30:00Z',
    };

    const result = determineLearningDataCorrectionScope(input);

    expect(result).toEqual({
      case_id: 'CASE-2024-001',
      correction_scope_list: [
        {
          sequence_number: 1,
          issue_id: 'ISSUE-A',
          issue_type: '査定基準の不一致',
          priority_rank: 1,
          priority_score: 85,
          correction_target_regions: ['関東', '近畿'],
          correction_target_work_types: ['建築工事', '土木工事'],
          correction_action_type: 'update_learning_data',
          estimated_data_volume_to_add: 180,
          estimated_correction_days: 5,
          overlap_with_others: false,
          overlap_resolution_rule: null,
        },
        {
          sequence_number: 2,
          issue_id: 'ISSUE-B',
          issue_type: 'データ入力エラー',
          priority_rank: 2,
          priority_score: 62,
          correction_target_regions: ['北海道', '九州'],
          correction_target_work_types: ['設備工事'],
          correction_action_type: 'data_validation_and_cleaning',
          estimated_data_volume_to_add: 32,
          estimated_correction_days: 3,
          overlap_with_others: false,
          overlap_resolution_rule: null,
        },
        {
          sequence_number: 3,
          issue_id: 'ISSUE-C',
          issue_type: '外部要因の影響',
          priority_rank: 3,
          priority_score: 48,
          correction_target_regions: ['関東'],
          correction_target_work_types: ['建築工事', '改修工事'],
          correction_action_type: 'update_learning_data',
          estimated_data_volume_to_add: 108,
          estimated_correction_days: 4,
          overlap_with_others: true,
          overlap_resolution_rule: '同一地域・工種の場合は優先度の高い要素（ISSUE-A）を優先適用',
        },
      ],
      total_estimated_correction_days: 12,
      priority_sort_order: 'descending',
      overlapping_elements_detected: true,
      overlapping_resolution_strategy: 'priority_based_deduplication',
      data_completeness_rate_before_correction: 64.4,
      data_completeness_rate_after_correction: 89.8,
      status: 'success',
      generated_at: '2024-05-15T10:30:00Z',
    });

    const priorities = result.correction_scope_list.map((item) => item.priority_score);
    expect(priorities).toEqual([85, 62, 48]);
    expect(priorities[0] > priorities[1] && priorities[1] > priorities[2]).toBe(true);

    const hasOverlap = result.correction_scope_list.some((item) => item.overlap_with_others);
    expect(hasOverlap).toBe(true);

    const overlapItem = result.correction_scope_list.find((item) => item.overlap_with_others);
    expect(overlapItem?.overlap_resolution_rule).toMatch(/優先度/);

    const uniqueIssueIds = new Set(result.correction_scope_list.map((item) => item.issue_id));
    expect(uniqueIssueIds.size).toBe(3);

    expect(result.correction_scope_list.every((item) => item.sequence_number >= 1)).toBe(true);
    expect(result.correction_scope_list[0].sequence_number).toBe(1);
    expect(result.correction_scope_list[1].sequence_number).toBe(2);
    expect(result.correction_scope_list[2].sequence_number).toBe(3);

    expect(result.total_estimated_correction_days).toBe(12);
    expect(result.data_completeness_rate_after_correction).toBeGreaterThan(
      result.data_completeness_rate_before_correction,
    );
  });
});