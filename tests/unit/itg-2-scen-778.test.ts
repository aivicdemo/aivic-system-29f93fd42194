import {
  aggregateAssessorAccuracyMetrics,
} from "../../src/logic/it-6-2-1-1";

describe("査定担当者別・工種別・金額帯別の判定精度指標の自動集計と可視化", () => {
  // SCEN-778: [error] 精度低下警告・改善提案機能 - 複数の精度指標が同時に低下した場合にエラーが発生しない
  test("複数の精度指標が同時に低下した場合、エラーなく警告メッセージと改善提案を生成する", () => {
    // テストデータ: 複数の精度指標が同時に低下している状態
    const assessment_metrics = {
      assessor_id: "ASS001",
      work_type: "鉄骨工事",
      amount_band: "1000万〜5000万",
      correct_answer_rate: 0.68, // 前月比 -15% (基準値 80%)
      average_response_time_seconds: 2850, // 前月比 +35% (基準値 2100秒)
      judgment_consistency_rate: 0.72, // 前月比 -12% (基準値 85%)
      deviation_accuracy_rate: 0.65, // 前月比 -18% (基準値 80%)
      measurement_period_start_date: "2024-10-01",
      measurement_period_end_date: "2024-10-31",
      previous_month_correct_answer_rate: 0.80,
      previous_month_response_time_seconds: 2100,
      previous_month_consistency_rate: 0.82,
      previous_month_deviation_accuracy_rate: 0.80,
    };

    const baseline_thresholds = {
      correct_answer_rate_threshold: 0.80,
      response_time_seconds_threshold: 2100,
      consistency_rate_threshold: 0.85,
      deviation_accuracy_rate_threshold: 0.80,
      degradation_percentage_threshold: 0.05,
    };

    // 精度低下警告・改善提案機能を実行
    const result = aggregateAssessorAccuracyMetrics(
      assessment_metrics,
      baseline_thresholds
    );

    // 複数の精度指標が低下していることを確認
    expect(result.degradation_alerts).toBeDefined();
    expect(Array.isArray(result.degradation_alerts)).toBe(true);
    expect(result.degradation_alerts.length).toBeGreaterThanOrEqual(4);

    // 正答率低下の警告
    const correct_answer_alert = result.degradation_alerts.find(
      (alert: any) => alert.metric_name === "correct_answer_rate"
    );
    expect(correct_answer_alert).toBeDefined();
    expect(correct_answer_alert.current_value).toBe(0.68);
    expect(correct_answer_alert.baseline_value).toBe(0.80);
    expect(correct_answer_alert.degradation_percentage).toBe(0.15);
    expect(correct_answer_alert.alert_level).toBe("high");
    expect(correct_answer_alert.alert_message).toMatch(/正答率/);

    // 回答時間低下の警告
    const response_time_alert = result.degradation_alerts.find(
      (alert: any) => alert.metric_name === "average_response_time_seconds"
    );
    expect(response_time_alert).toBeDefined();
    expect(response_time_alert.current_value).toBe(2850);
    expect(response_time_alert.baseline_value).toBe(2100);
    expect(response_time_alert.degradation_percentage).toBeCloseTo(0.357, 2);
    expect(response_time_alert.alert_level).toBe("high");
    expect(response_time_alert.alert_message).toMatch(/回答時間/);

    // 判定一貫性低下の警告
    const consistency_alert = result.degradation_alerts.find(
      (alert: any) => alert.metric_name === "judgment_consistency_rate"
    );
    expect(consistency_alert).toBeDefined();
    expect(consistency_alert.current_value).toBe(0.72);
    expect(consistency_alert.baseline_value).toBe(0.85);
    expect(consistency_alert.degradation_percentage).toBeCloseTo(0.153, 2);
    expect(consistency_alert.alert_level).toBe("high");
    expect(consistency_alert.alert_message).toMatch(/判定一貫性/);

    // 乖離精度低下の警告
    const deviation_alert = result.degradation_alerts.find(
      (alert: any) => alert.metric_name === "deviation_accuracy_rate"
    );
    expect(deviation_alert).toBeDefined();
    expect(deviation_alert.current_value).toBe(0.65);
    expect(deviation_alert.baseline_value).toBe(0.80);
    expect(deviation_alert.degradation_percentage).toBe(0.1875);
    expect(deviation_alert.alert_level).toBe("high");
    expect(deviation_alert.alert_message).toMatch(/乖離精度/);

    // 改善提案が複数指標に対応した内容で返されることを確認
    expect(result.improvement_recommendations).toBeDefined();
    expect(Array.isArray(result.improvement_recommendations)).toBe(true);
    expect(result.improvement_recommendations.length).toBeGreaterThanOrEqual(4);

    // 正答率改善提案
    const correct_answer_recommendation = result.improvement_recommendations.find(
      (rec: any) => rec.metric_name === "correct_answer_rate"
    );
    expect(correct_answer_recommendation).toBeDefined();
    expect(correct_answer_recommendation.improvement_priority).toBe("high");
    expect(correct_answer_recommendation.recommended_action).toMatch(/学習データ/);
    expect(correct_answer_recommendation.expected_improvement_rate).toBeGreaterThan(0);

    // 回答時間改善提案
    const response_time_recommendation = result.improvement_recommendations.find(
      (rec: any) => rec.metric_name === "average_response_time_seconds"
    );
    expect(response_time_recommendation).toBeDefined();
    expect(response_time_recommendation.improvement_priority).toBe("high");
    expect(response_time_recommendation.recommended_action).toMatch(/処理フロー/);

    // 判定一貫性改善提案
    const consistency_recommendation = result.improvement_recommendations.find(
      (rec: any) => rec.metric_name === "judgment_consistency_rate"
    );
    expect(consistency_recommendation).toBeDefined();
    expect(consistency_recommendation.improvement_priority).toBe("high");
    expect(consistency_recommendation.recommended_action).toMatch(/基準統一/);

    // 乖離精度改善提案
    const deviation_recommendation = result.improvement_recommendations.find(
      (rec: any) => rec.metric_name === "deviation_accuracy_rate"
    );
    expect(deviation_recommendation).toBeDefined();
    expect(deviation_recommendation.improvement_priority).toBe("high");
    expect(deviation_recommendation.recommended_action).toMatch(/相場データ/);

    // エラーハンドリングが正常に機能し、例外が投げられないことを確認
    expect(result.error_occurred).toBe(false);
    expect(result.error_message).toBeNull();

    // ログ出力に複数指標の低下情報が記録されていることを確認
    expect(result.execution_log).toBeDefined();
    expect(Array.isArray(result.execution_log)).toBe(true);
    expect(result.execution_log.length).toBeGreaterThanOrEqual(4);

    // ログエントリが各指標の低下情報を含んでいる
    expect(result.execution_log.some((log: any) => log.includes("correct_answer_rate"))).toBe(true);
    expect(result.execution_log.some((log: any) => log.includes("average_response_time_seconds"))).toBe(true);
    expect(result.execution_log.some((log: any) => log.includes("judgment_consistency_rate"))).toBe(true);
    expect(result.execution_log.some((log: any) => log.includes("deviation_accuracy_rate"))).toBe(true);

    // 実行結果が構造化されていることを確認
    expect(result.execution_status).toBe("success");
    expect(result.total_degradation_alerts_count).toBe(4);
    expect(result.total_improvement_recommendations_count).toBe(4);
    expect(result.assessor_id).toBe("ASS001");
    expect(result.work_type).toBe("鉄骨工事");
    expect(result.amount_band).toBe("1000万〜5000万");
    expect(result.measurement_period_start_date).toBe("2024-10-01");
    expect(result.measurement_period_end_date).toBe("2024-10-31");
  });
});