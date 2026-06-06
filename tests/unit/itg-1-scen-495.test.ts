import { generateImprovementProposals } from '../../src/logic/it-1-br-1780551301636-2-2-1';

describe("製造ライン別の進捗状況を週次で自動集計し遅延リスクを判定してアラート通知する機能", () => {
  test("納期達成率が基準値80%を下回った場合に優先順位付きの改善提案リストが生成される", () => {
    // SCEN-495
    const productionEfficiency = 85;
    const qualityRate = 92;
    const inventoryTurnover = 7;
    const deliveryAchievementRate = 75; // 80%を下回る
    const previousMonthMetrics = {
      productionEfficiency: 82,
      qualityRate: 94,
      inventoryTurnover: 6.5,
      deliveryAchievementRate: 85
    };

    const result = generateImprovementProposals(
      productionEfficiency,
      qualityRate,
      inventoryTurnover,
      deliveryAchievementRate,
      previousMonthMetrics
    );

    expect(result.proposals).toHaveLength(1);
    expect(result.proposals[0].category).toBe("納期管理");
    expect(result.proposals[0].priority).toBe(1);
    expect(result.proposals[0].description).toBe("標準提案（納期管理）");
    expect(result.proposals[0].expectedEffect).toBe("期待効果（納期管理）");
    expect(result.proposals[0].implementationPeriod).toBe("実施期間（納期管理）");
  });
});