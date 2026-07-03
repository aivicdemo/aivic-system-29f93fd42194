import { describe, test, expect } from '@jest/globals';
import { validateSalesDataWithCompositeRules } from '../../src/logic/it-1781935279444-2-1-1';

describe('営業データ入力時の品質検証ルール定義・実行', () => {
  test('SCEN-1045: 複数の検証条件を組み合わせたルールが正常に評価され、検証結果が返される', () => {
    // ルール定義：顧客名（必須）AND売上金額（0以上）AND取引日（現在日付以前）
    const compositeRule = {
      rule_id: 'rule_composite_001',
      rule_name: '複合検証ルール',
      conditions: [
        {
          condition_id: 'cond_001',
          field_name: 'customer_name',
          operator: 'required',
          expected_value: null,
          error_message: '顧客名は必須項目です'
        },
        {
          condition_id: 'cond_002',
          field_name: 'sales_amount',
          operator: 'greater_than_or_equal',
          expected_value: 0,
          error_message: '売上金額は0以上である必要があります'
        },
        {
          condition_id: 'cond_003',
          field_name: 'transaction_date',
          operator: 'less_than_or_equal',
          expected_value: '2024-12-31',
          error_message: '取引日は現在日付以前である必要があります'
        }
      ]
    };

    // ケース1：すべての条件を満たすテストデータ
    const validData = {
      customer_name: 'テスト顧客A',
      sales_amount: 100000,
      transaction_date: '2024-12-15'
    };

    const result1 = validateSalesDataWithCompositeRules(compositeRule, validData);
    expect(result1.validation_status).toBe('pass');
    expect(result1.validation_errors).toEqual([]);
    expect(result1.error_count).toBe(0);

    // ケース2：1つの条件を満たさないテストデータ（売上金額が負）
    const invalidData1 = {
      customer_name: 'テスト顧客B',
      sales_amount: -50000,
      transaction_date: '2024-12-10'
    };

    const result2 = validateSalesDataWithCompositeRules(compositeRule, invalidData1);
    expect(result2.validation_status).toBe('fail');
    expect(result2.error_count).toBe(1);
    expect(result2.validation_errors.length).toBe(1);
    expect(result2.validation_errors[0]).toMatchObject({
      condition_id: 'cond_002',
      field_name: 'sales_amount',
      error_message: '売上金額は0以上である必要があります',
      actual_value: -50000
    });

    // ケース3：複数の条件を満たさないテストデータ（顧客名なし、売上金額が負、取引日が未来）
    const invalidData2 = {
      customer_name: '',
      sales_amount: -30000,
      transaction_date: '2025-06-01'
    };

    const result3 = validateSalesDataWithCompositeRules(compositeRule, invalidData2);
    expect(result3.validation_status).toBe('fail');
    expect(result3.error_count).toBe(3);
    expect(result3.validation_errors.length).toBe(3);

    const errorConditionIds = result3.validation_errors.map((e: any) => e.condition_id);
    expect(errorConditionIds).toContain('cond_001');
    expect(errorConditionIds).toContain('cond_002');
    expect(errorConditionIds).toContain('cond_003');

    const cond001Error = result3.validation_errors.find((e: any) => e.condition_id === 'cond_001');
    expect(cond001Error).toMatchObject({
      field_name: 'customer_name',
      error_message: '顧客名は必須項目です'
    });

    const cond002Error = result3.validation_errors.find((e: any) => e.condition_id === 'cond_002');
    expect(cond002Error).toMatchObject({
      field_name: 'sales_amount',
      error_message: '売上金額は0以上である必要があります',
      actual_value: -30000
    });

    const cond003Error = result3.validation_errors.find((e: any) => e.condition_id === 'cond_003');
    expect(cond003Error).toMatchObject({
      field_name: 'transaction_date',
      error_message: '取引日は現在日付以前である必要があります',
      actual_value: '2025-06-01'
    });

    // ケース4：別の1つの条件を満たさないテストデータ（取引日が未来）
    const invalidData3 = {
      customer_name: 'テスト顧客D',
      sales_amount: 50000,
      transaction_date: '2025-01-15'
    };

    const result4 = validateSalesDataWithCompositeRules(compositeRule, invalidData3);
    expect(result4.validation_status).toBe('fail');
    expect(result4.error_count).toBe(1);
    expect(result4.validation_errors.length).toBe(1);
    expect(result4.validation_errors[0]).toMatchObject({
      condition_id: 'cond_003',
      field_name: 'transaction_date',
      error_message: '取引日は現在日付以前である必要があります',
      actual_value: '2025-01-15'
    });

    // ケース5：辺界値テスト - 売上金額がちょうど0
    const boundaryData = {
      customer_name: 'テスト顧客E',
      sales_amount: 0,
      transaction_date: '2024-12-31'
    };

    const result5 = validateSalesDataWithCompositeRules(compositeRule, boundaryData);
    expect(result5.validation_status).toBe('pass');
    expect(result5.error_count).toBe(0);
    expect(result5.validation_errors).toEqual([]);
  });
});