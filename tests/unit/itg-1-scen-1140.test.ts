import { describe, test, expect } from '@jest/globals';
import { validateAndAggregateByMetadata } from '../../src/logic/it-1781935279444-2-1-1';

describe('営業データ入力時の品質検証ルール定義・実行機能', () => {
  // SCEN-1140
  test('営業データメタデータに基づく集計検証 - メタデータの計算式が正確に適用され、複数レコード対応、メタデータ変更時も反映される', () => {
    // ========== ステップ 1-5: 初期メタデータ定義と基本集計テスト ==========
    const metadata_v1 = {
      item_id: 'sales_amount',
      item_name: '売上金額',
      unit: '円',
      data_type: 'number',
      calculation_formula: 'unit_price * quantity',
    };

    const record_1 = {
      unit_price: 1000,
      quantity: 5,
    };

    // メタデータv1で単一レコードを集計
    const result_1 = validateAndAggregateByMetadata({
      metadata: metadata_v1,
      records: [record_1],
    });

    // 計算式『単価×数量』 = 1000 * 5 = 5000
    expect(result_1.aggregated_value).toBe(5000);
    expect(result_1.unit).toBe('円');
    expect(result_1.item_name).toBe('売上金額');
    expect(result_1.validation_status).toBe('passed');

    // ========== ステップ 6: 複数レコード（5件以上）への一貫適用 ==========
    const records_multiple = [
      { unit_price: 1000, quantity: 5 },    // 5000
      { unit_price: 2000, quantity: 3 },    // 6000
      { unit_price: 1500, quantity: 4 },    // 6000
      { unit_price: 800, quantity: 10 },    // 8000
      { unit_price: 3000, quantity: 2 },    // 6000
      { unit_price: 1200, quantity: 6 },    // 7200
    ];

    const result_multiple = validateAndAggregateByMetadata({
      metadata: metadata_v1,
      records: records_multiple,
    });

    // 全レコードの合計: 5000 + 6000 + 6000 + 8000 + 6000 + 7200 = 38200
    expect(result_multiple.aggregated_value).toBe(38200);
    expect(result_multiple.unit).toBe('円');
    expect(result_multiple.record_count).toBe(6);
    expect(result_multiple.validation_status).toBe('passed');

    // 各レコードの計算結果も検証
    expect(result_multiple.per_record_values).toEqual([5000, 6000, 6000, 8000, 6000, 7200]);

    // ========== ステップ 7-8: メタデータ変更反映テスト ==========
    const metadata_v2 = {
      item_id: 'sales_amount',
      item_name: '売上金額',
      unit: '円',
      data_type: 'number',
      calculation_formula: 'unit_price * quantity * 1.1',
    };

    const result_after_metadata_change = validateAndAggregateByMetadata({
      metadata: metadata_v2,
      records: records_multiple,
    });

    // 新しい計算式『単価×数量×1.1』を適用
    // 5000*1.1 + 6000*1.1 + 6000*1.1 + 8000*1.1 + 6000*1.1 + 7200*1.1
    // = 5500 + 6600 + 6600 + 8800 + 6600 + 7920 = 42020
    expect(result_after_metadata_change.aggregated_value).toBe(42020);
    expect(result_after_metadata_change.unit).toBe('円');
    expect(result_after_metadata_change.per_record_values).toEqual([
      5500, 6600, 6600, 8800, 6600, 7920,
    ]);
    expect(result_after_metadata_change.validation_status).toBe('passed');

    // ========== ステップ 9: 請求自動化システムへの連携検証 ==========
    const billing_linkage = validateAndAggregateByMetadata({
      metadata: metadata_v2,
      records: records_multiple,
      include_billing_payload: true,
    });

    expect(billing_linkage.billing_payload).toBeDefined();
    expect(billing_linkage.billing_payload.total_amount).toBe(42020);
    expect(billing_linkage.billing_payload.currency).toBe('円');
    expect(billing_linkage.billing_payload.item_id).toBe('sales_amount');
    expect(billing_linkage.billing_payload.record_count).toBe(6);
    expect(billing_linkage.billing_payload.billing_status).toBe('ready_for_invoicing');

    // ========== ステップ 10: エッジケース・データ型検証 ==========
    const record_with_decimals = [
      { unit_price: 1500.5, quantity: 3 },   // 1500.5 * 3 * 1.1 = 4951.65
      { unit_price: 2000, quantity: 2.5 },   // 2000 * 2.5 * 1.1 = 5500
    ];

    const result_decimals = validateAndAggregateByMetadata({
      metadata: metadata_v2,
      records: record_with_decimals,
    });

    expect(result_decimals.aggregated_value).toBeCloseTo(10451.65, 2);
    expect(result_decimals.validation_status).toBe('passed');

    // ========== ステップ 11: メタデータ定義漏れ・不正な計算式テスト ==========
    const invalid_metadata = {
      item_id: 'sales_amount',
      item_name: '売上金額',
      unit: '円',
      data_type: 'number',
      calculation_formula: undefined, // 計算式が未定義
    };

    expect(() => {
      validateAndAggregateByMetadata({
        metadata: invalid_metadata as any,
        records: records_multiple,
      });
    }).toThrow(/計算式/);

    // ========== ステップ 12: 単位が正しく保持されることを検証 ==========
    const metadata_with_other_unit = {
      item_id: 'quantity_total',
      item_name: '合計数量',
      unit: '個',
      data_type: 'number',
      calculation_formula: 'quantity',
    };

    const result_unit_check = validateAndAggregateByMetadata({
      metadata: metadata_with_other_unit,
      records: records_multiple,
    });

    expect(result_unit_check.unit).toBe('個');
    expect(result_unit_check.aggregated_value).toBe(30); // 5+3+4+10+2+6 = 30
  });
});