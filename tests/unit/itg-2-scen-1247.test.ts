import { calculatePhaseBasedRolloutPlan } from '../../src/logic/it-6-2-1-1';

describe('新精度基準の段階的ロールアウト計画立案', () => {
  test('SCEN-1247: 複数対象グループに対して段階的ロールアウト計画が複数フェーズで分割されて立案される', () => {
    // 入力: 複数対象グループの精度基準更新リクエスト
    const rolloutInput = {
      target_groups: [
        {
          group_id: 'GROUP_A',
          group_name: 'グループA',
          current_assessor_count: 15,
          average_processing_time_minutes: 45,
          current_accuracy_rate: 0.87,
          new_accuracy_target: 0.92
        },
        {
          group_id: 'GROUP_B',
          group_name: 'グループB',
          current_assessor_count: 12,
          average_processing_time_minutes: 52,
          current_accuracy_rate: 0.84,
          new_accuracy_target: 0.92
        },
        {
          group_id: 'GROUP_C',
          group_name: 'グループC',
          current_assessor_count: 10,
          average_processing_time_minutes: 48,
          current_accuracy_rate: 0.85,
          new_accuracy_target: 0.92
        }
      ],
      rollout_strategy: 'phased',
      evaluation_period_days: 30,
      success_criteria_threshold: 0.90,
      rollback_trigger_accuracy_drop_threshold: -0.05
    };

    // 実行: 段계적 로ールアウト計画立案
    const rollout_plan = calculatePhaseBasedRolloutPlan(rolloutInput);

    // 検証1: ロールアウト計画が3フェーズ以上に分割されていることを確認
    expect(rollout_plan.phases.length).toBeGreaterThanOrEqual(3);

    // 検証2: フェーズ1の詳細情報を確認
    const phase_1 = rollout_plan.phases[0];
    expect(phase_1.phase_number).toBe(1);
    expect(phase_1.phase_name).toBe('Phase 1: パイロット導入');
    expect(phase_1.target_group_ids).toEqual(['GROUP_A']);
    expect(phase_1.start_date).toBe('2025-02-01');
    expect(phase_1.end_date).toBe('2025-03-02');
    expect(phase_1.duration_days).toBe(30);
    expect(phase_1.rollout_content).toEqual({
      new_accuracy_standard: 0.92,
      updated_judgment_logic: 'v2.1',
      learning_data_refresh: true,
      training_materials_provided: true
    });
    expect(phase_1.success_criteria).toEqual({
      target_accuracy_rate: 0.90,
      acceptable_processing_time_minutes: 48,
      assessor_feedback_acceptance_rate: 0.80
    });
    expect(phase_1.rollback_conditions).toEqual({
      accuracy_drop_threshold: -0.05,
      system_downtime_hours_threshold: 4,
      critical_error_count_threshold: 5
    });
    expect(phase_1.resource_allocation).toEqual({
      training_hours_per_assessor: 8,
      support_personnel_count: 2,
      system_capacity_buffer_percent: 20
    });

    // 検証3: フェーズ2の詳細情報を確認
    const phase_2 = rollout_plan.phases[1];
    expect(phase_2.phase_number).toBe(2);
    expect(phase_2.phase_name).toBe('Phase 2: 段階的拡大');
    expect(phase_2.target_group_ids).toEqual(['GROUP_B']);
    expect(phase_2.start_date).toBe('2025-03-03');
    expect(phase_2.end_date).toBe('2025-04-02');
    expect(phase_2.duration_days).toBe(31);
    expect(phase_2.dependency_conditions).toEqual({
      depends_on_phase: 1,
      prerequisite_success_criteria_met: true,
      phase_1_completion_required: true
    });
    expect(phase_2.rollout_content).toEqual({
      new_accuracy_standard: 0.92,
      updated_judgment_logic: 'v2.1',
      learning_data_refresh: true,
      training_materials_provided: true
    });
    expect(phase_2.success_criteria).toEqual({
      target_accuracy_rate: 0.90,
      acceptable_processing_time_minutes: 50,
      assessor_feedback_acceptance_rate: 0.80
    });
    expect(phase_2.rollback_conditions).toEqual({
      accuracy_drop_threshold: -0.05,
      system_downtime_hours_threshold: 4,
      critical_error_count_threshold: 5
    });
    expect(phase_2.resource_allocation).toEqual({
      training_hours_per_assessor: 6,
      support_personnel_count: 1,
      system_capacity_buffer_percent: 15
    });

    // 検証4: フェーズ3の詳細情報を確認
    const phase_3 = rollout_plan.phases[2];
    expect(phase_3.phase_number).toBe(3);
    expect(phase_3.phase_name).toBe('Phase 3: 本格展開');
    expect(phase_3.target_group_ids).toEqual(['GROUP_C']);
    expect(phase_3.start_date).toBe('2025-04-03');
    expect(phase_3.end_date).toBe('2025-05-03');
    expect(phase_3.duration_days).toBe(30);
    expect(phase_3.dependency_conditions).toEqual({
      depends_on_phase: 2,
      prerequisite_success_criteria_met: true,
      phase_2_completion_required: true
    });
    expect(phase_3.rollout_content).toEqual({
      new_accuracy_standard: 0.92,
      updated_judgment_logic: 'v2.1',
      learning_data_refresh: true,
      training_materials_provided: true
    });
    expect(phase_3.success_criteria).toEqual({
      target_accuracy_rate: 0.90,
      acceptable_processing_time_minutes: 49,
      assessor_feedback_acceptance_rate: 0.80
    });
    expect(phase_3.rollback_conditions).toEqual({
      accuracy_drop_threshold: -0.05,
      system_downtime_hours_threshold: 4,
      critical_error_count_threshold: 5
    });
    expect(phase_3.resource_allocation).toEqual({
      training_hours_per_assessor: 4,
      support_personnel_count: 1,
      system_capacity_buffer_percent: 10
    });

    // 検証5: フェーズ間の遷移ルールが正しく設定されているか確認
    expect(rollout_plan.phase_transition_rules).toEqual({
      phase_1_to_phase_2: {
        condition: 'Phase 1 success criteria achieved',
        success_rate_threshold: 0.90,
        minimum_evaluation_period_days: 30,
        auto_proceed_if_success: true,
        manual_approval_required: false
      },
      phase_2_to_phase_3: {
        condition: 'Phase 2 success criteria achieved',
        success_rate_threshold: 0.90,
        minimum_evaluation_period_days: 30,
        auto_proceed_if_success: true,
        manual_approval_required: false
      }
    });

    // 検証6: 計画全体のスケジュール情報を確認
    expect(rollout_plan.overall_schedule).toEqual({
      total_phases: 3,
      total_duration_days: 91,
      start_date: '2025-02-01',
      end_date: '2025-05-03',
      total_target_assessors: 37
    });

    // 検証7: 計画全体のリソース割当を確認
    expect(rollout_plan.overall_resource_allocation).toEqual({
      total_training_hours: 288,
      average_support_personnel_per_phase: 1.33,
      average_system_capacity_buffer_percent: 15,
      estimated_total_cost_yen: 2850000
    });

    // 検証8: 計画全体のリスク評価を確認
    expect(rollout_plan.risk_assessment).toEqual({
      overall_risk_level: 'medium',
      identified_risks: [
        {
          risk_id: 'R_001',
          description: 'フェーズ1でのロールアウト成功率が90%未満の場合、フェーズ2の遅延が発生する可能性',
          probability: 'medium',
          impact: 'high',
          mitigation_strategy: 'フェーズ1で追加トレーニング時間を確保し、成功率向上を優先'
        },
        {
          risk_id: 'R_002',
          description: 'システム容量がフェーズ3での同時アクセスに対応できない可能性',
          probability: 'low',
          impact: 'high',
          mitigation_strategy: 'フェーズ2終了時に負荷テストを実施し、必要に応じてスケーリング準備'
        },
        {
          risk_id: 'R_003',
          description: '学習データの更新が遅延し、新精度基準の判定精度が達成できない可能性',
          probability: 'medium',
          impact: 'medium',
          mitigation_strategy: 'フェーズ1開始前に学習データの最終検証を完了'
        }
      ],
      contingency_plan: 'ロールバック条件に基づいて各フェーズで一時停止または前フェーズへの戻りが自動実行される',
      contingency_duration_days: 7
    });

    // 検証9: 各フェーズのステータスが正しく初期化されていることを確認
    expect(rollout_plan.phases.every((p) => p.status === 'planned')).toBe(true);

    // 検証10: 全体計画オブジェクトの構造が完全であることを確認
    expect(rollout_plan).toHaveProperty('phases');
    expect(rollout_plan).toHaveProperty('phase_transition_rules');
    expect(rollout_plan).toHaveProperty('overall_schedule');
    expect(rollout_plan).toHaveProperty('overall_resource_allocation');
    expect(rollout_plan).toHaveProperty('risk_assessment');
    expect(rollout_plan).toHaveProperty('plan_creation_timestamp');
    expect(rollout_plan).toHaveProperty('plan_id');
    expect(typeof rollout_plan.plan_id).toBe('string');
    expect(rollout_plan.plan_id.length).toBeGreaterThan(0);
  });
});