import { analyzeCompositeDiagnosisOnAIPrecisionDeclineAndFeedbackSurge } from "../../src/logic/it-6-2-2-2";

describe("査定員別の判定精度・乖離パターン分析ダッシュボード", () => {
  test("SCEN-1542: AI判定精度低下とユーザーフィードバック件数急増が同時に検出された場合、複合的な原因分析が実行される", () => {
    // テストデータ準備: AI判定精度が5%以上低下した状況
    const previous_ai_precision = 85.0;
    const current_ai_precision = 79.5;
    const precision_decline_rate = ((previous_ai_precision - current_ai_precision) / previous_ai_precision) * 100;
    // 期待: (85.0 - 79.5) / 85.0 * 100 = 6.47% > 5%

    // テストデータ準備: ユーザーフィードバック件数が前日比150%以上増加
    const previous_feedback_count = 20;
    const current_feedback_count = 50;
    const feedback_increase_rate = ((current_feedback_count - previous_feedback_count) / previous_feedback_count) * 100;
    // 期待: (50 - 20) / 20 * 100 = 150% = 150%

    // 複合的な原因分析機能のエントリーポイントを呼び出す
    const input_payload = {
      previous_ai_precision: previous_ai_precision,
      current_ai_precision: current_ai_precision,
      previous_feedback_count: previous_feedback_count,
      current_feedback_count: current_feedback_count,
      analysis_timestamp: "2024-11-15T14:30:00Z",
      affected_category_list: ["office_construction", "interior_finishing"],
    };

    const analysis_result = analyzeCompositeDiagnosisOnAIPrecisionDeclineAndFeedbackSurge(
      input_payload
    );

    // 精度低下の原因候補を抽出していることを確認
    expect(analysis_result.ai_precision_decline_root_causes).toBeDefined();
    expect(Array.isArray(analysis_result.ai_precision_decline_root_causes)).toBe(true);
    expect(analysis_result.ai_precision_decline_root_causes.length).toBeGreaterThan(0);

    // 原因候補にモデルドリフト、入力データの異常が含まれていることを確認
    const decline_cause_names = analysis_result.ai_precision_decline_root_causes.map(
      (cause: any) => cause.root_cause_name
    );
    expect(decline_cause_names).toContain("model_drift");
    expect(decline_cause_names).toContain("input_data_anomaly");

    // ユーザーフィードバック件数急増の原因候補を抽出していることを確認
    expect(analysis_result.feedback_surge_root_causes).toBeDefined();
    expect(Array.isArray(analysis_result.feedback_surge_root_causes)).toBe(true);
    expect(analysis_result.feedback_surge_root_causes.length).toBeGreaterThan(0);

    // 原因候補にUI変更、新規ユーザー増加、システム障害が含まれていることを確認
    const feedback_cause_names = analysis_result.feedback_surge_root_causes.map(
      (cause: any) => cause.root_cause_name
    );
    expect(feedback_cause_names).toContain("ui_change");
    expect(feedback_cause_names).toContain("new_user_increase");
    expect(feedback_cause_names).toContain("system_fault");

    // 両者の原因候補を関連付け、共通要因を分析していることを確認
    expect(analysis_result.correlation_analysis).toBeDefined();
    expect(analysis_result.correlation_analysis.common_factors).toBeDefined();
    expect(Array.isArray(analysis_result.correlation_analysis.common_factors)).toBe(true);

    // 分析結果として、優先度付きの対応方法リストが生成されていることを確認
    expect(analysis_result.remediation_action_list).toBeDefined();
    expect(Array.isArray(analysis_result.remediation_action_list)).toBe(true);
    expect(analysis_result.remediation_action_list.length).toBeGreaterThan(0);

    // 対応方法リストが優先度でソートされていることを確認
    for (let i = 0; i < analysis_result.remediation_action_list.length - 1; i++) {
      const current_priority = analysis_result.remediation_action_list[i].priority_score;
      const next_priority = analysis_result.remediation_action_list[i + 1].priority_score;
      expect(current_priority).toBeGreaterThanOrEqual(next_priority);
    }

    // 対応方法に具体的なアクションが含まれていることを確認
    const action_sample = analysis_result.remediation_action_list[0];
    expect(action_sample.action_type).toBeDefined();
    expect(["model_retraining", "input_data_validation", "user_education", "ui_adjustment", "system_fault_recovery"]).toContain(
      action_sample.action_type
    );
    expect(action_sample.action_description).toBeDefined();
    expect(typeof action_sample.action_description).toBe("string");
    expect(action_sample.action_description.length).toBeGreaterThan(0);

    // 根拠となる分析結果が付加されていることを確認
    expect(action_sample.supporting_analysis).toBeDefined();
    expect(action_sample.supporting_analysis.precision_decline_rate).toBe(6.47);
    expect(action_sample.supporting_analysis.feedback_increase_rate).toBe(150);

    // 分析結果のログが適切に記録されていることを確認
    expect(analysis_result.analysis_log).toBeDefined();
    expect(typeof analysis_result.analysis_log).toBe("string");
    expect(analysis_result.analysis_log.length).toBeGreaterThan(0);
    expect(analysis_result.analysis_log).toMatch(/composite.*analysis/i);
    expect(analysis_result.analysis_log).toMatch(/model_drift|input_data|ui_change/i);

    // 分析実行のタイムスタンプが記録されていることを確認
    expect(analysis_result.analysis_executed_timestamp).toBeDefined();
    expect(analysis_result.analysis_executed_timestamp).toBe("2024-11-15T14:30:00Z");

    // 複合分析フラグが立っていることを確認
    expect(analysis_result.is_composite_diagnosis).toBe(true);

    // 全体の分析結果構造が期待通りであることを確認
    expect(analysis_result.summary).toBeDefined();
    expect(analysis_result.summary.total_root_causes_identified).toBeGreaterThan(0);
    expect(analysis_result.summary.total_remediation_actions).toBeGreaterThan(0);
  });
});