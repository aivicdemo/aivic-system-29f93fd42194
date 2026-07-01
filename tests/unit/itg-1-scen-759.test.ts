import { describe, test, expect } from '@jest/globals';
import { validateSalesDataIntegrity } from '../../src/logic/it-1781935279444-2-2-1';

describe('営業データの完全性・正確性自動検証', () => {
  // SCEN-759: [edge] 営業データ完全性・正確性の自動検証 - 営業データの成約数がアポ数を超える場合、論理矛盾エラーとして検出される
  test('成約数がアポ数を超える場合、論理矛盾エラーを検出すること', () => {
    const salesData = {
      appointmentCount: 10,
      closedDealCount: 15,
      customerId: 'CUST001',
      serviceId: 'SVC001',
      reportingPeriod: '2024-01',
    };

    const result = validateSalesDataIntegrity(salesData);

    expect(result.isValid).toBe(false);
    expect(result.errorStatus).toBe('LOGIC_CONTRADICTION_ERROR');
    expect(result.errorMessage).toMatch(/成約数はアポ数を超過することはできません/);
    expect(result.errorCode).toBe('E001_CLOSED_EXCEEDS_APPOINTMENT');
  });
});