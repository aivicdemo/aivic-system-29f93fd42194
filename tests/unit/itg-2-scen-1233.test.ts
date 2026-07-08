import { aggregateJudgmentAccuracyByAuditor } from '../../src/logic/it-6-2-1-1';

describe('査定担当者別・工種別・金額帯別の判定精度指標の自動集計と可視化', () => {
  // SCEN-1233: [error] 改善目標値達成判定と次ステップ自動決定 - 改善後の指標が改善前より悪化した場合、ロールバックが決定される
  test('should automatically determine rollback when post-improvement metrics are worse than baseline', () => {
    // Precondition: 改善前の指標値（ベースライン）を設定
    const baseline_audit_accuracy = 80;
    const baseline_audit_time_minutes = 15;

    // Precondition: 改善施策適用後の指標値
    const post_improvement_audit_accuracy = 75;
    const post_improvement_audit_time_minutes = 18;

    // Input: 改善前後の指標を含むデータセット
    const improvement_result = {
      baseline_metrics: {
        audit_accuracy_percent: baseline_audit_accuracy,
        audit_time_minutes: baseline_audit_time_minutes,
        uniformity_score: 65,
        measurement_timestamp: '2024-01-15T10:00:00Z',
      },
      post_improvement_metrics: {
        audit_accuracy_percent: post_improvement_audit_accuracy,
        audit_time_minutes: post_improvement_audit_time_minutes,
        uniformity_score: 62,
        measurement_timestamp: '2024-01-22T10:00:00Z',
      },
      improvement_target_accuracy_percent: 85,
      improvement_target_time_minutes: 12,
      improvement_target_uniformity_score: 75,
      auditor_id: 'AUD-001',
      construction_type: '鉄筋コンクリート造',
      price_range_category: 'HIGH',
      improvement_initiative_id: 'INIT-2024-001',
    };

    // Execute: 改善目標値達成判定ロジックを実行
    const result = aggregateJudgmentAccuracyByAuditor(improvement_result);

    // Assert: 改善前後の指標値を比較し、悪化判定の条件を確認
    expect(result.accuracy_degradation_percent).toBe(-5);
    expect(result.time_degradation_percent).toBe(20);

    // Assert: ロールバック決定ロジックが呼び出されたことを検証
    expect(result.improvement_goal_achieved).toBe(false);
    expect(result.rollback_decision).toBe(true);

    // Assert: ロールバック決定の結果と次ステップの自動決定内容を確認
    expect(result.next_step).toBe('ROLLBACK_EXECUTION');
    expect(result.next_step_description).toBe('ロールバック実行');

    // Assert: 改善失敗の理由が明確に記録されていることを確認
    expect(result.failure_reasons).toContain('ACCURACY_DEGRADATION');
    expect(result.failure_reasons).toContain('PROCESSING_TIME_INCREASE');
    expect(result.failure_reason_details).toEqual({
      accuracy_degradation_details: {
        baseline_value: 80,
        post_improvement_value: 75,
        degradation_amount: -5,
      },
      processing_time_increase_details: {
        baseline_value: 15,
        post_improvement_value: 18,
        degradation_amount: 3,
      },
    });

    // Assert: システムログに改善失敗とロールバック決定の記録があることを確認
    expect(result.improvement_status).toBe('FAILED');
    expect(result.rollback_execution_timestamp).toBe('2024-01-22T10:00:00Z');
    expect(result.rollback_reason).toMatch(/精度低下|処理時間増加/);
    expect(result.audit_trail_logged).toBe(true);
    expect(result.audit_trail_entry).toEqual({
      event_type: 'IMPROVEMENT_FAILED_ROLLBACK_DECIDED',
      improvement_initiative_id: 'INIT-2024-001',
      auditor_id: 'AUD-001',
      construction_type: '鉄筋コンクリート造',
      price_range_category: 'HIGH',
      baseline_metrics: {
        accuracy: 80,
        time: 15,
        uniformity: 65,
      },
      post_improvement_metrics: {
        accuracy: 75,
        time: 18,
        uniformity: 62,
      },
      failure_classification: 'METRIC_DEGRADATION',
      rollback_decision_timestamp: '2024-01-22T10:00:00Z',
    });

    // Assert: 改善前後の指標値の比較結果を確認
    expect(result.accuracy_target_achievement).toBe(false);
    expect(result.time_target_achievement).toBe(false);
    expect(result.uniformity_target_achievement).toBe(false);

    // Assert: ロールバック実行スケジュールが自動生成されていることを確認
    expect(result.rollback_execution_scheduled).toBe(true);
    expect(result.rollback_start_timestamp).toBe('2024-01-22T11:00:00Z');
    expect(result.rollback_estimated_completion_timestamp).toBe('2024-01-22T12:00:00Z');

    // Assert: 次サイクル改善計画の要件が生成されていることを確認
    expect(result.next_improvement_cycle_required).toBe(true);
    expect(result.next_improvement_cycle_prerequisites).toEqual({
      root_cause_analysis_required: true,
      learning_data_quality_review_required: true,
      model_retraining_investigation_required: true,
      minimum_waiting_period_days: 7,
    });
  });
});