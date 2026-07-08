import { evaluateStandardizationNecessity } from "../../src/logic/it-6-2-2-2";

describe("査定部署別判定基準統一・策定支援機能", () => {
  test("SCEN-879: 月次査定件数が前月比20%以上変動した場合、基準統一の必要性を判定し指示を生成する", () => {
    // ========== パターン1: 前月比+20%（増加）==========
    const prev_month_cases_1 = 100;
    const current_month_cases_plus_20 = 120;
    const threshold = 20;

    const result_increase = evaluateStandardizationNecessity({
      prev_month_cases: prev_month_cases_1,
      current_month_cases: current_month_cases_plus_20,
      threshold_percentage: threshold,
      department_id: "DEPT_001",
    });

    // 基準統一が必要であることを確認
    expect(result_increase.is_standardization_required).toBe(true);

    // 変動率が計算されていることを確認
    const expected_change_rate_increase = 20;
    expect(result_increase.change_rate_percentage).toBe(expected_change_rate_increase);

    // 指示内容に対象部署が含まれていることを確認
    expect(result_increase.instruction_content).toContain("DEPT_001");

    // 指示内容に推奨アクションが含まれていることを確認
    expect(result_increase.instruction_content).toMatch(/基準統一/);
    expect(result_increase.instruction_content).toMatch(/実施/);

    // ========== パターン2: 前月比-20%（減少）==========
    const current_month_cases_minus_20 = 80;

    const result_decrease = evaluateStandardizationNecessity({
      prev_month_cases: prev_month_cases_1,
      current_month_cases: current_month_cases_minus_20,
      threshold_percentage: threshold,
      department_id: "DEPT_001",
    });

    // 基準統一が必要であることを確認
    expect(result_decrease.is_standardization_required).toBe(true);

    // 負の変動率が計算されていることを確認
    const expected_change_rate_decrease = -20;
    expect(result_decrease.change_rate_percentage).toBe(expected_change_rate_decrease);

    // 指示内容が生成されていることを確認
    expect(result_decrease.instruction_content).toContain("DEPT_001");
    expect(result_decrease.instruction_content).toMatch(/基準統一/);

    // ========== パターン3: 前月比19%（閾値未満）==========
    const current_month_cases_19_percent = 119;

    const result_under_threshold = evaluateStandardizationNecessity({
      prev_month_cases: prev_month_cases_1,
      current_month_cases: current_month_cases_19_percent,
      threshold_percentage: threshold,
      department_id: "DEPT_001",
    });

    // 基準統一が不要であることを確認
    expect(result_under_threshold.is_standardization_required).toBe(false);

    // 変動率は計算されるが指示は生成されないことを確認
    const expected_change_rate_19 = 19;
    expect(result_under_threshold.change_rate_percentage).toBe(expected_change_rate_19);

    // 指示内容が空であることを確認
    expect(result_under_threshold.instruction_content).toBe("");

    // ========== パターン4: 前月比-19%（閾値未満の負の値）==========
    const current_month_cases_minus_19 = 81;

    const result_under_threshold_negative = evaluateStandardizationNecessity({
      prev_month_cases: prev_month_cases_1,
      current_month_cases: current_month_cases_minus_19,
      threshold_percentage: threshold,
      department_id: "DEPT_001",
    });

    // 基準統一が不要であることを確認
    expect(result_under_threshold_negative.is_standardization_required).toBe(false);

    // 負の変動率が計算されることを確認
    const expected_change_rate_minus_19 = -19;
    expect(result_under_threshold_negative.change_rate_percentage).toBe(
      expected_change_rate_minus_19
    );

    // 指示内容が空であることを確認
    expect(result_under_threshold_negative.instruction_content).toBe("");
  });
});