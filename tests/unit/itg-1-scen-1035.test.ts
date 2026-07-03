import { extractBillingItems, aggregateBillingByCustomerAndService } from '../../src/logic/it-1-2-1';

describe('営業成果データから請求対象項目を自動抽出し、顧客ごと・サービスごとの請求額を集計する機能', () => {
  // SCEN-1035: [normal] 営業データから請求対象項目の自動抽出と請求額集計 - 複数顧客・複数サービスの営業データから請求対象項目を正確に抽出し、顧客別・サービス別に集計される
  test('複数顧客・複数サービスの営業データから請求対象項目が正確に自動抽出され、顧客別およびサービス別に正確に分類・集計された請求データが生成される', () => {
    // テスト用の複数顧客・複数サービスを含む営業データセット
    const salesData = [
      {
        id: 'sd_001',
        customerId: 'cust_A',
        serviceId: 'svc_001',
        appointmentCount: 5,
        contractCount: 2,
        amount: 100000,
        billingTargetFlag: true,
        excludeFlag: false,
        recordedDate: '2024-01-15',
      },
      {
        id: 'sd_002',
        customerId: 'cust_A',
        serviceId: 'svc_002',
        appointmentCount: 3,
        contractCount: 1,
        amount: 50000,
        billingTargetFlag: true,
        excludeFlag: false,
        recordedDate: '2024-01-16',
      },
      {
        id: 'sd_003',
        customerId: 'cust_B',
        serviceId: 'svc_001',
        appointmentCount: 8,
        contractCount: 3,
        amount: 150000,
        billingTargetFlag: true,
        excludeFlag: false,
        recordedDate: '2024-01-17',
      },
      {
        id: 'sd_004',
        customerId: 'cust_B',
        serviceId: 'svc_003',
        appointmentCount: 2,
        contractCount: 0,
        amount: 25000,
        billingTargetFlag: true,
        excludeFlag: false,
        recordedDate: '2024-01-18',
      },
      {
        id: 'sd_005',
        customerId: 'cust_A',
        serviceId: 'svc_001',
        appointmentCount: 4,
        contractCount: 1,
        amount: 80000,
        billingTargetFlag: true,
        excludeFlag: false,
        recordedDate: '2024-01-19',
      },
      {
        id: 'sd_006',
        customerId: 'cust_C',
        serviceId: 'svc_002',
        appointmentCount: 6,
        contractCount: 2,
        amount: 120000,
        billingTargetFlag: true,
        excludeFlag: false,
        recordedDate: '2024-01-20',
      },
      {
        id: 'sd_007',
        customerId: 'cust_A',
        serviceId: 'svc_001',
        appointmentCount: 5,
        contractCount: 2,
        amount: 100000,
        billingTargetFlag: true,
        excludeFlag: false,
        recordedDate: '2024-01-21',
      },
      {
        id: 'sd_008',
        customerId: 'cust_B',
        serviceId: 'svc_001',
        appointmentCount: 1,
        contractCount: 0,
        amount: 10000,
        billingTargetFlag: false,
        excludeFlag: false,
        recordedDate: '2024-01-22',
      },
      {
        id: 'sd_009',
        customerId: 'cust_C',
        serviceId: 'svc_003',
        appointmentCount: 3,
        contractCount: 1,
        amount: 60000,
        billingTargetFlag: true,
        excludeFlag: true,
        recordedDate: '2024-01-23',
      },
    ];

    // 請求対象項目の自動抽出処理を実行
    const extractedItems = extractBillingItems(salesData);

    // 抽出された請求対象項目が正確に識別されていることを確認
    expect(extractedItems).toBeDefined();
    expect(Array.isArray(extractedItems)).toBe(true);
    expect(extractedItems.length).toBe(7);

    // 抽出されたアイテムが billingTargetFlag=true かつ excludeFlag=false のみであることを確認
    extractedItems.forEach((item) => {
      expect(item.billingTargetFlag).toBe(true);
      expect(item.excludeFlag).toBe(false);
    });

    // 除外対象データが適切に除外されていることを確認
    const excludedIds = extractedItems.map((item) => item.id);
    expect(excludedIds).toContain('sd_001');
    expect(excludedIds).toContain('sd_002');
    expect(excludedIds).toContain('sd_003');
    expect(excludedIds).toContain('sd_004');
    expect(excludedIds).toContain('sd_005');
    expect(excludedIds).toContain('sd_006');
    expect(excludedIds).toContain('sd_007');
    expect(excludedIds).not.toContain('sd_008');
    expect(excludedIds).not.toContain('sd_009');

    // 顧客別・サービス別に集計された請求データが生成されることを確認
    const aggregatedData = aggregateBillingByCustomerAndService(extractedItems);

    expect(aggregatedData).toBeDefined();
    expect(typeof aggregatedData).toBe('object');
    expect(Array.isArray(aggregatedData.byCustomer)).toBe(true);
    expect(Array.isArray(aggregatedData.byService)).toBe(true);

    // 顧客別の集計データを検証
    const customerAggregation = aggregatedData.byCustomer;
    expect(customerAggregation.length).toBe(3);

    const custAData = customerAggregation.find((c) => c.customerId === 'cust_A');
    expect(custAData).toBeDefined();
    expect(custAData.totalAmount).toBe(330000);
    expect(custAData.totalAppointmentCount).toBe(17);
    expect(custAData.totalContractCount).toBe(6);
    expect(custAData.recordCount).toBe(3);

    const custBData = customerAggregation.find((c) => c.customerId === 'cust_B');
    expect(custBData).toBeDefined();
    expect(custBData.totalAmount).toBe(150000);
    expect(custBData.totalAppointmentCount).toBe(8);
    expect(custBData.totalContractCount).toBe(3);
    expect(custBData.recordCount).toBe(1);

    const custCData = customerAggregation.find((c) => c.customerId === 'cust_C');
    expect(custCData).toBeDefined();
    expect(custCData.totalAmount).toBe(120000);
    expect(custCData.totalAppointmentCount).toBe(6);
    expect(custCData.totalContractCount).toBe(2);
    expect(custCData.recordCount).toBe(1);

    // サービス別の集計データを検証
    const serviceAggregation = aggregatedData.byService;
    expect(serviceAggregation.length).toBe(3);

    const svc001Data = serviceAggregation.find((s) => s.serviceId === 'svc_001');
    expect(svc001Data).toBeDefined();
    expect(svc001Data.totalAmount).toBe(280000);
    expect(svc001Data.totalAppointmentCount).toBe(17);
    expect(svc001Data.totalContractCount).toBe(6);
    expect(svc001Data.recordCount).toBe(3);

    const svc002Data = serviceAggregation.find((s) => s.serviceId === 'svc_002');
    expect(svc002Data).toBeDefined();
    expect(svc002Data.totalAmount).toBe(170000);
    expect(svc002Data.totalAppointmentCount).toBe(9);
    expect(svc002Data.totalContractCount).toBe(3);
    expect(svc002Data.recordCount).toBe(2);

    const svc003Data = serviceAggregation.find((s) => s.serviceId === 'svc_003');
    expect(svc003Data).toBeDefined();
    expect(svc003Data.totalAmount).toBe(25000);
    expect(svc003Data.totalAppointmentCount).toBe(2);
    expect(svc003Data.totalContractCount).toBe(0);
    expect(svc003Data.recordCount).toBe(1);

    // 重複排除処理が正常に機能していることを確認
    const uniqueRecordIds = new Set(extractedItems.map((item) => item.id));
    expect(uniqueRecordIds.size).toBe(extractedItems.length);

    // 集計結果が期待値と一致することを最終検証
    const totalAmountFromAggregation = customerAggregation.reduce(
      (sum, c) => sum + c.totalAmount,
      0
    );
    const expectedTotalAmount = 600000;
    expect(totalAmountFromAggregation).toBe(expectedTotalAmount);

    const totalAmountFromService = serviceAggregation.reduce(
      (sum, s) => sum + s.totalAmount,
      0
    );
    expect(totalAmountFromService).toBe(expectedTotalAmount);

    const totalAppointmentsFromAggregation = customerAggregation.reduce(
      (sum, c) => sum + c.totalAppointmentCount,
      0
    );
    const expectedTotalAppointments = 31;
    expect(totalAppointmentsFromAggregation).toBe(expectedTotalAppointments);

    const totalContractsFromAggregation = customerAggregation.reduce(
      (sum, c) => sum + c.totalContractCount,
      0
    );
    const expectedTotalContracts = 11;
    expect(totalContractsFromAggregation).toBe(expectedTotalContracts);

    // 顧客別とサービス別の集計の整合性確認
    const totalRecordsFromCustomer = customerAggregation.reduce(
      (sum, c) => sum + c.recordCount,
      0
    );
    const totalRecordsFromService = serviceAggregation.reduce(
      (sum, s) => sum + s.recordCount,
      0
    );
    expect(totalRecordsFromCustomer).toBe(totalRecordsFromService);
    expect(totalRecordsFromCustomer).toBe(7);
  });
});