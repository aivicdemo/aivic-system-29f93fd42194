import { assignMonthlySchedule } from '../../src/logic/it-1-2-1';

describe('営業成果データから請求対象項目を自動抽出し、顧客ごと・サービスごとの請求額を集計する機能', () => {
  // SCEN-923: [normal] 月次業務スケジュール自動割り当て - 月初5日09:00に月次業務スケジュール実行時、各ステップに期限日時が正しく割り当てられる
  test('月初5日09:00にスケジュール割り当てが実行された場合、全ステップに適切な期限日時が割り当てられ、永続化される', () => {
    // 手順: テスト環境のシステム日時を月初5日09:00に設定する
    const executionDateTime = new Date('2024-01-05T09:00:00Z');

    // 月次業務スケジュール自動割り当て機能を実行する
    const result = assignMonthlySchedule({
      executionDateTime,
      fiscalMonthStart: new Date('2024-01-01T00:00:00Z'),
    });

    // 割り当てられたスケジュール情報を取得して検証
    // 期待値: 各ステップの期限日時が正確に計算される
    // - データ品質チェック: 1月5日09:00 + 1日 = 1月6日09:00
    // - 請求準備: 1月5日09:00 + 3日 = 1月8日09:00
    // - 請求実行: 1月5日09:00 + 5日 = 1月10日09:00
    // - レポート確認: 1月5日09:00 + 7日 = 1月12日09:00
    // - 配信完了: 1月5日09:00 + 10日 = 1月15日09:00

    expect(result.steps).toBeDefined();
    expect(result.steps).toHaveLength(5);

    // 各ステップの期限日時を確認
    const dataQualityCheckStep = result.steps.find(
      (s) => s.stepName === 'dataQualityCheck'
    );
    expect(dataQualityCheckStep).toBeDefined();
    expect(dataQualityCheckStep?.dueDatetime).toEqual(
      new Date('2024-01-06T09:00:00Z')
    );

    const billingPrepStep = result.steps.find((s) => s.stepName === 'billingPrep');
    expect(billingPrepStep).toBeDefined();
    expect(billingPrepStep?.dueDatetime).toEqual(
      new Date('2024-01-08T09:00:00Z')
    );

    const billingExecuteStep = result.steps.find(
      (s) => s.stepName === 'billingExecute'
    );
    expect(billingExecuteStep).toBeDefined();
    expect(billingExecuteStep?.dueDatetime).toEqual(
      new Date('2024-01-10T09:00:00Z')
    );

    const reportReviewStep = result.steps.find(
      (s) => s.stepName === 'reportReview'
    );
    expect(reportReviewStep).toBeDefined();
    expect(reportReviewStep?.dueDatetime).toEqual(
      new Date('2024-01-12T09:00:00Z')
    );

    const deliveryCompleteStep = result.steps.find(
      (s) => s.stepName === 'deliveryComplete'
    );
    expect(deliveryCompleteStep).toBeDefined();
    expect(deliveryCompleteStep?.dueDatetime).toEqual(
      new Date('2024-01-15T09:00:00Z')
    );

    // ステップ間に矛盾や重複がないことを確認
    const dueDatetimes = result.steps.map((s) => s.dueDatetime.getTime());
    const sortedDatetimes = [...dueDatetimes].sort((a, b) => a - b);
    expect(dueDatetimes).toEqual(sortedDatetimes);

    // すべてのステップにユニークなIDが割り当てられていることを確認
    const stepIds = result.steps.map((s) => s.stepId);
    const uniqueStepIds = new Set(stepIds);
    expect(uniqueStepIds.size).toBe(5);

    // スケジュール情報が永続化されていることを確認
    expect(result.scheduleId).toBeDefined();
    expect(result.scheduleId).toMatch(/^sched_/);
    expect(result.persistedAt).toBeDefined();
    expect(typeof result.persistedAt).toBe('string');
    expect(new Date(result.persistedAt).getTime()).toBeGreaterThan(0);

    // 全体的なスケジュール情報の整合性を確認
    expect(result.fiscalMonth).toBe('202401');
    expect(result.executionDateTime).toEqual(executionDateTime);
    expect(result.status).toBe('assigned');
  });
});