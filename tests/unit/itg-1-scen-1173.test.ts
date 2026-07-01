import { describe, test, expect, beforeEach } from '@jest/globals';
import { aggregateInvoiceableItems } from '../../src/logic/it-1781935279444-1-1-1';

describe('営業データ項目のメタデータ管理機能 - 請求対象外項目フィルタリング', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // SCEN-1173
  test('請求対象外項目がフィルタされ、集計対象外となることが確認される', () => {
    // Arrange
    const sample_dataset = [
      {
        item_id: 'itm_001',
        item_name: 'アポイント数',
        unit: '件',
        data_type: 'INTEGER',
        amount: 50,
        is_invoiceable: true,
      },
      {
        item_id: 'itm_002',
        item_name: '成約数',
        unit: '件',
        data_type: 'INTEGER',
        amount: 30,
        is_invoiceable: true,
      },
      {
        item_id: 'itm_003',
        item_name: '顧客反応スコア',
        unit: 'ポイント',
        data_type: 'DECIMAL',
        amount: 150.5,
        is_invoiceable: false,
      },
      {
        item_id: 'itm_004',
        item_name: '追加サービス提供回数',
        unit: '回',
        data_type: 'INTEGER',
        amount: 20,
        is_invoiceable: false,
      },
      {
        item_id: 'itm_005',
        item_name: '基本サービス利用日数',
        unit: '日',
        data_type: 'INTEGER',
        amount: 100,
        is_invoiceable: true,
      },
    ];

    // Act
    const result = aggregateInvoiceableItems(sample_dataset);

    // Assert
    // 請求対象項目のみが集計対象に含まれていることを検証
    expect(result.filtered_items).toHaveLength(3);
    expect(result.filtered_items.map((item: any) => item.item_id)).toEqual([
      'itm_001',
      'itm_002',
      'itm_005',
    ]);

    // 請求対象外項目が除外されていることを検証
    expect(result.filtered_items.map((item: any) => item.item_id)).not.toContain('itm_003');
    expect(result.filtered_items.map((item: any) => item.item_id)).not.toContain('itm_004');

    // 集計結果に請求対象項目のみが含まれていることを検証
    result.filtered_items.forEach((item: any) => {
      expect(item.is_invoiceable).toBe(true);
    });

    // 集計合計値が期待値と一致していることを確認
    // 期待値: 50 + 30 + 100 = 180
    const expected_total_amount = 180;
    expect(result.total_invoiceable_amount).toBe(expected_total_amount);

    // 集計結果の詳細検証
    expect(result.total_invoiceable_amount).toEqual(
      sample_dataset
        .filter((item: any) => item.is_invoiceable === true)
        .reduce((sum: number, item: any) => sum + item.amount, 0),
    );

    // 集計結果のメタデータが正確に保持されていることを検証
    expect(result.filtered_items[0]).toEqual({
      item_id: 'itm_001',
      item_name: 'アポイント数',
      unit: '件',
      data_type: 'INTEGER',
      amount: 50,
      is_invoiceable: true,
    });

    expect(result.filtered_items[1]).toEqual({
      item_id: 'itm_002',
      item_name: '成約数',
      unit: '件',
      data_type: 'INTEGER',
      amount: 30,
      is_invoiceable: true,
    });

    expect(result.filtered_items[2]).toEqual({
      item_id: 'itm_005',
      item_name: '基本サービス利用日数',
      unit: '日',
      data_type: 'INTEGER',
      amount: 100,
      is_invoiceable: true,
    });

    // 除外項目の検証
    expect(result.excluded_items).toHaveLength(2);
    expect(result.excluded_items.map((item: any) => item.item_id)).toEqual(['itm_003', 'itm_004']);
  });
});