import { detectFeedbackContradictions } from '../../src/logic/it-1-br-6-2-1';

describe('査定員別判定ばらつき率と相場乖離傾向の自動集計・分析', () => {
  test('SCEN-1162: 矛盾するフィードバック検出とエラー記録', () => {
    // 同一の改善項目IDに対して、「効果あり」と「効果なし」の矛盾するフィードバックを入力
    const feedbackList = [
      {
        improvement_item_id: 'IMP-001',
        improvement_name: '学習データ追加（北海道地域）',
        feedback_result: 'effective', // 効果あり
        feedback_timestamp: '2024-01-15T09:30:00Z',
        feedback_by_user_id: 'USR-101',
      },
      {
        improvement_item_id: 'IMP-001',
        improvement_name: '学習データ追加（北海道地域）',
        feedback_result: 'ineffective', // 効果なし（矛盾）
        feedback_timestamp: '2024-01-15T10:45:00Z',
        feedback_by_user_id: 'USR-102',
      },
    ];

    // 矛盾検出機能を実行
    expect(() => {
      detectFeedbackContradictions(feedbackList);
    }).toThrow(/矛盾/);
  });
});