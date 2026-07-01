import { extractAndAggregateInvoiceItems } from '../../src/logic/it-1-2-1';

describe('営業成果データから請求対象項目を自動抽出し、顧客ごと・サービスごとの請求額を集計する機能', () => {
  // SCEN-1382: [error] 請求対象項目自動抽出・集計機能 - 検証エラーのある営業データが請求対象から除外される
  test('検証エラーのある営業データは請求対象から完全に除外され、請求額集計は正常なデータのみで計算される', () => {
    // Arrange: 検証エラーフラグ付きと正常なレコードを混在させた営業データを準備
    const salesDataWithErrors = [
      {
        id: 'sales_001',
        customerId: 'cust_A',
        serviceId: 'svc_premium',
        appointmentCount: 10,
        dealCount: 5,
        amount: 50000,
        validationError: false,
        errorMessage: null,
      },
      {
        id: 'sales_002',
        customerId: 'cust_A',
        serviceId: 'svc_premium',
        appointmentCount: 8,
        dealCount: 3,
        amount: 30000,
        validationError: true,
        errorMessage: '必須項目欠落',
      },
      {
        id: 'sales_003',
        customerId: 'cust_B',
        serviceId: 'svc_standard',
        appointmentCount: 15,
        dealCount: 7,
        amount: 70000,
        validationError: false,
        errorMessage: null,
      },
      {
        id: 'sales_004',
        customerId: 'cust_B',
        serviceId: 'svc_standard',
        appointmentCount: 5,
        dealCount: 2,
        amount: 20000,
        validationError: true,
        errorMessage: 'データ型不整合',
      },
      {
        id: 'sales_005',
        customerId: 'cust_A',
        serviceId: 'svc_premium',
        appointmentCount: 12,
        dealCount: 6,
        amount: 60000,
        validationError: false,
        errorMessage: null,
      },
    ];

    // Act: 請求対象項目自動抽出・集計機能を実行
    const result = extractAndAggregateInvoiceItems(salesDataWithErrors);

    // Assert: 検証エラーレコードが除外されていることを確認
    expect(result.extractedRecords.length).toBe(3);
    expect(result.extractedRecords.every((record) => !record.validationError)).toBe(true);
    
    // Assert: 除外されたレコードが正しくエラーログに記録されていることを確認
    expect(result.excludedRecords.length).toBe(2);
    expect(result.excludedRecords.map((r) => r.id)).toEqual(['sales_002', 'sales_004']);
    expect(result.excludedRecords[0]).toEqual({
      id: 'sales_002',
      customerId: 'cust_A',
      serviceId: 'svc_premium',
      appointmentCount: 8,
      dealCount: 3,
      amount: 30000,
      validationError: true,
      errorMessage: '必須項目欠落',
    });
    expect(result.excludedRecords[1]).toEqual({
      id: 'sales_004',
      customerId: 'cust_B',
      serviceId: 'svc_standard',
      appointmentCount: 5,
      dealCount: 2,
      amount: 20000,
      validationError: true,
      errorMessage: 'データ型不整合',
    });

    // Assert: 顧客ごと・サービスごとの請求額集計が正常なデータのみで計算されていることを確認
    const custAServicePremiumRecords = result.aggregatedByCustomerService.find(
      (agg) => agg.customerId === 'cust_A' && agg.serviceId === 'svc_premium'
    );
    expect(custAServicePremiumRecords).toEqual({
      customerId: 'cust_A',
      serviceId: 'svc_premium',
      totalAppointments: 22,
      totalDeals: 11,
      totalAmount: 110000,
      recordCount: 2,
    });

    const custBServiceStandardRecords = result.aggregatedByCustomerService.find(
      (agg) => agg.customerId === 'cust_B' && agg.serviceId === 'svc_standard'
    );
    expect(custBServiceStandardRecords).toEqual({
      customerId: 'cust_B',
      serviceId: 'svc_standard',
      totalAppointments: 15,
      totalDeals: 7,
      totalAmount: 70000,
      recordCount: 1,
    });

    // Assert: 除外されたレコード数が期待値と一致することを確認
    expect(result.totalRecords).toBe(5);
    expect(result.processedRecords).toBe(3);
    expect(result.excludedCount).toBe(2);

    // Assert: 請求額集計結果の合計が検証エラーレコードを除いた金額であることを確認
    const expectedTotalAmount = 50000 + 70000 + 60000;
    expect(result.totalInvoiceAmount).toBe(expectedTotalAmount);
  });
});