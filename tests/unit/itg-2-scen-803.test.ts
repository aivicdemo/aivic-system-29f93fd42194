import { calculateMarketDeviation } from '../../src/logic/it-6-3-1';

describe('見積項目相場乖離自動算出機能', () => {
  // SCEN-803: [normal] 見積項目相場乖離自動算出機能 - 見積項目ごとの相場乖離率・乖離額が正確に計算される
  test('複数見積項目の相場乖離率と乖離額が正確に計算される', () => {
    const estimate_items = [
      {
        item_id: 'ITEM001',
        item_name: '型枠工事',
        market_price: 10000,
        estimate_amount: 11000,
      },
      {
        item_id: 'ITEM002',
        item_name: 'コンクリート打設',
        market_price: 50000,
        estimate_amount: 48000,
      },
      {
        item_id: 'ITEM003',
        item_name: '鉄筋工事',
        market_price: 25000,
        estimate_amount: 25000,
      },
      {
        item_id: 'ITEM004',
        item_name: '足場工事',
        market_price: 8000,
        estimate_amount: 9200,
      },
    ];

    const result = calculateMarketDeviation(estimate_items);

    expect(result).toEqual({
      items: [
        {
          item_id: 'ITEM001',
          item_name: '型枠工事',
          market_price: 10000,
          estimate_amount: 11000,
          deviation_rate: 10.0,
          deviation_amount: 1000,
        },
        {
          item_id: 'ITEM002',
          item_name: 'コンクリート打設',
          market_price: 50000,
          estimate_amount: 48000,
          deviation_rate: -4.0,
          deviation_amount: -2000,
        },
        {
          item_id: 'ITEM003',
          item_name: '鉄筋工事',
          market_price: 25000,
          estimate_amount: 25000,
          deviation_rate: 0.0,
          deviation_amount: 0,
        },
        {
          item_id: 'ITEM004',
          item_name: '足場工事',
          market_price: 8000,
          estimate_amount: 9200,
          deviation_rate: 15.0,
          deviation_amount: 1200,
        },
      ],
      summary: {
        total_items: 4,
        total_deviation_amount: 200,
        average_deviation_rate: 5.25,
        max_positive_deviation_rate: 15.0,
        max_negative_deviation_rate: -4.0,
      },
    });

    expect(result.items[0].deviation_rate).toBe(10.0);
    expect(result.items[0].deviation_amount).toBe(1000);

    expect(result.items[1].deviation_rate).toBe(-4.0);
    expect(result.items[1].deviation_amount).toBe(-2000);

    expect(result.items[2].deviation_rate).toBe(0.0);
    expect(result.items[2].deviation_amount).toBe(0);

    expect(result.items[3].deviation_rate).toBe(15.0);
    expect(result.items[3].deviation_amount).toBe(1200);

    expect(result.summary.total_items).toBe(4);
    expect(result.summary.total_deviation_amount).toBe(200);
    expect(result.summary.average_deviation_rate).toBe(5.25);
    expect(result.summary.max_positive_deviation_rate).toBe(15.0);
    expect(result.summary.max_negative_deviation_rate).toBe(-4.0);
  });
});