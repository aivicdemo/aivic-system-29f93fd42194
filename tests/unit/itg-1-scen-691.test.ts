import { validateSalesDataRange } from '../../src/logic/it-1781935279444-2-2-1';

describe('営業データ値の範囲検証機能', () => {
  // SCEN-691
  test('数値項目が最小値ちょうどの場合に検証が合格する', () => {
    const sales_data_item = {
      item_id: 'apo_count',
      item_name: 'アポ数',
      data_type: 'number',
      unit: '件',
      min_value: 0,
      max_value: 1000,
      is_required: true,
    };

    const input_value = 0;

    const result = validateSalesDataRange({
      salesDataItem: sales_data_item,
      inputValue: input_value,
    });

    expect(result.isValid).toBe(true);
    expect(result.errorMessage).toBe('');
    expect(result.passedValue).toBe(0);
  });
});