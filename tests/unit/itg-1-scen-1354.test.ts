import { describe, test, expect } from '@jest/globals';
import { validateSalesDataNumericAccuracy } from '../../src/logic/it-1781935279444-2-2-1';

describe('営業データ完全性・正確性自動検証 - 数値項目正確性チェック', () => {
  // SCEN-1354
  test('不正な数値値（負の売上金額、範囲外の割引率）が検出され、エラーとして記録される', () => {
    const test_data = {
      sales_amount: -50000,
      discount_rate: 150,
      appointment_count: 5,
      contract_count: 2,
      customer_id: 'CUST001',
      service_type: 'premium',
      processing_date: '2024-01-15T09:30:00Z',
    };

    const result = validateSalesDataNumericAccuracy(test_data);

    expect(result.is_valid).toBe(false);
    expect(result.errors).toHaveLength(2);

    const error_negative_sales = result.errors.find(
      (e) => e.field_name === 'sales_amount'
    );
    expect(error_negative_sales).toBeDefined();
    expect(error_negative_sales?.error_message).toMatch(/売上金額/);
    expect(error_negative_sales?.detected_value).toBe(-50000);
    expect(error_negative_sales?.error_status).toBe('エラー');
    expect(error_negative_sales?.error_timestamp).toMatch(
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/
    );

    const error_discount_rate = result.errors.find(
      (e) => e.field_name === 'discount_rate'
    );
    expect(error_discount_rate).toBeDefined();
    expect(error_discount_rate?.error_message).toMatch(/割引率/);
    expect(error_discount_rate?.detected_value).toBe(150);
    expect(error_discount_rate?.error_status).toBe('エラー');
    expect(error_discount_rate?.error_timestamp).toMatch(
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/
    );

    expect(result.validation_report).toBeDefined();
    expect(result.validation_report.total_errors).toBe(2);
    expect(result.validation_report.processing_timestamp).toMatch(
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/
    );
  });
});