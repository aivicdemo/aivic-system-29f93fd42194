import { validateSalesDataWithRules } from '../../src/logic/it-1781935279444-2-1-1';

describe('営業データ入力時の品質検証ルール定義・実行', () => {
  test('SCEN-1047: 検証条件が0件の場合、自動検証をスキップして警告を返す', () => {
    // Arrange
    const sales_data_input = {
      customer_id: 'CUST-001',
      contact_date: '2024-01-15',
      content: 'Initial meeting',
      appointment_status: 'confirmed'
    };

    const validation_rules = {
      rule_id: 'RULE-001',
      rule_name: 'Sales Data Quality Check',
      validation_conditions: [] as Array<{
        condition_id: string;
        field_name: string;
        operator: string;
        expected_value: string | number;
      }>
    };

    // Act
    const result = validateSalesDataWithRules(sales_data_input, validation_rules);

    // Assert
    expect(result).toEqual({
      validation_passed: true,
      validation_skipped: true,
      warning_message: '検証条件が定義されていません',
      warning_level: 'warning',
      data_processable: true,
      log_entry: {
        timestamp: expect.any(String),
        event_type: 'validation_skipped',
        reason: 'no_validation_conditions',
        message: '検証条件が定義されていません',
        severity: 'warning'
      }
    });

    expect(result.validation_skipped).toBe(true);
    expect(result.warning_message).toBe('検証条件が定義されていません');
    expect(result.data_processable).toBe(true);
    expect(result.log_entry.reason).toBe('no_validation_conditions');
    expect(result.log_entry.severity).toBe('warning');
  });
});