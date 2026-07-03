import { aggregateBillingAmountByCustomerAndService } from '../../src/logic/it-1-2-1';

describe('顧客別・サービス別請求額集計機能', () => {
  test('SCEN-1302: 単一顧客・単一サービスの請求額計算時、集計結果が営業データの合計と一致する', () => {
    // Arrange: テスト用営業データを準備
    const customerId = 'TEST-CUST-001';
    const serviceId = 'TEST-SVC-001';
    const salesRecords = [
      {
        customerId,
        serviceId,
        billingAmount: 10000,
        recordDate: '2024-01-15',
      },
      {
        customerId,
        serviceId,
        billingAmount: 20000,
        recordDate: '2024-01-16',
      },
      {
        customerId,
        serviceId,
        billingAmount: 15000,
        recordDate: '2024-01-17',
      },
      {
        customerId,
        serviceId,
        billingAmount: 25000,
        recordDate: '2024-01-18',
      },
      {
        customerId,
        serviceId,
        billingAmount: 30000,
        recordDate: '2024-01-19',
      },
    ];

    // 手動計算による期待値（¥100,000）
    const expectedTotalAmount = 100000;

    // Act: 顧客別・サービス別請求額集計機能を実行
    const aggregationResult = aggregateBillingAmountByCustomerAndService(
      salesRecords
    );

    // Assert: 集計結果が期待値と一致することを確認
    expect(aggregationResult).toHaveProperty('customerId', customerId);
    expect(aggregationResult).toHaveProperty('serviceId', serviceId);
    expect(aggregationResult).toHaveProperty(
      'totalBillingAmount',
      expectedTotalAmount
    );
    expect(aggregationResult).toHaveProperty('recordCount', 5);

    // Assert: 他の顧客やサービスのデータが混在していないことを検証
    expect(aggregationResult.customerId).toBe(customerId);
    expect(aggregationResult.serviceId).toBe(serviceId);

    // Assert: 集計対象レコード数が正確であることを確認
    expect(aggregationResult.recordCount).toBe(salesRecords.length);

    // Assert: 手動計算結果と一致することを確認
    const manualSum = salesRecords.reduce(
      (sum, record) => sum + record.billingAmount,
      0
    );
    expect(aggregationResult.totalBillingAmount).toBe(manualSum);
  });
});