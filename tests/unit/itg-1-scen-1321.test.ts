import { describe, it, expect, beforeEach } from '@jest/globals';
import { validateSalesDataAgainstRules } from '../../src/logic/it-1-1-1';

describe('営業成果データの自動検証ルール定義と異常検出機能', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // SCEN-1321: [error] 営業データ自動検証ルール定義と異常検出 - 検証ルール条件の1つを違反する営業データが異常として検出される
  it('should detect sales data that violates exactly one validation rule condition', () => {
    const validationRules = [
      {
        rule_id: 'rule_001',
        rule_name: '売上金額チェック',
        rule_condition_id: 'cond_001',
        condition_operator: '>',
        condition_value: '0',
        data_item_name: 'sales_amount'
      },
      {
        rule_id: 'rule_002',
        rule_name: '顧客名チェック',
        rule_condition_id: 'cond_002',
        condition_operator: 'not_empty',
        condition_value: '',
        data_item_name: 'customer_name'
      },
      {
        rule_id: 'rule_003',
        rule_name: '取引日チェック',
        rule_condition_id: 'cond_003',
        condition_operator: 'not_future_date',
        condition_value: '',
        data_item_name: 'transaction_date'
      }
    ];

    const testSalesData = {
      sales_data_id: 'sd_test_001',
      sales_amount: 0,
      customer_name: 'テスト顧客A',
      transaction_date: '2024-01-15'
    };

    const result = validateSalesDataAgainstRules(validationRules, testSalesData);

    expect(result.is_valid).toBe(false);
    expect(result.violation_count).toBe(1);
    expect(result.violations).toHaveLength(1);
    expect(result.violations[0]).toEqual({
      condition_id: 'cond_001',
      rule_name: '売上金額チェック',
      data_item_name: 'sales_amount',
      expected_condition: '>',
      expected_value: '0',
      actual_value: 0
    });
  });
});