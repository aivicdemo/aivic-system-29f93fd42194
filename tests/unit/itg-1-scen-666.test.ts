import { validateReportApprovalCriteria } from '../../src/logic/it-1-br-1781935279444-1-2-1';

describe('月次サマリーテンプレートの定義・管理機能', () => {
  test('SCEN-666: レポート承認基準検証機能 - 承認基準の境界値で判定が正確に切り替わる', () => {
    // 下限境界値テスト: 売上100万円
    const lower_boundary_just_below = 999999;
    const lower_boundary_exactly = 1000000;
    const lower_boundary_just_above = 1000001;

    const lower_criteria = { lower_bound: 1000000, upper_bound: null };

    const result_below = validateReportApprovalCriteria({
      revenue_amount: lower_boundary_just_below,
      approval_criteria: lower_criteria,
    });
    expect(result_below.is_approved).toBe(false);
    expect(result_below.rejection_reason).toBe('下限基準未満');

    const result_exactly = validateReportApprovalCriteria({
      revenue_amount: lower_boundary_exactly,
      approval_criteria: lower_criteria,
    });
    expect(result_exactly.is_approved).toBe(true);
    expect(result_exactly.rejection_reason).toBeNull();

    const result_above = validateReportApprovalCriteria({
      revenue_amount: lower_boundary_just_above,
      approval_criteria: lower_criteria,
    });
    expect(result_above.is_approved).toBe(true);
    expect(result_above.rejection_reason).toBeNull();

    // 上限境界値テスト: 売上1,000万円
    const upper_boundary_just_below = 9999999;
    const upper_boundary_exactly = 10000000;
    const upper_boundary_just_above = 10000001;

    const upper_criteria = { lower_bound: null, upper_bound: 10000000 };

    const result_upper_below = validateReportApprovalCriteria({
      revenue_amount: upper_boundary_just_below,
      approval_criteria: upper_criteria,
    });
    expect(result_upper_below.is_approved).toBe(true);
    expect(result_upper_below.rejection_reason).toBeNull();

    const result_upper_exactly = validateReportApprovalCriteria({
      revenue_amount: upper_boundary_exactly,
      approval_criteria: upper_criteria,
    });
    expect(result_upper_exactly.is_approved).toBe(true);
    expect(result_upper_exactly.rejection_reason).toBeNull();

    const result_upper_above = validateReportApprovalCriteria({
      revenue_amount: upper_boundary_just_above,
      approval_criteria: upper_criteria,
    });
    expect(result_upper_above.is_approved).toBe(false);
    expect(result_upper_above.rejection_reason).toBe('上限基準超過');

    // 複合条件テスト: 下限100万円、上限1,000万円
    const composite_criteria = {
      lower_bound: 1000000,
      upper_bound: 10000000,
    };

    // 下限未満
    const result_composite_too_low = validateReportApprovalCriteria({
      revenue_amount: 999999,
      approval_criteria: composite_criteria,
    });
    expect(result_composite_too_low.is_approved).toBe(false);
    expect(result_composite_too_low.rejection_reason).toBe('下限基準未満');

    // 下限境界値
    const result_composite_lower_boundary = validateReportApprovalCriteria({
      revenue_amount: 1000000,
      approval_criteria: composite_criteria,
    });
    expect(result_composite_lower_boundary.is_approved).toBe(true);
    expect(result_composite_lower_boundary.rejection_reason).toBeNull();

    // 中央値
    const result_composite_middle = validateReportApprovalCriteria({
      revenue_amount: 5000000,
      approval_criteria: composite_criteria,
    });
    expect(result_composite_middle.is_approved).toBe(true);
    expect(result_composite_middle.rejection_reason).toBeNull();

    // 上限境界値
    const result_composite_upper_boundary = validateReportApprovalCriteria({
      revenue_amount: 10000000,
      approval_criteria: composite_criteria,
    });
    expect(result_composite_upper_boundary.is_approved).toBe(true);
    expect(result_composite_upper_boundary.rejection_reason).toBeNull();

    // 上限超過
    const result_composite_too_high = validateReportApprovalCriteria({
      revenue_amount: 10000001,
      approval_criteria: composite_criteria,
    });
    expect(result_composite_too_high.is_approved).toBe(false);
    expect(result_composite_too_high.rejection_reason).toBe('上限基準超過');
  });
});