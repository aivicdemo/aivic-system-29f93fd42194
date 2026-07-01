import { evaluateStaffReadiness } from '../../src/logic/it-1-2-1';

describe('営業成果データから請求対象項目を自動抽出し、顧客ごと・サービスごとの請求額を集計する機能', () => {
  test('SCEN-1090: [normal] 新入スタッフ到達度評価判定 - 3業務すべてが合格基準を満たす場合、即戦力判定となること', () => {
    const taskA_score = 85;
    const taskB_score = 90;
    const taskC_score = 88;
    const passing_threshold = 80;

    const result = evaluateStaffReadiness({
      taskA_evaluationScore: taskA_score,
      taskB_evaluationScore: taskB_score,
      taskC_evaluationScore: taskC_score,
      passingThreshold: passing_threshold,
    });

    expect(result.status).toBe('readyToWork');
    expect(result.judgment).toBe('即戦力');
    expect(result.taskA_passed).toBe(true);
    expect(result.taskB_passed).toBe(true);
    expect(result.taskC_passed).toBe(true);
    expect(result.allTasksPassed).toBe(true);
  });
});