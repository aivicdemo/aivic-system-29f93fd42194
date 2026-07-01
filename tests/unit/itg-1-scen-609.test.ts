import { aggregateBillingByService } from '../../src/logic/it-1781935279444-1-1-1';

describe('営業データ項目メタデータ管理 - 請求対象項目抽出・集計', () => {
  test('SCEN-609: 請求対象項目マッピングが未定義のサービスで集計がスキップされる', () => {
    // テスト用サービスマスタデータの準備
    const serviceWithMappingId = 'service-001';
    const serviceWithoutMappingId = 'service-002';
    const serviceNormalId = 'service-003';

    const services = [
      {
        serviceId: serviceWithMappingId,
        serviceName: 'テストサービスA',
        billingMappingDefined: true,
      },
      {
        serviceId: serviceWithoutMappingId,
        serviceName: 'テストサービスB（未定義）',
        billingMappingDefined: false,
      },
      {
        serviceId: serviceNormalId,
        serviceName: 'テストサービスC',
        billingMappingDefined: true,
      },
    ];

    // 売上データテストデータの投入
    const salesData = [
      {
        transactionId: 'tx-001',
        serviceId: serviceWithMappingId,
        customerId: 'cust-001',
        amount: 10000,
        quantity: 2,
        recordDate: '2024-01-15T10:00:00Z',
      },
      {
        transactionId: 'tx-002',
        serviceId: serviceWithoutMappingId,
        customerId: 'cust-002',
        amount: 5000,
        quantity: 1,
        recordDate: '2024-01-15T11:00:00Z',
      },
      {
        transactionId: 'tx-003',
        serviceId: serviceWithoutMappingId,
        customerId: 'cust-003',
        amount: 8000,
        quantity: 1,
        recordDate: '2024-01-15T12:00:00Z',
      },
      {
        transactionId: 'tx-004',
        serviceId: serviceNormalId,
        customerId: 'cust-001',
        amount: 15000,
        quantity: 3,
        recordDate: '2024-01-15T13:00:00Z',
      },
    ];

    // 請求対象項目マッピング定義
    const billingMappings = [
      {
        serviceId: serviceWithMappingId,
        mappingId: 'map-001',
        mappedField: 'amount',
        calculationLogic: 'direct',
      },
      {
        serviceId: serviceNormalId,
        mappingId: 'map-003',
        mappedField: 'amount_with_quantity',
        calculationLogic: 'multiply_amount_quantity',
      },
    ];

    // 請求額集計処理の実行
    const result = aggregateBillingByService({
      services,
      salesData,
      billingMappings,
      periodStart: '2024-01-01T00:00:00Z',
      periodEnd: '2024-01-31T23:59:59Z',
    });

    // スキップログの検証
    expect(result.skipLog).toBeDefined();
    expect(result.skipLog.length).toBe(1);
    expect(result.skipLog[0].serviceId).toBe(serviceWithoutMappingId);
    expect(result.skipLog[0].reason).toMatch(/マッピング未定義/);

    // 集計結果に未定義サービスのデータが含まれていないことを確認
    const aggregatedServices = result.aggregations.map((agg) => agg.serviceId);
    expect(aggregatedServices).toContain(serviceWithMappingId);
    expect(aggregatedServices).toContain(serviceNormalId);
    expect(aggregatedServices).not.toContain(serviceWithoutMappingId);

    // サービスA（マッピング定義あり）の集計結果の検証
    const serviceAResult = result.aggregations.find(
      (agg) => agg.serviceId === serviceWithMappingId
    );
    expect(serviceAResult).toBeDefined();
    expect(serviceAResult!.totalBillingAmount).toBe(10000);
    expect(serviceAResult!.transactionCount).toBe(1);

    // サービスC（マッピング定義あり、計算ロジック：amount × quantity）の集計結果の検証
    const serviceCResult = result.aggregations.find(
      (agg) => agg.serviceId === serviceNormalId
    );
    expect(serviceCResult).toBeDefined();
    expect(serviceCResult!.totalBillingAmount).toBe(45000);
    expect(serviceCResult!.transactionCount).toBe(1);

    // 請求データテーブルに未定義サービスのレコードが作成されていないことを検証
    const generatedBillingRecords = result.generatedBillingRecords;
    const recordsForUndefinedService = generatedBillingRecords.filter(
      (record) => record.serviceId === serviceWithoutMappingId
    );
    expect(recordsForUndefinedService.length).toBe(0);

    // 他の正常に定義されたサービスの集計処理は影響を受けていないことを確認
    const recordsForDefinedServices = generatedBillingRecords.filter(
      (record) =>
        record.serviceId === serviceWithMappingId ||
        record.serviceId === serviceNormalId
    );
    expect(recordsForDefinedServices.length).toBe(2);
    expect(recordsForDefinedServices.some((r) => r.serviceId === serviceWithMappingId)).toBe(
      true
    );
    expect(recordsForDefinedServices.some((r) => r.serviceId === serviceNormalId)).toBe(true);

    // 処理結果のメタデータ検証
    expect(result.processedAt).toBeDefined();
    expect(result.status).toBe('partial_success');
    expect(result.totalServicesProcessed).toBe(2);
    expect(result.totalServicesSkipped).toBe(1);
  });
});