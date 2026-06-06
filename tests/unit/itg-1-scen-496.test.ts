import { generateImprovementProposals } from '../../src/logic/it-1-br-1780551301636-2-2-1';

describe('製造ライン別の進捗状況を週次で自動集計し遅延リスクを判定してアラート通知する機能', () => {
  test('生産効率が基準値ちょうど70%の場合に改善提案が生成されない', () => {
    // SCEN-496

    const productionEfficiency = 70;
    const qualityRate = 95;
    const inventoryTurnover = 6;
    const deliveryAchievementRate = 90;
    const previousMonthMetrics = {
      productionEfficiency: 75,
      qualityRate: 96,
      inventoryTurnover: 6.5,
      deliveryAchievementRate: 92
    };

    const result = generateImprovementProposals(
      productionEfficiency,
      qualityRate,
      inventoryTurnover,
      deliveryAchievementRate,
      previousMonthMetrics
    );

    expect(result.proposals).toEqual([]);
  });
});