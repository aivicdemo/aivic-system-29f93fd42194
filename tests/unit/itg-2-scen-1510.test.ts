import { notifyAssessorsOfImprovedModel } from '../../src/logic/it-6-2-2-1';

describe('査定員別・案件別の判定ロジック・乖離パターン履歴の記録・抽出機能', () => {
  test('SCEN-1510: [error] 改善モデル運用開始通知 - 対象査定員が0人の場合、通知送信処理をスキップしエラー返却', () => {
    // Arrange: 対象査定員が0人の状態で改善モデル運用開始通知を初期化
    const input = {
      assessor_ids: [],
      model_version: 'v2.1',
      improved_metrics: {
        ocr_accuracy: 0.92,
        ai_judgment_accuracy: 0.88,
      },
      implementation_date: '2024-02-15T09:00:00Z',
      notification_scope: 'all_assessors',
    };

    // Act & Assert: 通知送信処理がスキップされ、エラーレスポンスが返却される
    expect(() => notifyAssessorsOfImprovedModel(input)).toThrow(/査定員/);
  });
});