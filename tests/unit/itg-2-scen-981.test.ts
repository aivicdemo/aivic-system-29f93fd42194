import { describe, test, expect } from "@jest/globals";
import { diagnoseQualityIssue } from "../../src/logic/it-6-2-2-2";

describe("査定員別の判定精度・乖離パターン分析ダッシュボード", () => {
  // SCEN-981: [error] 品質低下原因の自動診断と配置調整・改善施策提示 - 品質指標データが不足（サンプル数30未満）の場合、診断は実施されずアラートが返される
  test("SCEN-981: サンプル数29件（30未満）で診断実行時、不足アラートが返される", () => {
    const assessor_id = "ASSESSOR_001";
    const sample_count = 29;
    const accuracy_rate = 92.5;
    const deviation_pattern_count = 5;

    const result = diagnoseQualityIssue({
      assessor_id,
      sample_count,
      accuracy_rate,
      deviation_pattern_count,
    });

    expect(result.diagnosis_executed).toBe(false);
    expect(result.alert_message).toMatch(/サンプル数が不足/);
    expect(result.alert_message).toMatch(/30件/);
    expect(result.root_cause_diagnosis).toBeNull();
    expect(result.placement_adjustment_recommendation).toBeNull();
    expect(result.improvement_measures).toBeNull();
  });
});