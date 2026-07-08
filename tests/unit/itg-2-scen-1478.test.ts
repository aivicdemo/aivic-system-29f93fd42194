import { calculateDataUpdatePriority } from '../../src/logic/it-6-2-1-1';

describe('データ追加更新優先度算出 - 負の値エラーハンドリング', () => {
  // SCEN-1478
  test('効果度スコアと実装難度スコアが負の値の場合、エラーを返す', () => {
    const effectivenessScore = -1;
    const implementationDifficultyScore = -5;

    expect(() =>
      calculateDataUpdatePriority({
        effectivenessScore,
        implementationDifficultyScore,
      })
    ).toThrow(/負の値/);
  });
});