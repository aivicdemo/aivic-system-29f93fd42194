import { validateSalesData } from '../../src/logic/it-1781935279444-2-2-1';

describe('営業データ品質検証・異常検出', () => {
  // SCEN-1169: [error] 営業データ品質検証・異常検出 - 数値型項目に文字列が入力された場合、データ型不整合エラーが検出される
  test('数値型項目に文字列が入力された場合、データ型不整合エラーが検出される', () => {
    const testData = {
      sales_amount: '12345ABC',
      customer_id: 'CUST001',
      service_type: 'contract',
      contact_date: '2024-01-15',
    };

    const schema = {
      sales_amount: { type: 'number', required: true },
      customer_id: { type: 'string', required: true },
      service_type: { type: 'string', required: true },
      contact_date: { type: 'string', required: true },
    };

    const result = validateSalesData(testData, schema);

    expect(result.is_valid).toBe(false);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0].error_code).toBe('ERR_DATA_TYPE_MISMATCH');
    expect(result.errors[0].field_name).toBe('sales_amount');
    expect(result.errors[0].message).toMatch(/売上金額フィールドはNumeric型が必須です/);
    expect(result.errors[0].input_value).toBe('12345ABC');
    expect(result.record_status).toBe('validation_failed');
    expect(result.excluded_from_billing).toBe(true);
  });
});