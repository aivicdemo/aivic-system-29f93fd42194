import { aggregateCustomerPerformanceIndicators } from '../../src/logic/it-1781935279444-1-1-1';

describe('営業データ項目のメタデータ管理機能 - 顧客別成果指標集計', () => {
  // SCEN-1110: [normal] 顧客別成果指標集計ロジック検証 - 契約対象外のサービスデータが集計から除外される
  test('契約対象外のサービスデータが集計結果から除外される', () => {
    // Arrange
    const contractedServiceId = 'SVC-001';
    const uncontractedServiceId = 'SVC-002';
    const customerId = 'CUST-001';

    const performanceData = [
      {
        customerId: customerId,
        serviceId: contractedServiceId,
        metric: 'revenue',
        value: 500000,
      },
      {
        customerId: customerId,
        serviceId: uncontractedServiceId,
        metric: 'revenue',
        value: 1000000,
      },
    ];

    const contractInfo = {
      customerId: customerId,
      contractedServiceIds: [contractedServiceId],
    };

    // Act
    const result = aggregateCustomerPerformanceIndicators(
      performanceData,
      contractInfo
    );

    // Assert
    expect(result.aggregatedMetrics).toBeDefined();
    expect(result.aggregatedMetrics.length).toBe(1);
    expect(result.aggregatedMetrics[0].serviceId).toBe(contractedServiceId);
    expect(result.aggregatedMetrics[0].value).toBe(500000);
    expect(
      result.aggregatedMetrics.some(
        (item: { serviceId: string }) =>
          item.serviceId === uncontractedServiceId
      )
    ).toBe(false);
    expect(result.excludedServices).toContain(uncontractedServiceId);
  });
});