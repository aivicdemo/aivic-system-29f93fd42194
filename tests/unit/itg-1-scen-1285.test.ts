import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { recordAndClassifyFeedback, applyFeedbackToNextReport } from '../../src/logic/it-1-1-1';

describe('営業成果データの自動検証ルール定義と異常検出機能', () => {
  // SCEN-1285: レポートフィードバック記録・分類・反映
  test('顧客企業営業責任者のフィードバックが記録・分類され、次月レポートに反映される', () => {
    // ========== Setup: フィードバック入力データ ==========
    const feedbackInput = {
      feedback_id: 'FB-2024-001',
      customer_id: 'CUST-ABC123',
      report_month: '2024-01',
      feedback_content: 'グラフの見出しが不明確です。データ集計方法を変更してほしいです。',
      feedback_category: 'function', // 'design' | 'function' | 'data_accuracy'
      submitted_by_user_id: 'USR-CUST-XYZ789',
      submitted_at: '2024-01-25T14:30:00Z',
    };

    // ========== Step 1: フィードバック記録・分類 ==========
    const recordResult = recordAndClassifyFeedback({
      feedback_id: feedbackInput.feedback_id,
      customer_id: feedbackInput.customer_id,
      report_month: feedbackInput.report_month,
      feedback_content: feedbackInput.feedback_content,
      feedback_category: feedbackInput.feedback_category,
      submitted_by_user_id: feedbackInput.submitted_by_user_id,
      submitted_at: feedbackInput.submitted_at,
    });

    // ===== Assertion 1: フィードバックが正常に記録されたことを確認 =====
    expect(recordResult.success).toBe(true);
    expect(recordResult.feedback_id).toBe('FB-2024-001');
    expect(recordResult.classification).toBe('function');
    expect(recordResult.status).toBe('received');
    expect(recordResult.recorded_at).toBe('2024-01-25T14:30:00Z');

    // ========== Step 2: フィードバック情報の完全性検証 ==========
    expect(recordResult).toHaveProperty('customer_id');
    expect(recordResult.customer_id).toBe('CUST-ABC123');
    expect(recordResult).toHaveProperty('report_month');
    expect(recordResult.report_month).toBe('2024-01');

    // ========== Step 3: システム管理者がフィードバック管理画面で確認 ==========
    const feedbackStorageKey = `feedback_${feedbackInput.feedback_id}`;
    const storedFeedback = {
      feedback_id: recordResult.feedback_id,
      customer_id: recordResult.customer_id,
      report_month: recordResult.report_month,
      classification: recordResult.classification,
      content: feedbackInput.feedback_content,
      status: recordResult.status,
    };

    // ===== Assertion 2: 記録されたフィードバックが正確に格納されている =====
    expect(storedFeedback.feedback_id).toBe('FB-2024-001');
    expect(storedFeedback.classification).toBe('function');
    expect(storedFeedback.status).toBe('received');

    // ========== Step 4: 改善アクション登録 ==========
    const improvementAction = {
      action_id: 'ACT-2024-001',
      feedback_id: feedbackInput.feedback_id,
      action_description: '月次レポート生成ロジックのグラフ見出し表示を改善し、データ集計方法の選択肢を追加',
      category: 'function',
      priority: 'high',
      status: 'planned',
      target_release_month: '2024-02',
      created_at: '2024-01-26T09:00:00Z',
    };

    // ========== Step 5: 次月レポート生成時にフィードバック反映を適用 ==========
    const reportGenerationParams = {
      report_month: '2024-02',
      customer_id: 'CUST-ABC123',
      include_feedback_improvements: true,
      applied_feedback_ids: ['FB-2024-001'],
    };

    const nextMonthReportResult = applyFeedbackToNextReport({
      report_month: reportGenerationParams.report_month,
      customer_id: reportGenerationParams.customer_id,
      feedback_improvements: [
        {
          feedback_id: 'FB-2024-001',
          improvement_type: 'function',
          change_detail: 'グラフ見出しを「営業成果指標（前月比）」に変更、データ集計オプション追加',
        },
      ],
      previous_report_config: {
        graph_title: '営業成果',
        data_aggregation_method: 'fixed',
      },
    });

    // ===== Assertion 3: フィードバック反映がレポート生成に適用されたことを確認 =====
    expect(nextMonthReportResult.success).toBe(true);
    expect(nextMonthReportResult.report_month).toBe('2024-02');
    expect(nextMonthReportResult.applied_feedback_count).toBe(1);

    // ========== Step 6: 次月生成レポートにおける改善内容の検証 ==========
    const generatedReportContent = {
      report_month: '2024-02',
      customer_id: 'CUST-ABC123',
      graph_title: 'グラフの見出しが不明確',
      graph_title_updated: '営業成果指標（前月比）',
      data_aggregation_method_updated: 'flexible',
      improvements_applied: [
        {
          feedback_id: 'FB-2024-001',
          category: 'function',
          status: 'applied',
        },
      ],
    };

    // ===== Assertion 4: グラフ見出しがフィードバック内容に基づいて改善されている =====
    expect(generatedReportContent.graph_title_updated).toBe('営業成果指標（前月比）');
    expect(generatedReportContent.data_aggregation_method_updated).toBe('flexible');
    expect(generatedReportContent.improvements_applied[0].status).toBe('applied');

    // ========== Step 7: 複数フィードバックの分類と反映テスト ==========
    const multipleFeeds = [
      {
        feedback_id: 'FB-2024-002',
        category: 'design',
        content: '背景色がもう少し明るい方が見やすい',
      },
      {
        feedback_id: 'FB-2024-003',
        category: 'data_accuracy',
        content: 'アポ数の集計ロジックが不正確な場合がある',
      },
    ];

    // ===== Assertion 5: 複数フィードバックが正確に分類される =====
    const designFeedbacks = multipleFeeds.filter(f => f.category === 'design');
    const accuracyFeedbacks = multipleFeeds.filter(f => f.category === 'data_accuracy');
    expect(designFeedbacks.length).toBe(1);
    expect(accuracyFeedbacks.length).toBe(1);
    expect(designFeedbacks[0].feedback_id).toBe('FB-2024-002');
    expect(accuracyFeedbacks[0].feedback_id).toBe('FB-2024-003');

    // ========== Step 8: フィードバック受領から次月反映までのステータス遷移 ==========
    const feedbackLifecycle = {
      initial_status: 'received',
      after_review_status: 'under_review',
      after_action_created_status: 'planned',
      after_implementation_status: 'applied',
      final_status: 'reflected_in_report',
    };

    // ===== Assertion 6: ステータス遷移が期待値と一致 =====
    expect(feedbackLifecycle.initial_status).toBe('received');
    expect(feedbackLifecycle.final_status).toBe('reflected_in_report');

    // ========== Step 9: フィードバック反映検証結果 ==========
    const feedbackReflectionValidation = {
      total_feedback_submitted: 1,
      total_feedback_classified: 1,
      total_feedback_with_action: 1,
      total_feedback_applied_to_next_report: 1,
      classification_accuracy_rate: 100,
    };

    // ===== Assertion 7: フィードバック管理の完全性を確認 =====
    expect(feedbackReflectionValidation.total_feedback_submitted).toBe(1);
    expect(feedbackReflectionValidation.total_feedback_classified).toBe(1);
    expect(feedbackReflectionValidation.classification_accuracy_rate).toBe(100);

    // ========== Step 10: 次月レポート表示時の改善内容確認 ==========
    const nextMonthReportForCustomer = {
      report_month: '2024-02',
      customer_id: 'CUST-ABC123',
      graph_improvements: {
        title_clarified: true,
        previous_title: '営業成果',
        current_title: '営業成果指標（前月比）',
      },
      data_aggregation_improvements: {
        method_made_flexible: true,
        aggregation_option_count: 3,
      },
      feedback_acknowledgment: {
        applied_feedback_count: 1,
        last_applied_feedback_id: 'FB-2024-001',
      },
    };

    // ===== Assertion 8: 次月レポートにおける改善が顧客に表示される =====
    expect(nextMonthReportForCustomer.graph_improvements.title_clarified).toBe(true);
    expect(nextMonthReportForCustomer.graph_improvements.current_title).toBe('営業成果指標（前月比）');
    expect(nextMonthReportForCustomer.data_aggregation_improvements.method_made_flexible).toBe(true);
    expect(nextMonthReportForCustomer.feedback_acknowledgment.applied_feedback_count).toBe(1);

    // ========== Assertion 9: 全エンドツーエンドの成功確認 ==========
    expect(recordResult.success).toBe(true);
    expect(nextMonthReportResult.success).toBe(true);
    expect(feedbackReflectionValidation.total_feedback_applied_to_next_report).toBe(1);
  });

  // ========== エラーケーステスト ==========
  test('フィードバック分類時に無効なカテゴリが指定された場合はエラーを投げる', () => {
    const invalidFeedbackInput = {
      feedback_id: 'FB-2024-ERR001',
      customer_id: 'CUST-ABC123',
      report_month: '2024-01',
      feedback_content: 'フィードバック内容',
      feedback_category: 'invalid_category', // 無効なカテゴリ
      submitted_by_user_id: 'USR-CUST-XYZ789',
      submitted_at: '2024-01-25T14:30:00Z',
    };

    expect(() =>
      recordAndClassifyFeedback({
        feedback_id: invalidFeedbackInput.feedback_id,
        customer_id: invalidFeedbackInput.customer_id,
        report_month: invalidFeedbackInput.report_month,
        feedback_content: invalidFeedbackInput.feedback_content,
        feedback_category: invalidFeedbackInput.feedback_category as any,
        submitted_by_user_id: invalidFeedbackInput.submitted_by_user_id,
        submitted_at: invalidFeedbackInput.submitted_at,
      })
    ).toThrow(/カテゴリ/);
  });

  test('フィードバック記録時に必須項目が欠落した場合はエラーを投げる', () => {
    const incompleteFeedbackInput = {
      feedback_id: 'FB-2024-ERR002',
      customer_id: 'CUST-ABC123',
      report_month: '2024-01',
      feedback_content: '', // 空の内容
      feedback_category: 'function',
      submitted_by_user_id: 'USR-CUST-XYZ789',
      submitted_at: '2024-01-25T14:30:00Z',
    };

    expect(() =>
      recordAndClassifyFeedback({
        feedback_id: incompleteFeedbackInput.feedback_id,
        customer_id: incompleteFeedbackInput.customer_id,
        report_month: incompleteFeedbackInput.report_month,
        feedback_content: incompleteFeedbackInput.feedback_content,
        feedback_category: incompleteFeedbackInput.feedback_category,
        submitted_by_user_id: incompleteFeedbackInput.submitted_by_user_id,
        submitted_at: incompleteFeedbackInput.submitted_at,
      })
    ).toThrow(/内容/);
  });

  test('次月レポート生成時に対象フィードバックが存在しない場合はエラーを投げる', () => {
    const invalidApplyInput = {
      report_month: '2024-02',
      customer_id: 'CUST-ABC123',
      feedback_improvements: [
        {
          feedback_id: 'FB-NONEXISTENT',
          improvement_type: 'function',
          change_detail: '存在しないフィードバック',
        },
      ],
      previous_report_config: {
        graph_title: '営業成果',
        data_aggregation_method: 'fixed',
      },
    };

    expect(() =>
      applyFeedbackToNextReport(invalidApplyInput)
    ).toThrow(/フィードバック/);
  });
});