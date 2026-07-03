import { describe, test, expect, beforeEach } from '@jest/globals';
import { aggregateMultipleSalesDataToMonthlySummary } from '../../src/logic/it-1-br-1781935279444-1-2-1';

describe('月次サマリーテンプレート定義・管理機能', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // SCEN-1123: [edge] 営業データから月次サマリーへの自動マッピング - 複数の営業データ項目が同一のサマリー項目へ集約される場合に正確に計算される
  test('should accurately aggregate multiple sales data items into single monthly summary item', () => {
    // 複数の営業データ項目を同一のサマリー項目にマッピング
    const sales_data_items = [
      {
        item_id: 'sales_a',
        item_name: '売上A',
        value: 10000,
        unit: '円',
        data_type: 'number',
        period: '2024-01',
      },
      {
        item_id: 'sales_b',
        item_name: '売上B',
        value: 25000,
        unit: '円',
        data_type: 'number',
        period: '2024-01',
      },
      {
        item_id: 'sales_c',
        item_name: '売上C',
        value: 15000,
        unit: '円',
        data_type: 'number',
        period: '2024-01',
      },
    ];

    const mapping_rule = {
      rule_id: 'map_total_sales',
      source_items: ['sales_a', 'sales_b', 'sales_c'],
      target_summary_item: 'monthly_total_sales',
      aggregation_type: 'sum',
      description: '月次売上合計',
    };

    // 月次サマリーの自動マッピング処理を実行
    const result = aggregateMultipleSalesDataToMonthlySummary(
      sales_data_items,
      mapping_rule,
      '2024-01'
    );

    // 集約された月次サマリー項目の計算値を検証
    // 期待値: 10000 + 25000 + 15000 = 50000
    expect(result).toEqual({
      summary_item: 'monthly_total_sales',
      calculated_value: 50000,
      aggregation_type: 'sum',
      period: '2024-01',
      source_count: 3,
      source_items: ['sales_a', 'sales_b', 'sales_c'],
      status: 'success',
    });

    // 異なる月のデータでも同じマッピングルールが一貫して適用されることを確認
    const sales_data_items_feb = [
      {
        item_id: 'sales_a',
        item_name: '売上A',
        value: 12000,
        unit: '円',
        data_type: 'number',
        period: '2024-02',
      },
      {
        item_id: 'sales_b',
        item_name: '売上B',
        value: 28000,
        unit: '円',
        data_type: 'number',
        period: '2024-02',
      },
      {
        item_id: 'sales_c',
        item_name: '売上C',
        value: 18000,
        unit: '円',
        data_type: 'number',
        period: '2024-02',
      },
    ];

    const result_feb = aggregateMultipleSalesDataToMonthlySummary(
      sales_data_items_feb,
      mapping_rule,
      '2024-02'
    );

    // 期待値: 12000 + 28000 + 18000 = 58000
    expect(result_feb).toEqual({
      summary_item: 'monthly_total_sales',
      calculated_value: 58000,
      aggregation_type: 'sum',
      period: '2024-02',
      source_count: 3,
      source_items: ['sales_a', 'sales_b', 'sales_c'],
      status: 'success',
    });

    // エラーハンドリングが正常に機能しているか確認
    const invalid_mapping_rule = {
      rule_id: 'invalid_map',
      source_items: ['nonexistent_item_x', 'nonexistent_item_y'],
      target_summary_item: 'monthly_total_sales',
      aggregation_type: 'sum',
      description: '存在しない項目へのマッピング',
    };

    expect(() =>
      aggregateMultipleSalesDataToMonthlySummary(
        sales_data_items,
        invalid_mapping_rule,
        '2024-01'
      )
    ).toThrow(/マッピング/);

    // 空のデータセットでのエラーハンドリング
    const empty_data_items: typeof sales_data_items = [];
    expect(() =>
      aggregateMultipleSalesDataToMonthlySummary(
        empty_data_items,
        mapping_rule,
        '2024-01'
      )
    ).toThrow(/データ/);

    // 不正な集計タイプでのエラーハンドリング
    const invalid_aggregation_rule = {
      rule_id: 'invalid_agg',
      source_items: ['sales_a', 'sales_b', 'sales_c'],
      target_summary_item: 'monthly_total_sales',
      aggregation_type: 'invalid_type',
      description: '不正な集計タイプ',
    };

    expect(() =>
      aggregateMultipleSalesDataToMonthlySummary(
        sales_data_items,
        invalid_aggregation_rule,
        '2024-01'
      )
    ).toThrow(/集計/);
  });
});