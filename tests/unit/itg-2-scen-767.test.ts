import { calculateNextMonthRequiredStaff } from '../../src/logic/it-6-2-1-1';

describe('翌月必要人員数の自動計算・配置シナリオ生成機能 - 繁忙度境界値判定', () => {
  // SCEN-767
  test('繁忙度が基準値±5%の境界値で翌月必要人員数が正確に計算され、シナリオ判定が正確に行われる', () => {
    // ========== テストデータ準備フェーズ ==========
    
    // 基準値設定: 月次査定件数基準値 = 1000件、査定員平均処理時間基準値 = 30分/件
    const baseline_monthly_cases = 1000;
    const baseline_avg_process_minutes = 30;
    const base_required_staff_count = 30;
    
    // 繁忙度基準値（月次件数から導出）
    // 繁忙度レベル分類: 通常期 900-1100件、中繁忙期 1100-1300件、繁忙期 1300件以上
    const threshold_normal_max = 1100;
    const threshold_busy_min = 1100;
    const threshold_very_busy_min = 1300;
    
    // ========== ケース1: 繁忙度が基準値-5%の場合 ==========
    const case1_monthly_cases = 950;  // 1000 * 0.95 = 950 (基準値-5%)
    const case1_total_minutes = case1_monthly_cases * baseline_avg_process_minutes; // 950 * 30 = 28500
    const case1_required_hours = case1_total_minutes / 60; // 28500 / 60 = 475
    const case1_working_hours_per_month = 160; // 1ヶ月あたりの標準労働時間
    const case1_required_staff = Math.ceil(case1_required_hours / case1_working_hours_per_month); // ceil(475/160) = 3
    const case1_expected_staff = 3;
    const case1_scenario_level = 'normal'; // 950件は基準値-5%で通常期

    const result1 = calculateNextMonthRequiredStaff({
      monthly_cases: case1_monthly_cases,
      avg_process_minutes: baseline_avg_process_minutes,
      base_staff_count: base_required_staff_count,
    });

    expect(result1.required_staff_count).toBe(case1_expected_staff);
    expect(result1.scenario_level).toBe(case1_scenario_level);
    expect(result1.required_staff_count).toBeGreaterThan(0);
    expect(result1.required_staff_count).toBeLessThanOrEqual(base_required_staff_count * 2);

    // ========== ケース2: 繁忙度が基準値の場合 ==========
    const case2_monthly_cases = 1000;  // 基準値そのもの
    const case2_total_minutes = case2_monthly_cases * baseline_avg_process_minutes; // 1000 * 30 = 30000
    const case2_required_hours = case2_total_minutes / 60; // 30000 / 60 = 500
    const case2_required_staff = Math.ceil(case2_required_hours / case1_working_hours_per_month); // ceil(500/160) = 4 (切り上げ)
    const case2_expected_staff = 4;
    const case2_scenario_level = 'normal'; // 1000件は基準値で通常期

    const result2 = calculateNextMonthRequiredStaff({
      monthly_cases: case2_monthly_cases,
      avg_process_minutes: baseline_avg_process_minutes,
      base_staff_count: base_required_staff_count,
    });

    expect(result2.required_staff_count).toBe(case2_expected_staff);
    expect(result2.scenario_level).toBe(case2_scenario_level);
    expect(result2.required_staff_count).toBeGreaterThan(0);

    // ========== ケース3: 繁忙度が基準値+5%の場合 ==========
    const case3_monthly_cases = 1050;  // 1000 * 1.05 = 1050 (基準値+5%)
    const case3_total_minutes = case3_monthly_cases * baseline_avg_process_minutes; // 1050 * 30 = 31500
    const case3_required_hours = case3_total_minutes / 60; // 31500 / 60 = 525
    const case3_required_staff = Math.ceil(case3_required_hours / case1_working_hours_per_month); // ceil(525/160) = 4 (切り上げ)
    const case3_expected_staff = 4;
    const case3_scenario_level = 'normal'; // 1050件は基準値+5%で通常期

    const result3 = calculateNextMonthRequiredStaff({
      monthly_cases: case3_monthly_cases,
      avg_process_minutes: baseline_avg_process_minutes,
      base_staff_count: base_required_staff_count,
    });

    expect(result3.required_staff_count).toBe(case3_expected_staff);
    expect(result3.scenario_level).toBe(case3_scenario_level);
    expect(result3.required_staff_count).toBeGreaterThan(0);

    // ========== 妥当性チェック: シナリオ生成結果の検証 ==========
    // 全3ケースのシナリオが配置要件を満たしているか検証

    // 要件1: 各シナリオの必要人員数が正数であること
    expect(result1.required_staff_count).toBeGreaterThan(0);
    expect(result2.required_staff_count).toBeGreaterThan(0);
    expect(result3.required_staff_count).toBeGreaterThan(0);

    // 要件2: 繁忙度が低いほど必要人員数が少ないまたは等しいこと
    expect(result1.required_staff_count).toBeLessThanOrEqual(result2.required_staff_count);
    expect(result2.required_staff_count).toBeLessThanOrEqual(result3.required_staff_count);

    // 要件3: 月次件数増加による必要人員数の増分が合理的か検証
    const staff_increase_1_to_2 = result2.required_staff_count - result1.required_staff_count;
    const staff_increase_2_to_3 = result3.required_staff_count - result2.required_staff_count;
    
    // ケース1→2: 50件増加 (5% 増) で必要人員は最大1名増加
    expect(staff_increase_1_to_2).toBeLessThanOrEqual(1);
    expect(staff_increase_1_to_2).toBeGreaterThanOrEqual(0);
    
    // ケース2→3: 50件増加 (5% 増) で必要人員は最大1名増加
    expect(staff_increase_2_to_3).toBeLessThanOrEqual(1);
    expect(staff_increase_2_to_3).toBeGreaterThanOrEqual(0);

    // 要件4: 生成されたシナリオレベルが正当な値であること
    expect(['normal', 'medium_busy', 'very_busy']).toContain(result1.scenario_level);
    expect(['normal', 'medium_busy', 'very_busy']).toContain(result2.scenario_level);
    expect(['normal', 'medium_busy', 'very_busy']).toContain(result3.scenario_level);

    // 要件5: 月次件数とシナリオレベルの一貫性を確認
    // 1050件は通常期境界付近だが、基準値+5%で通常期と判定されるのが妥当
    if (case3_monthly_cases < threshold_busy_min) {
      expect(['normal', 'medium_busy']).toContain(result3.scenario_level);
    }

    // 要件6: 各境界値ケースの計算値が数学的に一貫していることを確認
    // 処理時間合計 = 月次件数 × 平均処理時間
    expect(result1.required_staff_count * case1_working_hours_per_month * 60).toBeGreaterThanOrEqual(case1_total_minutes);
    expect(result2.required_staff_count * case1_working_hours_per_month * 60).toBeGreaterThanOrEqual(case2_total_minutes);
    expect(result3.required_staff_count * case1_working_hours_per_month * 60).toBeGreaterThanOrEqual(case3_total_minutes);

    // 要件7: 各結果オブジェクトが必須フィールドを含むこと
    expect(result1).toHaveProperty('required_staff_count');
    expect(result1).toHaveProperty('scenario_level');
    expect(result2).toHaveProperty('required_staff_count');
    expect(result2).toHaveProperty('scenario_level');
    expect(result3).toHaveProperty('required_staff_count');
    expect(result3).toHaveProperty('scenario_level');
  });
});