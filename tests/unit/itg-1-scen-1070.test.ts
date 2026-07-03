import { evaluateNewStaffCompetency } from '../../src/logic/it-1-2-1';

describe('営業成果データから請求対象項目を自動抽出し、顧客ごと・サービスごとの請求額を集計する機能', () => {
  // SCEN-1070: [edge] 新入スタッフ到達度評価機能 - 3業務すべてが境界線上の評価スコアの場合に正確に合格判定される
  test('3業務すべてが合格最低基準値である場合に正確に合格と判定される', () => {
    const staff_id = 'STAFF_001';
    const staff_name = 'Tanaka Yuki';
    const onboarding_start_date = '2024-01-10';

    // 3業務の評価スコア：すべて境界値60点に設定
    const task_a_score = 60;
    const task_b_score = 60;
    const task_c_score = 60;

    const passing_threshold = 60;
    const required_tasks_count = 3;

    const input = {
      staff_id,
      staff_name,
      onboarding_start_date,
      task_a_score,
      task_b_score,
      task_c_score,
      passing_threshold,
      required_tasks_count,
    };

    const result = evaluateNewStaffCompetency(input);

    // 合格判定が正確に実行される
    expect(result.judgment).toBe('合格');

    // 3業務すべてが合格基準を満たしている
    expect(result.task_a_passed).toBe(true);
    expect(result.task_b_passed).toBe(true);
    expect(result.task_c_passed).toBe(true);

    // 合格業務数が3であることを確認
    expect(result.passed_tasks_count).toBe(3);

    // 評価スコアの平均値が正確に計算されている
    const expected_average_score = (task_a_score + task_b_score + task_c_score) / required_tasks_count;
    expect(result.average_score).toBe(60);
    expect(result.average_score).toEqual(expected_average_score);

    // 丸め誤差が発生していないことを数学的に検証
    expect(result.average_score * required_tasks_count).toBe(task_a_score + task_b_score + task_c_score);

    // 判定結果がシステムログに記録されている
    expect(result.evaluation_timestamp).toBeDefined();
    expect(result.evaluation_timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/);

    // 判定プロセスのトレースログが残されている
    expect(result.judgment_log).toBeDefined();
    expect(Array.isArray(result.judgment_log)).toBe(true);
    expect(result.judgment_log.length).toBeGreaterThan(0);

    // トレースログに境界値判定の記録があることを確認
    const boundary_check_log = result.judgment_log.find(
      (log: { event_type: string }) => log.event_type === 'boundary_check'
    );
    expect(boundary_check_log).toBeDefined();
    expect(boundary_check_log.threshold_value).toBe(60);
    expect(boundary_check_log.all_tasks_at_threshold).toBe(true);
  });
});