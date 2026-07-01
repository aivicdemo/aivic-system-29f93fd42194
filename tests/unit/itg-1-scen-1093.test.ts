import { evaluateNewStaffCompetency } from '../../src/logic/it-1-2-1';

describe('営業成果データから請求対象項目を自動抽出し、顧客ごと・サービスごとの請求額を集計する機能', () => {
  // SCEN-1093: [edge] 新入スタッフ到達度評価判定 - 1業務でも評価対象外の場合、判定保留となること
  test('1業務でも評価対象外が存在する場合、到達度評価判定が判定保留状態となること', () => {
    // 手順: 新入スタッフ到達度評価判定機能にアクセスする
    // → 評価対象となる複数の業務を設定する（例：5業務）
    // → そのうち1業務を評価対象外として明示的にマーク、または評価データを欠落させる
    // → 残りの4業務については正常な評価データを入力する
    // → 到達度評価の判定処理を実行する
    // → 判定結果の状態を確認する

    const evaluationTasks = [
      {
        task_id: 'task_001',
        task_name: '請求書作成業務',
        is_evaluated: true,
        score: 90,
        pass_threshold: 80,
      },
      {
        task_id: 'task_002',
        task_name: '営業報告書集計業務',
        is_evaluated: true,
        score: 85,
        pass_threshold: 80,
      },
      {
        task_id: 'task_003',
        task_name: '契約書管理業務',
        is_evaluated: false, // 評価対象外として明示的にマーク
        score: null,
        pass_threshold: 80,
      },
      {
        task_id: 'task_004',
        task_name: '営業データ品質チェック業務',
        is_evaluated: true,
        score: 88,
        pass_threshold: 80,
      },
      {
        task_id: 'task_005',
        task_name: '顧客成果指標集計業務',
        is_evaluated: true,
        score: 92,
        pass_threshold: 80,
      },
    ];

    const staffId = 'staff_new_001';
    const evaluationPeriod = {
      start_date: '2024-01-01',
      end_date: '2024-01-31',
    };

    const result = evaluateNewStaffCompetency({
      staff_id: staffId,
      evaluation_tasks: evaluationTasks,
      evaluation_period: evaluationPeriod,
    });

    // 期待結果: 1業務でも評価対象外が存在する場合、最終的な到達度評価判定が「判定保留」状態となり、確定判定に至らないこと
    expect(result.judgment_status).toBe('pending');
    expect(result.is_finalized).toBe(false);
    expect(result.unevaluated_tasks).toContain('task_003');
    expect(result.unevaluated_count).toBe(1);
    expect(result.evaluated_count).toBe(4);
    expect(result.total_tasks).toBe(5);
    expect(result.can_proceed_to_production).toBe(false);
    expect(result.reason_for_pending).toMatch(/評価対象外/);
  });
});