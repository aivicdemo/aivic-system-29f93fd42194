import { generateImprovementProposals } from '../../src/logic/it-1-br-1780551301636-2-2-1';

describe('製造ライン別の進捗状況を週次で自動集計し遅延リスクを判定してアラート通知する機能', () => {
  test('SCEN-497: [error] 改善提案リスト自動生成機能 - 前月比データが存在しない初回月でエラーが発生する', () => {
    // テストデータ: システム稼働開始月として現在の実績データのみ存在
    const productionEfficiency = 75;
    const qualityRate = 92;
    const inventoryTurnover = 5.2;
    const deliveryAchievementRate = 88;
    
    // 前月比データが存在しない状態（初回月）
    const previousMonthMetrics = {
      productionEfficiency: 0, // データなしを示す値
      qualityRate: 0,
      inventoryTurnover: 0,
      deliveryAchievementRate: 0
    };

    // エラーハンドリングが適切に動作することを確認
    expect(() => {
      generateImprovementProposals(
        productionEfficiency,
        qualityRate,
        inventoryTurnover,
        deliveryAchievementRate,
        previousMonthMetrics
      );
    }).toThrow(/前月データ/);
  });
});