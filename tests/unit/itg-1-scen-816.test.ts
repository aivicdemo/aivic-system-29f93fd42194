import { describe, test, expect, beforeEach } from '@jest/globals';
import { validateBillingDataAgainstContract } from '../../src/logic/it-1781935279444-2-2-1';

describe('請求データ妥当性自動検証機能', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // SCEN-816
  test('請求内容が契約条件と完全に一致する場合に検証成功と判定される', () => {
    const contractId = 'CNT-20240115-001';
    const contractAmount = 500000;
    const contractStartDate = new Date('2024-01-01T00:00:00Z');
    const contractEndDate = new Date('2024-01-31T23:59:59Z');
    const serviceType = '営業代行サービス';
    const billingScheduleDay = 15;

    const contractData = {
      id: contractId,
      amount: contractAmount,
      startDate: contractStartDate,
      endDate: contractEndDate,
      serviceType: serviceType,
      billingScheduleDay: billingScheduleDay,
    };

    const billingData = {
      contractId: contractId,
      billingAmount: 500000,
      billingStartDate: contractStartDate,
      billingEndDate: contractEndDate,
      billingContent: serviceType,
      billingDate: new Date('2024-01-15T00:00:00Z'),
    };

    const result = validateBillingDataAgainstContract(contractData, billingData);

    expect(result.status).toBe('success');
    expect(result.isValid).toBe(true);
    expect(result.errorFlag).toBe(false);
    expect(result.message).toMatch(/契約条件と一致/);
    expect(result.canProceedToNextStep).toBe(true);
    expect(result.detailedMessage).toBeDefined();
    expect(result.detailedMessage).toMatch(/契約条件と一致しています/);
  });
});