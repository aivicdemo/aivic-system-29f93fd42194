import { describe, test, expect } from '@jest/globals';
import { calculateKpiDeviationAnalysis } from '../../src/logic/it-1780551301636-1-2-1';

describe('生産実績データの異常値を自動検出し原因調査に必要な関連データを抽出する機能', () => {
  test('正常な月次生産実績・在庫実績データでKPI計算と目標値との乖離判定が実行される', () => {
    // SCEN-489
    const productionData = [
      { status: 'completed', completedDate: '2024-01-15', dueDate: '2024-01-16' },
      { status: 'completed', completedDate: '2024-01-16', dueDate: '2024-01-16' },
      { status: 'completed', completedDate: '2024-01-17', dueDate: '2024-01-18' },
      { status: 'completed', completedDate: '2024-01-18', dueDate: '2024-01-17' },
      { status: 'completed', completedDate: '2024-01-19', dueDate: '2024-01-19' },
      { status: 'in_progress' },
      { status: 'in_progress' },
      { status: 'pending' }
    ];

    const inventoryData = [
      { outboundAmount: 1000, stockValue: 5000 },
      { outboundAmount: 1500, stockValue: 4500 },
      { outboundAmount: 800, stockValue: 5200 },
      { outboundAmount: 1200, stockValue: 4800 }
    ];

    const targetKpis = {
      targetProductionEfficiency: 70,
      targetDeliveryRate: 80,
      targetInventoryTurnover: 1.0
    };

    const result = calculateKpiDeviationAnalysis(productionData, inventoryData, targetKpis);

    // 生産効率の計算検証: 完了5件/全8件 = 62.5%
    expect(result.productionEfficiency).toBe(62.5);
    
    // 納期達成率の計算検証: 納期内完了4件/完了5件 = 80%
    expect(result.deliveryAchievementRate).toBe(80);
    
    // 在庫回転率の計算検証: 総出庫4500/平均在庫4875 ≈ 0.923
    expect(result.inventoryTurnoverRate).toBeCloseTo(0.923, 3);
    
    // 生産効率の乖離検証: |62.5-70|/70*100 = 10.71%、10%以上なので改善要
    expect(result.deviations[0]).toEqual({
      kpi: "生産効率",
      actual: 62.5,
      target: 70,
      deviation: expect.closeTo(10.71, 1)
    });
    
    // 納期達成率の乖離検証: |80-80|/80*100 = 0%、10%未満なので改善不要
    expect(result.deviations[1]).toEqual({
      kpi: "納期達成率", 
      actual: 80,
      target: 80,
      deviation: 0
    });
    
    // 在庫回転率の乖離検証: |0.923-1.0|/1.0*100 = 7.7%、10%未満なので改善不要
    expect(result.deviations[2]).toEqual({
      kpi: "在庫回転率",
      actual: expect.closeTo(0.923, 3),
      target: 1.0, 
      deviation: expect.closeTo(7.7, 1)
    });
    
    // 改善が必要なKPI項目の検証: 生産効率のみ10%以上乖離
    expect(result.improvementRequired).toEqual(["生産効率"]);
  });
});