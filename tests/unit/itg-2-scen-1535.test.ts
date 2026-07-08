import { judgeDataUpdatePriorityAndTiming } from "../../src/logic/it-6-2-2-1";

describe("学習データ更新優先度・実施タイミング自動判定機能", () => {
  // SCEN-1535: 複数の精度指標が同時に低下した場合の優先度決定
  test("複数精度指標同時低下時に最高優先度と最短実施タイミングを返す", () => {
    // 初期化: テストデータセットと正常値の精度指標を設定
    const precision_normal = 0.92;
    const recall_normal = 0.88;
    const f1_score_normal = 0.90;

    const precision_threshold = 0.80;
    const recall_threshold = 0.75;
    const f1_threshold = 0.78;

    // 単一指標低下時のベースラインとなる優先度スコアを計算
    // （参考値）適合率のみが低下した場合
    const single_metric_priority_score = 35;

    // 複数指標が同時に低下した状態のテストデータ
    const multi_metric_input = {
      precision: 0.72, // 閾値 0.80 以下に低下
      recall: 0.68, // 閾値 0.75 以下に低下
      f1_score: 0.70, // 閾値 0.78 以下に低下
      data_volume_ratio: 0.95, // 学習データ件数は十分
      last_model_update_days_ago: 8, // 前回更新から8日経過
      feedback_incident_count: 12, // フィードバック件数は比較的多い
    };

    // 学習データ更新優先度・実施タイミング自動判定を実行
    const result = judgeDataUpdatePriorityAndTiming(multi_metric_input);

    // 1. 複数指標低下時の優先度レベルを検証（最高優先度）
    expect(result.priority_level).toBe("critical");

    // 2. 優先度スコアが単一指標低下時より高いことを検証
    // 複数指標低下時は寄与度が合算されるため、スコアが高くなる
    expect(result.priority_score).toBeGreaterThan(single_metric_priority_score);
    // 具体的な期待値：複数指標低下時は各指標の寄与度合算で80以上
    expect(result.priority_score).toBeGreaterThanOrEqual(80);

    // 3. 実施タイミングが最短値であることを検証
    // 複数指標低下時は即座または翌営業日
    expect(result.recommended_execution_timing).toMatch(/即座|翌営業日/);

    // 4. 実施タイミングの具体値を検証
    // 推奨実行日時が本日または翌営業日の営業時間内であることを確認
    const exec_date = new Date(result.recommended_execution_datetime);
    const today = new Date("2024-01-15T09:00:00Z");
    const next_business_day = new Date("2024-01-16T09:00:00Z");

    const is_today_or_tomorrow =
      (exec_date >= today && exec_date < new Date("2024-01-15T18:00:00Z")) ||
      (exec_date >= next_business_day &&
        exec_date < new Date("2024-01-16T18:00:00Z"));

    expect(is_today_or_tomorrow).toBe(true);

    // 5. 各指標の寄与度を検証
    expect(result.metric_contributions).toBeDefined();
    expect(result.metric_contributions.precision_contribution).toBeGreaterThan(
      0
    );
    expect(result.metric_contributions.recall_contribution).toBeGreaterThan(0);
    expect(result.metric_contributions.f1_contribution).toBeGreaterThan(0);

    // 6. 各指標の寄与度の合計が総優先度スコアに寄与していることを検証
    const total_contributions =
      result.metric_contributions.precision_contribution +
      result.metric_contributions.recall_contribution +
      result.metric_contributions.f1_contribution;

    expect(total_contributions).toBeGreaterThan(0);
    // 複数指標低下時は各寄与度が適切に合算されていることを確認
    expect(result.priority_score).toBeGreaterThanOrEqual(total_contributions);

    // 7. トレース情報（判定ロジック実行経路）を検証
    expect(result.trace_info).toBeDefined();
    expect(result.trace_info.metrics_evaluated).toContain("precision");
    expect(result.trace_info.metrics_evaluated).toContain("recall");
    expect(result.trace_info.metrics_evaluated).toContain("f1_score");

    // 8. 判定ロジックで検出された低下指標を確認
    expect(result.trace_info.degraded_metrics).toContain("precision");
    expect(result.trace_info.degraded_metrics).toContain("recall");
    expect(result.trace_info.degraded_metrics).toContain("f1_score");
    expect(result.trace_info.degraded_metrics.length).toBe(3);

    // 9. 複数指標低下時の判定根拠を検証
    expect(result.trace_info.decision_reason).toMatch(/複数指標|同時低下/);

    // 10. 推奨される対応内容（学習データ追加 or モデル再学習）を検証
    expect(result.recommended_action).toBeDefined();
    expect(result.recommended_action).toMatch(/データ追加|再学習|パラメータ調整/);

    // 11. 判定スコアの構成要素を詳細確認
    // 精度指標の低下度 = （閾値 - 実測値）/ 閾値 × 100
    const precision_degradation_rate =
      ((precision_threshold - 0.72) / precision_threshold) * 100;
    const recall_degradation_rate =
      ((recall_threshold - 0.68) / recall_threshold) * 100;
    const f1_degradation_rate = ((f1_threshold - 0.70) / f1_threshold) * 100;

    // 各指標の低下度が正の値であることを確認
    expect(precision_degradation_rate).toBeGreaterThan(0);
    expect(recall_degradation_rate).toBeGreaterThan(0);
    expect(f1_degradation_rate).toBeGreaterThan(0);

    // 12. 複数指標低下時と単一指標低下時の優先度差を検証
    // 単一指標低下時のテストケース（適合率のみ低下）
    const single_metric_input = {
      precision: 0.72, // 閾値以下に低下
      recall: 0.88, // 正常値
      f1_score: 0.90, // 正常値
      data_volume_ratio: 0.95,
      last_model_update_days_ago: 8,
      feedback_incident_count: 12,
    };

    const single_result = judgeDataUpdatePriorityAndTiming(single_metric_input);

    // 複数指標低下時の優先度スコアが単一指標低下時より高いことを確認
    expect(result.priority_score).toBeGreaterThan(single_result.priority_score);

    // 13. 実施タイミングの差を検証
    // 複数指標低下時は更に早い実施が推奨される
    const multi_exec_hours = new Date(
      result.recommended_execution_datetime
    ).getHours();
    const single_exec_hours = new Date(
      single_result.recommended_execution_datetime
    ).getHours();

    expect(multi_exec_hours).toBeLessThanOrEqual(single_exec_hours);

    // 14. 更新対象データの推奨内容を検証
    expect(result.recommended_update_scope).toBeDefined();
    expect(
      result.recommended_update_scope.target_data_types
    ).toBeDefined();
    // 複数指標低下時は複合的な学習データ更新が推奨される
    expect(
      result.recommended_update_scope.target_data_types.length
    ).toBeGreaterThanOrEqual(2);

    // 15. 判定結果の完全性を最終確認
    expect(result.judgment_id).toBeDefined(); // 判定ID（トレーサビリティ用）
    expect(result.judgment_timestamp).toBeDefined(); // 判定実行日時
    expect(typeof result.priority_score).toBe("number");
    expect(typeof result.priority_level).toBe("string");
  });
});