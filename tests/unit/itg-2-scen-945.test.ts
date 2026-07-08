import { classifyBusyLevelByMonth } from '../../src/logic/it-6-2-1-1';

describe('月次繁忙度レベル自動分類機能', () => {
  // SCEN-945
  test('蓄積データが12ヶ月未満の場合、エラーが返される', () => {
    const monthlyCounts = [
      { month: '2024-01', count: 45 },
      { month: '2024-02', count: 52 },
      { month: '2024-03', count: 48 },
      { month: '2024-04', count: 61 },
      { month: '2024-05', count: 55 },
      { month: '2024-06', count: 49 },
      { month: '2024-07', count: 67 },
      { month: '2024-08', count: 72 },
      { month: '2024-09', count: 58 },
      { month: '2024-10', count: 63 },
      { month: '2024-11', count: 51 },
    ];

    expect(() =>
      classifyBusyLevelByMonth(monthlyCounts)
    ).toThrow(/蓄積データが12ヶ月未満/);
  });
});