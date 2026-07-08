import { describe, test, expect } from "@jest/globals";
import { detectAnomalyAndDiagnose } from "../../src/logic/it-1-br-6-2-1";

describe("査定員別判定ばらつき率と相場乖離傾向の自動集計・分析", () => {
  test("SCEN-1114: 異常判定の閾値境界値（平均の50.0%）でちょうど異常とならない判定を検証", () => {
    // 基準値（平均）を100と設定
    const baseline_value = 100;

    // 判定値を50.0（平均の50.0%）に設定（閾値の境界値）
    const assessed_value = 50.0;

    // 異常判定の閾値を平均値の50.0%に設定
    const anomaly_threshold_ratio = 0.5;

    // テスト用の査定員判定データ
    const assessor_judgment_data = {
      assessor_id: "ASSESSOR_001",
      assessment_count: 20,
      average_deviation_rate: baseline_value,
      current_deviation_rate: assessed_value,
      deviation_pattern: "normal",
      processing_time_minutes: 15,
      judgment_consistency_score: 85,
      assessment_date: "2024-01-15T10:30:00Z",
    };

    // 異常値検出・自動診断機能を実行
    const diagnostic_result = detectAnomalyAndDiagnose(
      assessor_judgment_data,
      anomaly_threshold_ratio
    );

    // 判定値が平均の50.0%（閾値の境界値）の場合、異常判定結果が『異常ではない（正常範囲内）』と判定される
    expect(diagnostic_result.is_anomaly).toBe(false);

    // 異常フラグがOFF状態となる
    expect(diagnostic_result.anomaly_flag).toBe(false);

    // 診断ログに境界値での判定処理が正確に記録される
    expect(diagnostic_result.diagnosis_log).toBeDefined();
    expect(diagnostic_result.diagnosis_log).toContain(
      "threshold_ratio_percent"
    );

    // 診断結果の詳細情報を検証
    expect(diagnostic_result.judgment_result).toBe("normal");
    expect(diagnostic_result.diagnostic_details.baseline_value).toBe(100);
    expect(diagnostic_result.diagnostic_details.assessed_value).toBe(50.0);
    expect(diagnostic_result.diagnostic_details.threshold_ratio_percent).toBe(
      50.0
    );

    // 診断レベルが「正常範囲内」と判定される
    expect(diagnostic_result.diagnostic_level).toBe("normal");

    // ロギング情報が記録されている
    expect(diagnostic_result.logged_at).toBeDefined();
    expect(typeof diagnostic_result.logged_at).toBe("string");

    // 根本原因診断が空（正常判定のため改善対象なし）
    expect(diagnostic_result.root_cause_candidates).toEqual([]);

    // 改善提案が空（正常判定のため改善提案なし）
    expect(diagnostic_result.improvement_suggestions).toEqual([]);
  });
});