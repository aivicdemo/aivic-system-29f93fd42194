import { classifyMonthlyBusyLevel } from '../../src/logic/it-6-2-1-1';

describe('Monthly Busy Level Auto Classification', () => {
  // SCEN-943
  test('should automatically classify busy levels for 12 months of audit count data', () => {
    // Arrange: 過去12ヶ月の月別査定件数データを準備
    const monthly_audit_counts = [
      { month: 1, count: 100 },
      { month: 2, count: 150 },
      { month: 3, count: 120 },
      { month: 4, count: 140 },
      { month: 5, count: 110 },
      { month: 6, count: 160 },
      { month: 7, count: 180 },
      { month: 8, count: 170 },
      { month: 9, count: 130 },
      { month: 10, count: 145 },
      { month: 11, count: 155 },
      { month: 12, count: 180 }
    ];

    // Act: 月次繁忙度レベル自動分類機能を実行
    const classification_result = classifyMonthlyBusyLevel(monthly_audit_counts);

    // Assert: 全12ヶ月分のデータが処理されたことを確認
    expect(classification_result).toBeDefined();
    expect(classification_result.length).toBe(12);

    // 各月の繁忙度レベルが割り当てられていることを確認
    for (const item of classification_result) {
      expect(item).toHaveProperty('month');
      expect(item).toHaveProperty('count');
      expect(item).toHaveProperty('busy_level');
      expect(['low', 'medium', 'high']).toContain(item.busy_level);
    }

    // 月別の繁忙度レベル分類結果を検証（件数の多少で正しく分類されているか）
    // 低繁忙度: 100-120件、中繁忙度: 130-160件、高繁忙度: 170件以上
    expect(classification_result[0]).toEqual({
      month: 1,
      count: 100,
      busy_level: 'low'
    });
    expect(classification_result[1]).toEqual({
      month: 2,
      count: 150,
      busy_level: 'medium'
    });
    expect(classification_result[2]).toEqual({
      month: 3,
      count: 120,
      busy_level: 'low'
    });
    expect(classification_result[3]).toEqual({
      month: 4,
      count: 140,
      busy_level: 'medium'
    });
    expect(classification_result[4]).toEqual({
      month: 5,
      count: 110,
      busy_level: 'low'
    });
    expect(classification_result[5]).toEqual({
      month: 6,
      count: 160,
      busy_level: 'medium'
    });
    expect(classification_result[6]).toEqual({
      month: 7,
      count: 180,
      busy_level: 'high'
    });
    expect(classification_result[7]).toEqual({
      month: 8,
      count: 170,
      busy_level: 'high'
    });
    expect(classification_result[8]).toEqual({
      month: 9,
      count: 130,
      busy_level: 'medium'
    });
    expect(classification_result[9]).toEqual({
      month: 10,
      count: 145,
      busy_level: 'medium'
    });
    expect(classification_result[10]).toEqual({
      month: 11,
      count: 155,
      busy_level: 'medium'
    });
    expect(classification_result[11]).toEqual({
      month: 12,
      count: 180,
      busy_level: 'high'
    });

    // 分類結果がシステムに正しく保存・表示されることを確認
    expect(classification_result).toHaveLength(12);
    const high_busy_count = classification_result.filter(
      (item) => item.busy_level === 'high'
    ).length;
    const medium_busy_count = classification_result.filter(
      (item) => item.busy_level === 'medium'
    ).length;
    const low_busy_count = classification_result.filter(
      (item) => item.busy_level === 'low'
    ).length;

    expect(high_busy_count).toBe(3);
    expect(medium_busy_count).toBe(6);
    expect(low_busy_count).toBe(3);
  });
});