import { generatePhaseRolloutSchedule } from '../../src/logic/it-6-2-2-2';

describe('段階的展開スケジュール生成機能', () => {
  test('SCEN-1569: 複数展開対象部署の優先順位付けが効果予測値の高い順に正しく並べられる', () => {
    // Given: 複数の展開対象部署と異なる効果予測値を設定
    const departments = [
      {
        department_id: 'dept_001',
        department_name: '営業部',
        effect_prediction_score: 78,
        learning_data_readiness: 0.65,
        implementation_difficulty: 3,
      },
      {
        department_id: 'dept_002',
        department_name: '企画部',
        effect_prediction_score: 95,
        learning_data_readiness: 0.85,
        implementation_difficulty: 2,
      },
      {
        department_id: 'dept_003',
        department_name: 'IT部',
        effect_prediction_score: 88,
        learning_data_readiness: 0.75,
        implementation_difficulty: 2,
      },
    ];

    // When: 優先順位付けアルゴリズムを実行してスケジュールを生成
    const schedule = generatePhaseRolloutSchedule({
      departments,
      initial_implementation_duration_weeks: 4,
      phase_interval_weeks: 6,
    });

    // Then: 展開対象部署が効果予測値の高い順（降順）に正しく優先順位付けされている
    expect(schedule.rollout_phases).toHaveLength(3);

    // 第1段階: 効果予測値95（企画部）が最優先
    expect(schedule.rollout_phases[0].phase_number).toBe(1);
    expect(schedule.rollout_phases[0].target_department_id).toBe('dept_002');
    expect(schedule.rollout_phases[0].target_department_name).toBe('企画部');
    expect(schedule.rollout_phases[0].effect_prediction_score).toBe(95);
    expect(schedule.rollout_phases[0].priority_rank).toBe(1);

    // 第2段階: 効果予測値88（IT部）が次優先
    expect(schedule.rollout_phases[1].phase_number).toBe(2);
    expect(schedule.rollout_phases[1].target_department_id).toBe('dept_003');
    expect(schedule.rollout_phases[1].target_department_name).toBe('IT部');
    expect(schedule.rollout_phases[1].effect_prediction_score).toBe(88);
    expect(schedule.rollout_phases[1].priority_rank).toBe(2);

    // 第3段階: 効果予測値78（営業部）が最後
    expect(schedule.rollout_phases[2].phase_number).toBe(3);
    expect(schedule.rollout_phases[2].target_department_id).toBe('dept_001');
    expect(schedule.rollout_phases[2].target_department_name).toBe('営業部');
    expect(schedule.rollout_phases[2].effect_prediction_score).toBe(78);
    expect(schedule.rollout_phases[2].priority_rank).toBe(3);

    // 開始日時は現在時刻以降であること
    const phase1_start = new Date(schedule.rollout_phases[0].planned_start_date);
    const now = new Date();
    expect(phase1_start.getTime()).toBeGreaterThanOrEqual(now.getTime() - 1000);

    // 各段階の開始日が適切に間隔を置いて計算されている
    const phase2_start = new Date(schedule.rollout_phases[1].planned_start_date);
    const phase3_start = new Date(schedule.rollout_phases[2].planned_start_date);
    const phase1_to_phase2_weeks = (phase2_start.getTime() - phase1_start.getTime()) / (1000 * 60 * 60 * 24 * 7);
    const phase2_to_phase3_weeks = (phase3_start.getTime() - phase2_start.getTime()) / (1000 * 60 * 60 * 24 * 7);
    expect(Math.round(phase1_to_phase2_weeks)).toBe(6);
    expect(Math.round(phase2_to_phase3_weeks)).toBe(6);

    // スケジュール全体の完了予定日
    expect(schedule.total_completion_date).toBeDefined();
    expect(typeof schedule.total_completion_date).toBe('string');

    // 各段階の効果予測値が降順に並んでいることを確認
    const effect_scores = schedule.rollout_phases.map(phase => phase.effect_prediction_score);
    expect(effect_scores).toEqual([95, 88, 78]);

    // 優先度ランクが昇順（1, 2, 3）に連続していることを確認
    const ranks = schedule.rollout_phases.map(phase => phase.priority_rank);
    expect(ranks).toEqual([1, 2, 3]);
  });
});