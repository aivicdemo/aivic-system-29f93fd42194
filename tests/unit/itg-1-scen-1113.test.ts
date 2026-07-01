import { validateSalesDataQualityRule } from '../../src/logic/it-1781935279444-2-2-1';

describe('営業データ品質検証ルール定義・実行機能', () => {
  // SCEN-1113
  test('優先度が空または無効な値の場合、例外ケース分類がスキップされ適切にエラーハンドリングされる', () => {
    // ケース1: 優先度が空の場合
    const ruleWithEmptyPriority = {
      rule_id: 'rule-001',
      rule_name: '必須項目チェック',
      target_field: 'customer_name',
      validation_type: 'required',
      priority: '',
      condition_list: [
        {
          condition_id: 'cond-001',
          operator: 'is_not_null',
          expected_value: null
        }
      ],
      exception_case_classification: true
    };

    const resultEmpty = validateSalesDataQualityRule(ruleWithEmptyPriority);

    expect(resultEmpty).toEqual({
      is_valid: false,
      error_code: 'PRIORITY_EMPTY',
      error_message: '優先度が空です',
      exception_case_skipped: true,
      recovery_status: 'ready_for_next_operation',
      log_entry: expect.stringContaining('優先度が空')
    });

    expect(resultEmpty.exception_case_skipped).toBe(true);
    expect(resultEmpty.error_message).toMatch(/優先度が空/);
    expect(resultEmpty.recovery_status).toBe('ready_for_next_operation');

    // ケース2: 優先度に無効な値（-1）を設定した場合
    const ruleWithInvalidPriorityNegative = {
      rule_id: 'rule-002',
      rule_name: 'データ型チェック',
      target_field: 'transaction_amount',
      validation_type: 'data_type',
      priority: -1,
      condition_list: [
        {
          condition_id: 'cond-002',
          operator: 'is_numeric',
          expected_value: null
        }
      ],
      exception_case_classification: true
    };

    const resultInvalidNegative = validateSalesDataQualityRule(ruleWithInvalidPriorityNegative);

    expect(resultInvalidNegative).toEqual({
      is_valid: false,
      error_code: 'PRIORITY_OUT_OF_RANGE',
      error_message: '優先度の値が無効です',
      exception_case_skipped: true,
      recovery_status: 'ready_for_next_operation',
      log_entry: expect.stringContaining('無効な優先度値')
    });

    expect(resultInvalidNegative.exception_case_skipped).toBe(true);
    expect(resultInvalidNegative.error_message).toMatch(/優先度の値が無効/);

    // ケース3: 優先度に無効な値（999）を設定した場合
    const ruleWithInvalidPriorityHigh = {
      rule_id: 'rule-003',
      rule_name: '範囲チェック',
      target_field: 'deal_value',
      validation_type: 'range',
      priority: 999,
      condition_list: [
        {
          condition_id: 'cond-003',
          operator: 'between',
          expected_value: { min: 0, max: 1000000 }
        }
      ],
      exception_case_classification: true
    };

    const resultInvalidHigh = validateSalesDataQualityRule(ruleWithInvalidPriorityHigh);

    expect(resultInvalidHigh).toEqual({
      is_valid: false,
      error_code: 'PRIORITY_OUT_OF_RANGE',
      error_message: '優先度の値が無効です',
      exception_case_skipped: true,
      recovery_status: 'ready_for_next_operation',
      log_entry: expect.stringContaining('無効な優先度値')
    });

    expect(resultInvalidHigh.exception_case_skipped).toBe(true);
    expect(resultInvalidHigh.error_message).toMatch(/優先度の値が無効/);

    // ケース4: 正常な優先度値（1-10の範囲）で処理継続可能であることを確認
    const ruleWithValidPriority = {
      rule_id: 'rule-004',
      rule_name: '異常値チェック',
      target_field: 'contact_date',
      validation_type: 'anomaly',
      priority: 5,
      condition_list: [
        {
          condition_id: 'cond-004',
          operator: 'is_valid_date',
          expected_value: null
        }
      ],
      exception_case_classification: true
    };

    const resultValid = validateSalesDataQualityRule(ruleWithValidPriority);

    expect(resultValid).toEqual({
      is_valid: true,
      error_code: null,
      error_message: null,
      exception_case_skipped: false,
      recovery_status: 'completed_successfully',
      log_entry: expect.stringContaining('優先度値は有効')
    });

    expect(resultValid.is_valid).toBe(true);
    expect(resultValid.exception_case_skipped).toBe(false);
    expect(resultValid.recovery_status).toBe('completed_successfully');
  });
});