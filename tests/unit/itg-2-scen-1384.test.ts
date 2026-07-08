import { analyzeAccuracyDeclineAndIdentifyCustimizationScope } from "../../src/logic/it-6-2-1-1";

describe("精度低下原因の分析・カスタマイズ範囲特定", () => {
  test("SCEN-1384: 判定ロジック不適合が唯一の原因の場合、カスタマイズ範囲が最小化される", () => {
    const input = {
      evaluation_case_id: "case_001",
      assessment_employee_id: "emp_123",
      work_type: "建築工事",
      amount_band: "1000万～5000万円",
      detected_accuracy_decline_rate: 8.5,
      data_quality_status: "normal",
      judgment_logic_status: "mismatched",
      parameter_setting_status: "normal",
      external_data_linkage_status: "normal",
      analysis_timestamp: "2024-12-15T10:30:00Z",
    };

    const result = analyzeAccuracyDeclineAndIdentifyCustimizationScope(input);

    expect(result.accuracy_decline_cause_identified).toBe(true);
    expect(result.primary_cause).toBe("judgment_logic_mismatch");
    expect(result.secondary_causes).toEqual([]);
    expect(result.root_cause_confirmed).toBe(true);

    expect(result.customization_target_scope).toEqual({
      judgment_logic: true,
      data_quality_improvement: false,
      parameter_adjustment: false,
      external_data_integration: false,
      other_business_domains: false,
    });

    expect(result.customization_scope_minimization_ratio).toBe(0.9);

    expect(result.target_customization_items).toEqual([
      "judgment_logic_rule_refinement",
    ]);

    expect(result.estimated_customization_effort_hours).toBe(16);
    expect(result.estimated_implementation_cost_jpy).toBe(320000);

    expect(result.avoided_unnecessary_customization_scope_ratio).toBe(0.9);

    expect(result.analysis_result_status).toBe("success");
    expect(result.analysis_confidence_score).toBe(0.95);
  });
});