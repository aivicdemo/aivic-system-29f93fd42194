import { analyzeDiagnosticCauseAndActionOnOCRPrecisionDegradation } from "../../src/logic/it-6-2-2-2";

describe("査定員別の判定精度・乖離パターン分析ダッシュボード", () => {
  test("SCEN-1541: 精度低下時の原因特定と対応方法の自動判定 - OCR精度低下時に原因が正しく特定され、対応方法が自動判定される", () => {
    // 事前設定：正常なOCR精度（基準値以上）の学習データ
    const baseline_ocr_precision = 95.5;
    const baseline_measurement_date = "2024-01-15T10:00:00Z";
    const baseline_total_samples = 1000;
    const baseline_correct_readings = 955;

    // 精度低下を引き起こすシナリオ：意図的に精度を低下させたOCR処理セット
    const degraded_ocr_precision = 87.2;
    const degraded_measurement_date = "2024-01-15T11:00:00Z";
    const degraded_total_samples = 1000;
    const degraded_correct_readings = 872;

    // 精度低下率の計算
    const precision_drop_rate = ((baseline_ocr_precision - degraded_ocr_precision) / baseline_ocr_precision) * 100;
    // = ((95.5 - 87.2) / 95.5) * 100 = (8.3 / 95.5) * 100 = 8.69%

    // 原因特定に必要なパラメータ
    const model_generation = 3;
    const data_distribution_skewness = 0.45;
    const training_data_count = 5000;
    const retraining_interval_days = 30;
    const days_since_last_retraining = 25;
    const parameter_optimization_score = 0.72;

    // 入力パラメータをオブジェクトとして組み立て
    const input_params = {
      baseline_precision: baseline_ocr_precision,
      current_precision: degraded_ocr_precision,
      measurement_timestamp: degraded_measurement_date,
      model_generation: model_generation,
      data_distribution_skewness: data_distribution_skewness,
      training_data_count: training_data_count,
      days_since_last_retraining: days_since_last_retraining,
      parameter_optimization_score: parameter_optimization_score,
      total_samples_tested: degraded_total_samples,
    };

    // 原因特定エンジンを実行
    const diagnosis_result = analyzeDiagnosticCauseAndActionOnOCRPrecisionDegradation(input_params);

    // (1) 原因が3つのカテゴリのいずれかに正しく特定されるか検証
    expect(diagnosis_result.primary_cause).toMatch(/data_addition|retraining|parameter_tuning/);

    // 精度低下率が8.69%のため、データ追加不足が主因と判定される
    expect(diagnosis_result.primary_cause).toBe("data_addition");

    // (2) 各原因に対して適切な対応方法が自動判定されるか検証
    expect(diagnosis_result.recommended_actions).toBeDefined();
    expect(Array.isArray(diagnosis_result.recommended_actions)).toBe(true);
    expect(diagnosis_result.recommended_actions.length).toBeGreaterThan(0);

    // 推奨アクションに「過去案件データ追加」が含まれることを確認
    const has_data_addition_action = diagnosis_result.recommended_actions.some(
      (action: { action_type: string; description: string }) => action.action_type === "data_addition"
    );
    expect(has_data_addition_action).toBe(true);

    // (3) 判定結果にスコア付けおよび信頼度が含まれるか検証
    expect(diagnosis_result.confidence_score).toBeDefined();
    expect(typeof diagnosis_result.confidence_score).toBe("number");
    expect(diagnosis_result.confidence_score).toBeGreaterThanOrEqual(0);
    expect(diagnosis_result.confidence_score).toBeLessThanOrEqual(100);

    // 精度低下が明確（8.69%）なため信頼度は高く、85以上と期待
    expect(diagnosis_result.confidence_score).toBeGreaterThanOrEqual(85);

    // 各原因のスコア
    expect(diagnosis_result.cause_scores).toBeDefined();
    expect(diagnosis_result.cause_scores.data_addition_score).toBeDefined();
    expect(diagnosis_result.cause_scores.retraining_score).toBeDefined();
    expect(diagnosis_result.cause_scores.parameter_tuning_score).toBeDefined();

    // データ追加が最も高いスコアを持つこと
    const max_score = Math.max(
      diagnosis_result.cause_scores.data_addition_score,
      diagnosis_result.cause_scores.retraining_score,
      diagnosis_result.cause_scores.parameter_tuning_score
    );
    expect(diagnosis_result.cause_scores.data_addition_score).toBe(max_score);

    // データ追加スコアは70以上と期待（精度低下が顕著なため）
    expect(diagnosis_result.cause_scores.data_addition_score).toBeGreaterThanOrEqual(70);

    // (4) 推奨アクションが優先度順に出力されるか検証
    // 各アクションが優先度フィールドを持つか確認
    diagnosis_result.recommended_actions.forEach(
      (action: { action_type: string; priority: number; estimated_implementation_days: number; confidence_score_after_action: number }) => {
        expect(action.priority).toBeDefined();
        expect(typeof action.priority).toBe("number");
        expect(action.priority).toBeGreaterThanOrEqual(1);
        expect(action.priority).toBeLessThanOrEqual(diagnosis_result.recommended_actions.length);

        expect(action.estimated_implementation_days).toBeDefined();
        expect(typeof action.estimated_implementation_days).toBe("number");
        expect(action.estimated_implementation_days).toBeGreaterThan(0);

        expect(action.confidence_score_after_action).toBeDefined();
        expect(typeof action.confidence_score_after_action).toBe("number");
      }
    );

    // 最初のアクションが最高優先度（priority = 1）であること
    const first_action = diagnosis_result.recommended_actions[0];
    expect(first_action.priority).toBe(1);

    // データ追加アクションの想定実装期間は3～7日と期待
    expect(first_action.estimated_implementation_days).toBeGreaterThanOrEqual(3);
    expect(first_action.estimated_implementation_days).toBeLessThanOrEqual(7);

    // データ追加実施後の予想精度向上スコアは90以上と期待
    expect(first_action.confidence_score_after_action).toBeGreaterThanOrEqual(90);

    // (5) 判定履歴がトレーサビリティとして記録されるか検証
    expect(diagnosis_result.traceability_log).toBeDefined();
    expect(Array.isArray(diagnosis_result.traceability_log)).toBe(true);
    expect(diagnosis_result.traceability_log.length).toBeGreaterThan(0);

    // トレーサビリティログの各エントリが必須フィールドを持つか確認
    diagnosis_result.traceability_log.forEach(
      (log_entry: { timestamp: string; analysis_stage: string; intermediate_result: string; confidence_level: number }) => {
        expect(log_entry.timestamp).toBeDefined();
        expect(typeof log_entry.timestamp).toBe("string");

        expect(log_entry.analysis_stage).toBeDefined();
        expect(["precision_measurement", "cause_analysis", "action_determination", "final_decision"]).toContain(log_entry.analysis_stage);

        expect(log_entry.intermediate_result).toBeDefined();
        expect(typeof log_entry.intermediate_result).toBe("string");

        expect(log_entry.confidence_level).toBeDefined();
        expect(typeof log_entry.confidence_level).toBe("number");
      }
    );

    // トレーサビリティログが時系列順に記録されていることを確認
    for (let i = 1; i < diagnosis_result.traceability_log.length; i++) {
      const prev_timestamp = new Date(diagnosis_result.traceability_log[i - 1].timestamp).getTime();
      const curr_timestamp = new Date(diagnosis_result.traceability_log[i].timestamp).getTime();
      expect(curr_timestamp).toBeGreaterThanOrEqual(prev_timestamp);
    }

    // 分析ステージが正しい順序で含まれることを確認
    const stages = diagnosis_result.traceability_log.map((log: { analysis_stage: string }) => log.analysis_stage);
    const precision_measurement_index = stages.indexOf("precision_measurement");
    const cause_analysis_index = stages.indexOf("cause_analysis");
    const action_determination_index = stages.indexOf("action_determination");

    expect(precision_measurement_index).toBeLessThan(cause_analysis_index);
    expect(cause_analysis_index).toBeLessThan(action_determination_index);

    // 最終的な判定結果が output で返されることを確認
    expect(diagnosis_result.diagnosis_summary).toBeDefined();
    expect(typeof diagnosis_result.diagnosis_summary).toBe("string");
    expect(diagnosis_result.diagnosis_summary.length).toBeGreaterThan(0);

    // 診断サマリーに主因（データ追加）が記載されていること
    expect(diagnosis_result.diagnosis_summary).toMatch(/data_addition|過去案件|学習データ/i);

    // 全体的な検証：結果オブジェクトが必須フィールドをすべて持つ
    expect(diagnosis_result).toHaveProperty("primary_cause");
    expect(diagnosis_result).toHaveProperty("recommended_actions");
    expect(diagnosis_result).toHaveProperty("confidence_score");
    expect(diagnosis_result).toHaveProperty("cause_scores");
    expect(diagnosis_result).toHaveProperty("traceability_log");
    expect(diagnosis_result).toHaveProperty("diagnosis_summary");
  });
});