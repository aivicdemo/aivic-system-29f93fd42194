import { calculateDataUpdatePriority } from '../../src/logic/it-6-2-1-1';

describe('査定担当者別・工種別・金額帯別の判定精度指標の自動集計と可視化', () => {
  // SCEN-1479: [edge] データ追加更新優先度算出 - 効果度スコア100、実装難度スコア0で最高優先度が算出される
  test('効果度スコア100かつ実装難度スコア0の入力条件において、優先度算出結果が最高優先度として算出されること', () => {
    // 入力データの準備
    const input_effective_degree_score = 100;
    const input_implementation_difficulty_score = 0;

    // 優先度算出関数に上記データを入力して実行
    const result_priority_score = calculateDataUpdatePriority({
      effective_degree_score: input_effective_degree_score,
      implementation_difficulty_score: input_implementation_difficulty_score,
    });

    // 優先度スコアが最高優先度（満点=100）であることを確認
    expect(result_priority_score.priority_score).toBe(100);
    expect(result_priority_score.priority_rank).toBe('HIGH');
  });
});