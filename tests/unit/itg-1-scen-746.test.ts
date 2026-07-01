import { extractBillableItems, aggregateBillingAmount } from '../../src/logic/it-1-2-1';

describe('営業成果データから請求対象項目を自動抽出し、顧客ごと・サービスごとの請求額を集計する機能', () => {
  // SCEN-746
  test('請求ルールで定義されていないサービス種別のレコードは請求対象外として判定され、完全に除外されること', () => {
    // 既知のサービス種別を定義した請求ルールマスタ
    const billingRules = [
      {
        serviceId: 'service-A',
        serviceName: 'サービスA',
        unitPrice: 10000,
        minimumBillingAmount: 0,
        maximumBillingAmount: null,
      },
      {
        serviceId: 'service-B',
        serviceName: 'サービスB',
        unitPrice: 15000,
        minimumBillingAmount: 0,
        maximumBillingAmount: null,
      },
    ];

    // 既知と未定義のサービス種別が混在した営業データ
    const salesData = [
      {
        customerId: 'customer-001',
        customerName: '顧客A',
        serviceId: 'service-A',
        serviceName: 'サービスA',
        appointmentCount: 5,
        contractAmount: 50000,
        recordDate: '2024-01-15',
      },
      {
        customerId: 'customer-001',
        customerName: '顧客A',
        serviceId: 'service-C',
        serviceName: 'サービスC',
        appointmentCount: 3,
        contractAmount: 30000,
        recordDate: '2024-01-16',
      },
      {
        customerId: 'customer-002',
        customerName: '顧客B',
        serviceId: 'service-B',
        serviceName: 'サービスB',
        appointmentCount: 8,
        contractAmount: 120000,
        recordDate: '2024-01-17',
      },
      {
        customerId: 'customer-002',
        customerName: '顧客B',
        serviceId: 'service-C',
        serviceName: 'サービスC',
        appointmentCount: 2,
        contractAmount: 20000,
        recordDate: '2024-01-18',
      },
    ];

    // 請求対象項目の自動抽出を実行
    const extractionResult = extractBillableItems(salesData, billingRules);

    // 抽出結果の検証：未定義サービスのレコードが除外されていることを確認
    expect(extractionResult.billableRecords).toHaveLength(2);
    expect(extractionResult.billableRecords[0]).toEqual({
      customerId: 'customer-001',
      customerName: '顧客A',
      serviceId: 'service-A',
      serviceName: 'サービスA',
      appointmentCount: 5,
      contractAmount: 50000,
      recordDate: '2024-01-15',
      isEligible: true,
    });
    expect(extractionResult.billableRecords[1]).toEqual({
      customerId: 'customer-002',
      customerName: '顧客B',
      serviceId: 'service-B',
      serviceName: 'サービスB',
      appointmentCount: 8,
      contractAmount: 120000,
      recordDate: '2024-01-17',
      isEligible: true,
    });

    // 除外ログの検証：未定義サービスのレコードが記録されていることを確認
    expect(extractionResult.excludedRecords).toHaveLength(2);
    expect(extractionResult.excludedRecords[0]).toEqual({
      customerId: 'customer-001',
      customerName: '顧客A',
      serviceId: 'service-C',
      serviceName: 'サービスC',
      appointmentCount: 3,
      contractAmount: 30000,
      recordDate: '2024-01-16',
      isEligible: false,
      excludeReason: 'サービス種別が請求ルールに未定義',
    });
    expect(extractionResult.excludedRecords[1]).toEqual({
      customerId: 'customer-002',
      customerName: '顧客B',
      serviceId: 'service-C',
      serviceName: 'サービスC',
      appointmentCount: 2,
      contractAmount: 20000,
      recordDate: '2024-01-18',
      isEligible: false,
      excludeReason: 'サービス種別が請求ルールに未定義',
    });

    // 請求額集計処理を実行
    const aggregationResult = aggregateBillingAmount(extractionResult.billableRecords, billingRules);

    // 集計結果の検証：未定義サービスに関連する金額が含まれていないことを確認
    expect(aggregationResult.totalBillingAmount).toBe(170000);
    expect(aggregationResult.billingByCustomer).toHaveLength(2);
    expect(aggregationResult.billingByCustomer[0]).toEqual({
      customerId: 'customer-001',
      customerName: '顧客A',
      totalAmount: 50000,
      billingByService: [
        {
          serviceId: 'service-A',
          serviceName: 'サービスA',
          amount: 50000,
        },
      ],
    });
    expect(aggregationResult.billingByCustomer[1]).toEqual({
      customerId: 'customer-002',
      customerName: '顧客B',
      totalAmount: 120000,
      billingByService: [
        {
          serviceId: 'service-B',
          serviceName: 'サービスB',
          amount: 120000,
        },
      ],
    });

    // 集計結果にサービスCの金額が含まれていないことを検証
    const hasDefinedServiceCInAggregation = aggregationResult.billingByCustomer.some(
      (customer) => customer.billingByService.some((service) => service.serviceId === 'service-C')
    );
    expect(hasDefinedServiceCInAggregation).toBe(false);

    // 除外理由の詳細ログが記録されていることを確認
    expect(extractionResult.auditLog).toContainEqual({
      recordIndex: 1,
      reason: 'サービス種別が請求ルールに未定義',
      excludedAmount: 30000,
      timestamp: expect.any(String),
    });
    expect(extractionResult.auditLog).toContainEqual({
      recordIndex: 3,
      reason: 'サービス種別が請求ルールに未定義',
      excludedAmount: 20000,
      timestamp: expect.any(String),
    });

    // エラーテスト：未定義サービス種別が存在する場合、警告フラグが立つことを確認
    expect(extractionResult.hasUndefinedServices).toBe(true);
    expect(extractionResult.undefinedServiceIds).toContain('service-C');
  });
});