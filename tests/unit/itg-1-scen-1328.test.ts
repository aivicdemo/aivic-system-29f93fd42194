import { describe, test, expect } from '@jest/globals';
import { excludeUnregisteredMetadataItems } from '../../src/logic/it-1781935279444-1-1-1';

describe('営業データ項目メタデータ管理', () => {
  // SCEN-1328: [normal] 営業データ項目メタデータ管理 - メタデータに登録されていない項目が計算対象から除外される
  test('メタデータに登録されていない項目が計算対象から除外される', () => {
    // メタデータ登録済み項目の定義
    const registeredMetadata = [
      {
        item_id: 'apo_count',
        item_name: 'アポ数',
        unit: '件',
        data_type: 'integer',
        calculation_logic: 'SUM(apo_count)',
        report_mapping: 'sales_summary.apo_count',
        is_active: true,
      },
      {
        item_id: 'contract_count',
        item_name: '成約数',
        unit: '件',
        data_type: 'integer',
        calculation_logic: 'SUM(contract_count)',
        report_mapping: 'sales_summary.contract_count',
        is_active: true,
      },
      {
        item_id: 'customer_response',
        item_name: '顧客反応',
        unit: 'スコア',
        data_type: 'decimal',
        calculation_logic: 'AVG(customer_response)',
        report_mapping: 'sales_summary.customer_response',
        is_active: true,
      },
    ];

    // サンプル営業データ（メタデータ未登録項目を含む）
    const sampleSalesData = {
      apo_count: 15,
      contract_count: 8,
      customer_response: 4.5,
      unregistered_field_1: 'unknown_value',
      unregistered_field_2: 999,
      contact_count: 20, // メタデータ未登録
    };

    // 計算処理を実行
    const result = excludeUnregisteredMetadataItems({
      metadata_list: registeredMetadata,
      sales_data: sampleSalesData,
    });

    // 計算結果の検証：登録済み項目のみが含まれている
    expect(result.processed_data).toEqual({
      apo_count: 15,
      contract_count: 8,
      customer_response: 4.5,
    });

    // スキップされた項目の詳細がログに記録されている
    expect(result.skipped_items).toHaveLength(3);
    expect(result.skipped_items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          field_name: 'unregistered_field_1',
          value: 'unknown_value',
          reason: 'unregistered',
        }),
        expect.objectContaining({
          field_name: 'unregistered_field_2',
          value: 999,
          reason: 'unregistered',
        }),
        expect.objectContaining({
          field_name: 'contact_count',
          value: 20,
          reason: 'unregistered',
        }),
      ])
    );

    // スキップされた項目名をログから抽出して検証
    const skipped_field_names = result.skipped_items.map((item) => item.field_name);
    expect(skipped_field_names).toContain('unregistered_field_1');
    expect(skipped_field_names).toContain('unregistered_field_2');
    expect(skipped_field_names).toContain('contact_count');

    // 抽出した項目がすべてメタデータ未登録であることを検証
    const registered_ids = registeredMetadata.map((meta) => meta.item_id);
    skipped_field_names.forEach((field_name) => {
      expect(registered_ids).not.toContain(field_name);
    });

    // トレーサビリティ情報の検証
    expect(result.processing_log).toBeDefined();
    expect(result.processing_log.timestamp).toBeDefined();
    expect(result.processing_log.total_items_processed).toBe(3);
    expect(result.processing_log.total_items_skipped).toBe(3);
    expect(result.processing_log.excluded_reason_summary).toEqual({
      unregistered: 3,
    });

    // 登録済み項目のみが最終計算対象に含まれていることを確認
    const processed_field_names = Object.keys(result.processed_data);
    expect(processed_field_names).toEqual(['apo_count', 'contract_count', 'customer_response']);
  });
});