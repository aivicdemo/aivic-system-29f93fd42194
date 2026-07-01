import { extractBillingAmountByCustomerService } from '../../src/logic/it-1-2-1';

describe('営業成果データから請求対象項目を自動抽出し、顧客ごと・サービスごとの請求額を集計する機能', () => {
  // SCEN-1261: [edge] SLA時間内契約変更反映機能 - SLA時間と正確に一致する時点での反映完了が正しく判定される
  test('契約変更がSLA時間（24時間）と正確に一致する時点で反映完了と判定され、請求データに正確に反映される', () => {
    const slaHourLimit = 24;
    const baseTimestamp = new Date('2024-01-15T10:00:00Z').getTime();
    const contractChangeRequestTime = new Date('2024-01-15T10:00:00Z').getTime();
    const reflectionCompletionTime = new Date('2024-01-16T10:00:00Z').getTime();
    const elapsedHours = (reflectionCompletionTime - contractChangeRequestTime) / (1000 * 60 * 60);

    const contractChangeRequest = {
      contractId: 'CTR-001',
      customerId: 'CUST-100',
      serviceId: 'SVC-A',
      changeType: 'billing_amount_update',
      previousBillingAmount: 100000,
      newBillingAmount: 120000,
      requestedAt: contractChangeRequestTime,
      appliedAt: null,
      status: 'pending',
    };

    const salesData = [
      {
        customerId: 'CUST-100',
        serviceId: 'SVC-A',
        appointmentCount: 10,
        contractCount: 3,
        responseRate: 85,
        month: '2024-01',
      },
    ];

    const contract = {
      contractId: 'CTR-001',
      customerId: 'CUST-100',
      serviceId: 'SVC-A',
      unitPrice: 40000,
      baseFee: 0,
      discountRate: 0,
      effectiveDate: '2024-01-16',
      billingRuleType: 'performance_based',
    };

    const result = extractBillingAmountByCustomerService({
      salesData,
      contract,
      contractChangeRequest,
      currentTimestamp: reflectionCompletionTime,
      slaLimitHours: slaHourLimit,
    });

    expect(elapsedHours).toBe(24);
    expect(result.reflectionStatus).toBe('reflection_completed');
    expect(result.reflectionCompletedAt).toBe(reflectionCompletionTime);
    expect(result.slaCompliance).toBe(true);
    expect(result.customerId).toBe('CUST-100');
    expect(result.serviceId).toBe('SVC-A');
    expect(result.billingAmount).toBe(120000);
    expect(result.previousBillingAmount).toBe(100000);
    expect(result.billingAmountDifference).toBe(20000);
    expect(result.contractChangeRequestId).toBe('CTR-001');
    expect(typeof result.reflectionCompletedAt).toBe('number');
    expect(result.reflectionCompletedAt).toEqual(reflectionCompletionTime);
  });
});