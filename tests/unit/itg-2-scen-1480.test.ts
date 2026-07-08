import { calculateDataUpdatePriority } from '../../src/logic/it-6-2-1-1';

describe('データ追加更新優先度の自動算出', () => {
  // SCEN-1480: [edge] データ追加更新優先度算出 - 効果度スコア0、実装難度スコア100で最低優先度が算出される
  test('効果度スコア0と実装難度スコア100の組み合わせで最低優先度が算出される', () => {
    const effect_score = 0;
    const implementation_difficulty_score = 100;

    const priority_score = calculateDataUpdatePriority({
      effect_score,
      implementation_difficulty_score,
    });

    expect(priority_score).toBe(0);
  });
});