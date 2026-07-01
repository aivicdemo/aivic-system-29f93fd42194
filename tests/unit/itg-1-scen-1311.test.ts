import { recordReportFeedback, classifyReportFeedback, addToImprovementList, retrieveImprovementList, retrieveFeedbackHistory } from '../../src/logic/it-1-br-1781935279444-1-2-1';

describe('月次サマリーテンプレートの定義・管理機能 - レポートフィードバック管理', () => {
  test('SCEN-1311: [normal] レポートフィードバック管理 - 顧客からのレポートフィードバックが正常に記録・分類され、次月改善対象リストに追加される', () => {
    // ===== Setup: テスト用の固定データ準備 =====
    const feedback_id = 'FB-2024-001';
    const customer_id = 'CUST-2024-0001';
    const feedback_content = '請求書の項目名が不明確';
    const recorded_timestamp = new Date('2024-01-15T09:30:00Z');
    const classified_category = '請求書形式';
    const classified_timestamp = new Date('2024-01-15T09:31:00Z');
    const improvement_list_month = '2024-02';
    const feedback_history_query_period = '2024-01';

    // ===== Step 1: フィードバック内容をシステムに記録 =====
    const recorded_feedback = recordReportFeedback({
      feedback_id,
      customer_id,
      content: feedback_content,
      recorded_at: recorded_timestamp,
    });

    expect(recorded_feedback).toEqual({
      feedback_id,
      customer_id,
      content: feedback_content,
      recorded_at: recorded_timestamp,
      status: 'recorded',
    });

    // ===== Step 2: フィードバックを自動分類 =====
    const classified_feedback = classifyReportFeedback({
      feedback_id,
      content: feedback_content,
      classified_at: classified_timestamp,
    });

    expect(classified_feedback).toEqual({
      feedback_id,
      category: classified_category,
      classified_at: classified_timestamp,
      is_classified: true,
    });

    // ===== Step 3: 分類済みフィードバックを改善対象リストに追加 =====
    const added_to_improvement = addToImprovementList({
      feedback_id,
      category: classified_category,
      customer_id,
      content: feedback_content,
      target_month: improvement_list_month,
      added_at: new Date('2024-01-15T09:32:00Z'),
    });

    expect(added_to_improvement).toEqual({
      improvement_item_id: expect.stringMatching(/^IMP-/),
      feedback_id,
      category: classified_category,
      customer_id,
      target_month: improvement_list_month,
      is_added: true,
    });

    // ===== Step 4: 次月の改善対象リストを取得し、フィードバックが含まれることを確認 =====
    const improvement_list = retrieveImprovementList({
      target_month: improvement_list_month,
    });

    const feedback_in_list = improvement_list.items.find(
      (item) => item.feedback_id === feedback_id
    );

    expect(feedback_in_list).toBeDefined();
    expect(feedback_in_list).toEqual({
      improvement_item_id: expect.stringMatching(/^IMP-/),
      feedback_id,
      category: classified_category,
      customer_id,
      content: feedback_content,
      target_month: improvement_list_month,
      is_prioritized: false,
    });

    // ===== Step 5: フィードバック履歴から記録内容と分類結果を検証 =====
    const feedback_history = retrieveFeedbackHistory({
      query_period: feedback_history_query_period,
    });

    const history_entry = feedback_history.records.find(
      (record) => record.feedback_id === feedback_id
    );

    expect(history_entry).toBeDefined();
    expect(history_entry).toEqual({
      feedback_id,
      customer_id,
      content: feedback_content,
      recorded_at: recorded_timestamp,
      category: classified_category,
      classified_at: classified_timestamp,
      added_to_improvement: true,
      improvement_target_month: improvement_list_month,
      is_tracked: true,
    });

    // ===== 統合検証: フィードバック全体のライフサイクルが正常に完了していることを確認 =====
    expect(recorded_feedback.status).toBe('recorded');
    expect(classified_feedback.is_classified).toBe(true);
    expect(added_to_improvement.is_added).toBe(true);
    expect(feedback_in_list).toBeDefined();
    expect(history_entry.is_tracked).toBe(true);
  });
});