import { createReportFeedback } from '../../src/logic/it-1-br-1781935279444-1-2-1';

describe('月次サマリーテンプレートの定義・管理機能', () => {
  test('SCEN-1312: レポートフィードバック内容が空の場合、バリデーションエラーが発生し記録が拒否される', () => {
    const input = {
      reporter_id: 'user_001',
      report_id: 'report_2024_01_001',
      feedback_category: 'accuracy',
      feedback_content: '',
      submitted_at: '2024-01-15T10:30:00Z',
    };

    expect(() => createReportFeedback(input)).toThrow(/フィードバック内容/);
  });
});