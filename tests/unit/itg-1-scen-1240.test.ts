import { describe, test, expect, beforeEach } from '@jest/globals';
import { validateContractChangeRules } from '../../src/logic/it-1781935279444-2-1-1';

describe('営業データ入力時の品質検証ルール定義・実行機能', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // SCEN-1240: [error] 契約変更内容のルール適合性判定機能 - 変更内容が請求ルール・納期要件の両方に違反する場合、複数エラーが検出される
  test('should detect multiple errors when contract change violates both billing rules and delivery requirements', () => {
    const contract_change_input = {
      contract_id: 'C-20240115-001',
      customer_id: 'CUST-202401-A',
      service_id: 'SVC-SALES-001',
      change_type: 'billing_and_delivery',
      billing_cycle_new: 'invalid_cycle',
      delivery_date_new: '2023-12-01T00:00:00Z',
      contract_start_date: '2024-01-01T00:00:00Z',
      contract_end_date: '2025-12-31T23:59:59Z',
      valid_billing_cycles: ['monthly', 'quarterly', 'annual'],
      minimum_delivery_date: '2024-01-15T00:00:00Z',
    };

    const validation_result = validateContractChangeRules(contract_change_input);

    expect(validation_result.is_valid).toBe(false);
    expect(Array.isArray(validation_result.errors)).toBe(true);
    expect(validation_result.errors.length).toBeGreaterThanOrEqual(2);

    const error_messages = validation_result.errors.map((err: { code: string; message: string }) => err.code);
    expect(error_messages).toContain('BILLING_CYCLE_INVALID');
    expect(error_messages).toContain('DELIVERY_DATE_PAST');

    const billing_error = validation_result.errors.find(
      (err: { code: string; message: string }) => err.code === 'BILLING_CYCLE_INVALID'
    );
    expect(billing_error).toBeDefined();
    expect(billing_error.message).toMatch(/billing/i);

    const delivery_error = validation_result.errors.find(
      (err: { code: string; message: string }) => err.code === 'DELIVERY_DATE_PAST'
    );
    expect(delivery_error).toBeDefined();
    expect(delivery_error.message).toMatch(/納期|delivery/i);
  });
});