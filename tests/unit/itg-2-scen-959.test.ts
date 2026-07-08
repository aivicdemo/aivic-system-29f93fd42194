import { generateMultipleStaffingScenarios } from '../../src/logic/it-6-2-1-1';

describe('複数人員配置シナリオの自動生成', () => {
  // SCEN-959
  test('通常期と繁忙期の異なる応援人数組み合わせで複数シナリオを生成する', () => {
    // 入力値
    const normal_period_base_staff = 3;
    const normal_period_support_patterns = [0, 1, 2];
    const busy_period_base_staff = 5;
    const busy_period_support_patterns = [2, 3, 4];

    // 関数実行
    const result = generateMultipleStaffingScenarios({
      normal_period_base_staff,
      normal_period_support_patterns,
      busy_period_base_staff,
      busy_period_support_patterns,
    });

    // 期待値の算出
    // 通常期パターン数: 3 × 繁忙期パターン数: 3 = 9シナリオ
    const expected_scenario_count = 9;

    // 生成されたシナリオ数が期待値と一致することを検証
    expect(result.scenarios).toHaveLength(expected_scenario_count);

    // 各シナリオの構造と人員配置情報が正しいことを検証
    expect(result.scenarios[0]).toEqual({
      scenario_id: expect.any(String),
      normal_period_total_staff: 3, // 基本人員 3 + 応援 0
      normal_period_support_count: 0,
      busy_period_total_staff: 7, // 基本人員 5 + 応援 2
      busy_period_support_count: 2,
      status: 'created',
    });

    expect(result.scenarios[4]).toEqual({
      scenario_id: expect.any(String),
      normal_period_total_staff: 4, // 基本人員 3 + 応援 1
      normal_period_support_count: 1,
      busy_period_total_staff: 8, // 基本人員 5 + 応援 3
      busy_period_support_count: 3,
      status: 'created',
    });

    expect(result.scenarios[8]).toEqual({
      scenario_id: expect.any(String),
      normal_period_total_staff: 5, // 基本人員 3 + 応援 2
      normal_period_support_count: 2,
      busy_period_total_staff: 9, // 基本人員 5 + 応援 4
      busy_period_support_count: 4,
      status: 'created',
    });

    // 全シナリオが保存可能な状態であることを検証
    expect(result.all_scenarios_saved).toBe(true);
    expect(result.total_saved_count).toBe(9);

    // 生成されたシナリオが系統的に生成されていることを検証
    // 通常期パターンが繰り返し、繁忙期パターンが回転する構造
    let scenario_index = 0;
    for (let busy_idx = 0; busy_idx < busy_period_support_patterns.length; busy_idx++) {
      for (let normal_idx = 0; normal_idx < normal_period_support_patterns.length; normal_idx++) {
        const current_scenario = result.scenarios[scenario_index];
        expect(current_scenario.normal_period_support_count).toBe(
          normal_period_support_patterns[normal_idx]
        );
        expect(current_scenario.busy_period_support_count).toBe(
          busy_period_support_patterns[busy_idx]
        );
        scenario_index++;
      }
    }
  });
});