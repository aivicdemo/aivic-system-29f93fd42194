import { calculateDeviationMetrics } from '../../src/logic/it-6-3-1';

describe('査定判定ロジックの適用履歴と根拠の記録・検索機能', () => {
  // SCEN-828: [normal] 自動判定結果の相場乖離可視化 - 見積項目ごとの乖離率・乖離額が正常に計算・表示される
  test('should calculate and display deviation rate and amount for all estimate items correctly', () => {
    const estimateItems = [
      {
        itemId: 'item_001',
        itemName: '鉄筋工事',
        quantity: 100,
        unitPrice: 1500,
        estimatedAmount: 150000,
      },
      {
        itemId: 'item_002',
        itemName: 'コンクリート工事',
        quantity: 50,
        unitPrice: 8000,
        estimatedAmount: 400000,
      },
      {
        itemId: 'item_003',
        itemName: '型枠工事',
        quantity: 200,
        unitPrice: 2500,
        estimatedAmount: 500000,
      },
    ];

    const marketRates = [
      {
        itemId: 'item_001',
        standardAmount: 145000,
      },
      {
        itemId: 'item_002',
        standardAmount: 380000,
      },
      {
        itemId: 'item_003',
        standardAmount: 480000,
      },
    ];

    const result = calculateDeviationMetrics(estimateItems, marketRates);

    // item_001: (150000 - 145000) / 145000 * 100 = 3.45%
    expect(result[0].deviationRate).toBeCloseTo(3.448275862, 5);
    expect(result[0].deviationAmount).toBe(5000);
    expect(result[0].itemId).toBe('item_001');

    // item_002: (400000 - 380000) / 380000 * 100 = 5.26%
    expect(result[1].deviationRate).toBeCloseTo(5.263157895, 5);
    expect(result[1].deviationAmount).toBe(20000);
    expect(result[1].itemId).toBe('item_002');

    // item_003: (500000 - 480000) / 480000 * 100 = 4.17%
    expect(result[2].deviationRate).toBeCloseTo(4.166666667, 5);
    expect(result[2].deviationAmount).toBe(20000);
    expect(result[2].itemId).toBe('item_003');

    expect(result).toHaveLength(3);
    expect(result[0]).toHaveProperty('deviationRate');
    expect(result[0]).toHaveProperty('deviationAmount');
    expect(result[0]).toHaveProperty('itemId');
  });

  test('should calculate negative deviation when estimate is lower than market rate', () => {
    const estimateItems = [
      {
        itemId: 'item_004',
        itemName: '溶接工事',
        quantity: 80,
        unitPrice: 3000,
        estimatedAmount: 240000,
      },
    ];

    const marketRates = [
      {
        itemId: 'item_004',
        standardAmount: 250000,
      },
    ];

    const result = calculateDeviationMetrics(estimateItems, marketRates);

    // (240000 - 250000) / 250000 * 100 = -4.00%
    expect(result[0].deviationRate).toBe(-4.0);
    expect(result[0].deviationAmount).toBe(-10000);
  });

  test('should throw error when market rate not found for estimate item', () => {
    const estimateItems = [
      {
        itemId: 'item_005',
        itemName: '塗装工事',
        quantity: 60,
        unitPrice: 2000,
        estimatedAmount: 120000,
      },
    ];

    const marketRates = [
      {
        itemId: 'item_999',
        standardAmount: 115000,
      },
    ];

    expect(() => calculateDeviationMetrics(estimateItems, marketRates)).toThrow(/相場/);
  });

  test('should throw error when market rate is zero or negative', () => {
    const estimateItems = [
      {
        itemId: 'item_006',
        itemName: '足場工事',
        quantity: 40,
        unitPrice: 4000,
        estimatedAmount: 160000,
      },
    ];

    const marketRates = [
      {
        itemId: 'item_006',
        standardAmount: 0,
      },
    ];

    expect(() => calculateDeviationMetrics(estimateItems, marketRates)).toThrow(/ゼロ除算/);
  });

  test('should handle large numbers and maintain precision in deviation calculation', () => {
    const estimateItems = [
      {
        itemId: 'item_007',
        itemName: '大規模鉄骨工事',
        quantity: 500,
        unitPrice: 50000,
        estimatedAmount: 25000000,
      },
    ];

    const marketRates = [
      {
        itemId: 'item_007',
        standardAmount: 24500000,
      },
    ];

    const result = calculateDeviationMetrics(estimateItems, marketRates);

    // (25000000 - 24500000) / 24500000 * 100 = 2.041%
    expect(result[0].deviationRate).toBeCloseTo(2.040816327, 5);
    expect(result[0].deviationAmount).toBe(500000);
  });

  test('should handle decimal precision in estimate amounts', () => {
    const estimateItems = [
      {
        itemId: 'item_008',
        itemName: '精密工事',
        quantity: 150,
        unitPrice: 3333.33,
        estimatedAmount: 499999.5,
      },
    ];

    const marketRates = [
      {
        itemId: 'item_008',
        standardAmount: 500000,
      },
    ];

    const result = calculateDeviationMetrics(estimateItems, marketRates);

    // (499999.5 - 500000) / 500000 * 100 = -0.0001%
    expect(result[0].deviationRate).toBeCloseTo(-0.0001, 3);
    expect(result[0].deviationAmount).toBeCloseTo(-0.5, 1);
  });

  test('should return array with correct order matching input estimate items', () => {
    const estimateItems = [
      {
        itemId: 'item_a',
        itemName: '項目A',
        quantity: 10,
        unitPrice: 1000,
        estimatedAmount: 10000,
      },
      {
        itemId: 'item_b',
        itemName: '項目B',
        quantity: 20,
        unitPrice: 2000,
        estimatedAmount: 40000,
      },
      {
        itemId: 'item_c',
        itemName: '項目C',
        quantity: 30,
        unitPrice: 3000,
        estimatedAmount: 90000,
      },
    ];

    const marketRates = [
      { itemId: 'item_a', standardAmount: 9500 },
      { itemId: 'item_b', standardAmount: 38000 },
      { itemId: 'item_c', standardAmount: 92000 },
    ];

    const result = calculateDeviationMetrics(estimateItems, marketRates);

    expect(result[0].itemId).toBe('item_a');
    expect(result[1].itemId).toBe('item_b');
    expect(result[2].itemId).toBe('item_c');
  });
});