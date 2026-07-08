import { calculateMonthlyStaffingPlan } from '../../src/logic/it-6-2-2-2';

describe('査定員別の判定精度・乖離パターン分析ダッシュボード', () => {
  // SCEN-1083: [normal] 月次人員配置計画の策定 - 教育指導対象者の業務負荷が調整された配置計画が出力される
  test('教育指導対象者の業務負荷が適切に調整され、過度な負荷がかかっていない配置計画が正常に出力される', () => {
    const month_year = '2024-02';
    const standard_workload_per_assessor = 50;
    const education_target_assessor_ids = ['A001', 'A002'];
    const current_workload_map = {
      A001: 75,
      A002: 60,
      A003: 48,
      A004: 52,
    };
    const education_load_reduction_rate = 0.4;
    const total_estimated_cases = 210;

    const result = calculateMonthlyStaffingPlan({
      month_year,
      standard_workload_per_assessor,
      education_target_assessor_ids,
      current_workload_map,
      education_load_reduction_rate,
      total_estimated_cases,
    });

    // 期待値: 教育指導対象者の調整後業務負荷
    // A001: 現在75 → 50 * (1 - 0.4) = 30 に調整
    // A002: 現在60 → 50 * (1 - 0.4) = 30 に調整
    // A003, A004は教育指導対象外のため調整なし
    const expected_adjusted_workload_A001 = 30;
    const expected_adjusted_workload_A002 = 30;

    expect(result.adjusted_workload_map['A001']).toBe(expected_adjusted_workload_A001);
    expect(result.adjusted_workload_map['A002']).toBe(expected_adjusted_workload_A002);
    expect(result.adjusted_workload_map['A003']).toBe(current_workload_map['A003']);
    expect(result.adjusted_workload_map['A004']).toBe(current_workload_map['A004']);

    // 期待値: 調整後の総業務負荷
    // 30 + 30 + 48 + 52 = 160
    const expected_total_adjusted_workload = 160;
    expect(result.total_adjusted_workload).toBe(expected_total_adjusted_workload);

    // 期待値: 教育時間確保の余裕フラグ（A001, A002 は余裕あり）
    expect(result.education_target_assessor_ids.includes('A001')).toBe(true);
    expect(result.education_target_assessor_ids.includes('A002')).toBe(true);

    // 期待値: 配置計画の出力形式が正しいこと
    expect(result).toHaveProperty('month_year');
    expect(result).toHaveProperty('adjusted_workload_map');
    expect(result).toHaveProperty('total_adjusted_workload');
    expect(result).toHaveProperty('education_target_assessor_ids');
    expect(result).toHaveProperty('staffing_plan');
    expect(result).toHaveProperty('export_format');

    // 期待値: 配置計画がダウンロード・エクスポート可能な形式であること
    expect(result.export_format).toMatch(/json|csv|xlsx/);

    // 期待値: 調整後の業務負荷が標準以下であること
    expect(result.adjusted_workload_map['A001']).toBeLessThanOrEqual(standard_workload_per_assessor);
    expect(result.adjusted_workload_map['A002']).toBeLessThanOrEqual(standard_workload_per_assessor);

    // 期待値: 月次人員配置計画がシステムに記録される状態
    expect(result.staffing_plan).toBeDefined();
    expect(result.staffing_plan.month_year).toBe('2024-02');
  });
});