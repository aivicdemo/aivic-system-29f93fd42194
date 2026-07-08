import { generatePersonnelAllocationScenarios } from '../../src/logic/it-6-2-1-1';

describe('複数人員配置シナリオの自動生成 - 境界値テスト', () => {
  // SCEN-962
  test('必要人員数がちょうど配置可能人員数の境界値で最小構成シナリオが正確に生成される', () => {
    // ===== 前提条件：必要人員数 = 配置可能人員数（境界値）=====
    const required_personnel_count = 25;
    const available_personnel_count = 25;
    const base_personnel_count = 20;
    const max_additional_personnel = 5;
    
    // 過去実績から算出した査定員別の生産性指標
    const assessor_productivity = [
      { assessor_id: 'ASS001', avg_processing_time_minutes: 18, monthly_capacity: 120 },
      { assessor_id: 'ASS002', avg_processing_time_minutes: 20, monthly_capacity: 110 },
      { assessor_id: 'ASS003', avg_processing_time_minutes: 19, monthly_capacity: 115 },
    ];
    
    // 月次査定件数の変動パターン（通常期・繁忙期データ）
    const monthly_volatility_pattern = {
      normal_period_min_cases: 200,
      normal_period_max_cases: 350,
      busy_period_min_cases: 351,
      busy_period_max_cases: 600,
      predicted_next_month_cases: 500, // 繁忙期相当
    };
    
    // 品質基準（判定ばらつき率、処理時間の平均値）
    const quality_standards = {
      max_judgment_variance_rate: 0.15,
      target_avg_processing_time_minutes: 19,
      min_accuracy_rate: 0.92,
    };
    
    // ===== 実行：シナリオ生成関数を呼び出し =====
    const scenarios = generatePersonnelAllocationScenarios({
      required_personnel_count,
      available_personnel_count,
      base_personnel_count,
      max_additional_personnel,
      assessor_productivity,
      monthly_volatility_pattern,
      quality_standards,
    });
    
    // ===== 検証1：シナリオ生成の成功と形式 =====
    expect(scenarios).toBeDefined();
    expect(Array.isArray(scenarios)).toBe(true);
    expect(scenarios.length).toBeGreaterThan(0);
    
    // ===== 検証2：最小構成シナリオの存在と確認 =====
    const minimal_scenario = scenarios.find(
      (scenario) => scenario.total_personnel_count === required_personnel_count
    );
    expect(minimal_scenario).toBeDefined();
    
    if (!minimal_scenario) {
      throw new Error('最小構成シナリオが生成されていません');
    }
    
    // ===== 検証3：余剰人員がないこと（最小構成の確認） =====
    expect(minimal_scenario.total_personnel_count).toBe(required_personnel_count);
    expect(minimal_scenario.excess_personnel_count).toBe(0);
    expect(minimal_scenario.shortage_personnel_count).toBe(0);
    
    // ===== 検証4：人員構成の内訳が正確であること =====
    expect(minimal_scenario.base_personnel_deployed).toBe(base_personnel_count);
    expect(minimal_scenario.additional_personnel_deployed).toBe(5); // 25 - 20 = 5
    expect(minimal_scenario.total_personnel_count).toBe(25);
    
    // ===== 検証5：人員配置位置と職務の割り当て =====
    expect(minimal_scenario.personnel_assignments).toBeDefined();
    expect(Array.isArray(minimal_scenario.personnel_assignments)).toBe(true);
    expect(minimal_scenario.personnel_assignments.length).toBe(25);
    
    // 基本人員と追加人員の割り当てを確認
    const base_assignments = minimal_scenario.personnel_assignments.slice(0, base_personnel_count);
    const additional_assignments = minimal_scenario.personnel_assignments.slice(
      base_personnel_count,
      base_personnel_count + 5
    );
    
    base_assignments.forEach((assignment, index) => {
      expect(assignment.personnel_id).toBeDefined();
      expect(assignment.assignment_position).toBe('base');
      expect(assignment.duty_role).toMatch(/査定員|品質管理/);
      expect(assignment.deployment_start_date).toBeDefined();
    });
    
    additional_assignments.forEach((assignment, index) => {
      expect(assignment.personnel_id).toBeDefined();
      expect(assignment.assignment_position).toBe('additional');
      expect(assignment.duty_role).toMatch(/査定員|サポート/);
      expect(assignment.deployment_start_date).toBeDefined();
    });
    
    // ===== 検証6：システム標準要件への準拠 =====
    // 判定ばらつき率が許容範囲内であること
    expect(minimal_scenario.expected_judgment_variance_rate).toBeLessThanOrEqual(
      quality_standards.max_judgment_variance_rate
    );
    
    // 平均処理時間がターゲット値の±10%以内であること
    const processing_time_tolerance_upper = quality_standards.target_avg_processing_time_minutes * 1.1;
    const processing_time_tolerance_lower = quality_standards.target_avg_processing_time_minutes * 0.9;
    expect(minimal_scenario.expected_avg_processing_time_minutes).toBeLessThanOrEqual(
      processing_time_tolerance_upper
    );
    expect(minimal_scenario.expected_avg_processing_time_minutes).toBeGreaterThanOrEqual(
      processing_time_tolerance_lower
    );
    
    // 精度が最小基準以上であること
    expect(minimal_scenario.expected_accuracy_rate).toBeGreaterThanOrEqual(
      quality_standards.min_accuracy_rate
    );
    
    // ===== 検証7：月次処理能力がニーズを満たすこと =====
    const predicted_cases = monthly_volatility_pattern.predicted_next_month_cases;
    expect(minimal_scenario.expected_monthly_processing_capacity).toBeGreaterThanOrEqual(
      predicted_cases
    );
    
    // ===== 検証8：シナリオの妥当性メタデータ =====
    expect(minimal_scenario.scenario_id).toBeDefined();
    expect(minimal_scenario.scenario_name).toMatch(/最小構成|最適構成/);
    expect(minimal_scenario.feasibility_score).toBeGreaterThanOrEqual(0);
    expect(minimal_scenario.feasibility_score).toBeLessThanOrEqual(100);
    expect(minimal_scenario.is_compliant_with_standards).toBe(true);
    
    // ===== 検証9：複数シナリオ存在時の多様性確認 =====
    if (scenarios.length > 1) {
      // 他のシナリオは最小構成より多くの人員を持つこと
      const non_minimal_scenarios = scenarios.filter(
        (s) => s.total_personnel_count > required_personnel_count
      );
      expect(non_minimal_scenarios.length).toBeGreaterThan(0);
      
      // 各シナリオは異なる人員構成を持つこと
      const scenario_personnel_counts = scenarios.map((s) => s.total_personnel_count);
      const unique_counts = new Set(scenario_personnel_counts);
      expect(unique_counts.size).toBeGreaterThanOrEqual(
        Math.min(scenarios.length, available_personnel_count - base_personnel_count + 1)
      );
    }
    
    // ===== 検証10：生成日時とメタデータの完全性 =====
    expect(minimal_scenario.generated_timestamp).toBeDefined();
    expect(typeof minimal_scenario.generated_timestamp).toBe('string');
    expect(minimal_scenario.generated_timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    
    expect(minimal_scenario.scenario_description).toBeDefined();
    expect(typeof minimal_scenario.scenario_description).toBe('string');
    expect(minimal_scenario.scenario_description.length).toBeGreaterThan(0);
  });
});