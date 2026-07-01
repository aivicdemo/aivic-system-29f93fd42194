import { extractBillableItems } from '../../src/logic/it-1781935279444-1-1-1';

describe('営業データ項目のメタデータ管理機能 - 請求対象項目の自動抽出・集計', () => {
  test('SCEN-1007: 営業データから請求対象項目の自動抽出・集計 - 顧客ごと・サービスごとの請求額が正確に集計・出力される', () => {
    // 前提: テストデータベースに複数の顧客と複数のサービスが登録されている状態
    const salesDataInput = [
      {
        customerId: 'CUST_A',
        customerName: '顧客A',
        serviceId: 'SVC_X',
        serviceName: 'サービスX',
        usageCount: 5,
        unitPrice: 1000,
        totalAmount: 5000,
        recordDate: '2024-01-15',
      },
      {
        customerId: 'CUST_A',
        customerName: '顧客A',
        serviceId: 'SVC_Y',
        serviceName: 'サービスY',
        usageCount: 3,
        unitPrice: 1500,
        totalAmount: 4500,
        recordDate: '2024-01-16',
      },
      {
        customerId: 'CUST_B',
        customerName: '顧客B',
        serviceId: 'SVC_X',
        serviceName: 'サービスX',
        usageCount: 2,
        unitPrice: 1000,
        totalAmount: 2000,
        recordDate: '2024-01-15',
      },
      {
        customerId: 'CUST_B',
        customerName: '顧客B',
        serviceId: 'SVC_Z',
        serviceName: 'サービスZ',
        usageCount: 4,
        unitPrice: 2000,
        totalAmount: 8000,
        recordDate: '2024-01-17',
      },
      {
        customerId: 'CUST_C',
        customerName: '顧客C',
        serviceId: 'SVC_Y',
        serviceName: 'サービスY',
        usageCount: 6,
        unitPrice: 1500,
        totalAmount: 9000,
        recordDate: '2024-01-16',
      },
      {
        customerId: 'CUST_C',
        customerName: '顧客C',
        serviceId: 'SVC_Z',
        serviceName: 'サービスZ',
        usageCount: 1,
        unitPrice: 2000,
        totalAmount: 2000,
        recordDate: '2024-01-17',
      },
    ];

    // 手順: 営業データから請求対象項目の自動抽出機能を実行する
    const extractionResult = extractBillableItems(salesDataInput);

    // 確認: 抽出されたデータが正確に顧客ごとに分類されていることを確認する
    expect(extractionResult.byCustomer).toEqual({
      CUST_A: {
        customerId: 'CUST_A',
        customerName: '顧客A',
        totalAmount: 9500,
        serviceBreakdown: [
          {
            serviceId: 'SVC_X',
            serviceName: 'サービスX',
            totalUsageCount: 5,
            totalAmount: 5000,
          },
          {
            serviceId: 'SVC_Y',
            serviceName: 'サービスY',
            totalUsageCount: 3,
            totalAmount: 4500,
          },
        ],
      },
      CUST_B: {
        customerId: 'CUST_B',
        customerName: '顧客B',
        totalAmount: 10000,
        serviceBreakdown: [
          {
            serviceId: 'SVC_X',
            serviceName: 'サービスX',
            totalUsageCount: 2,
            totalAmount: 2000,
          },
          {
            serviceId: 'SVC_Z',
            serviceName: 'サービスZ',
            totalUsageCount: 4,
            totalAmount: 8000,
          },
        ],
      },
      CUST_C: {
        customerId: 'CUST_C',
        customerName: '顧客C',
        totalAmount: 11000,
        serviceBreakdown: [
          {
            serviceId: 'SVC_Y',
            serviceName: 'サービスY',
            totalUsageCount: 6,
            totalAmount: 9000,
          },
          {
            serviceId: 'SVC_Z',
            serviceName: 'サービスZ',
            totalUsageCount: 1,
            totalAmount: 2000,
          },
        ],
      },
    });

    // 確認: 抽出されたデータがサービスごとに分類されていることを確認する
    expect(extractionResult.byService).toEqual({
      SVC_X: {
        serviceId: 'SVC_X',
        serviceName: 'サービスX',
        totalAmount: 7000,
        customerBreakdown: [
          {
            customerId: 'CUST_A',
            customerName: '顧客A',
            totalUsageCount: 5,
            totalAmount: 5000,
          },
          {
            customerId: 'CUST_B',
            customerName: '顧客B',
            totalUsageCount: 2,
            totalAmount: 2000,
          },
        ],
      },
      SVC_Y: {
        serviceId: 'SVC_Y',
        serviceName: 'サービスY',
        totalAmount: 13500,
        customerBreakdown: [
          {
            customerId: 'CUST_A',
            customerName: '顧客A',
            totalUsageCount: 3,
            totalAmount: 4500,
          },
          {
            customerId: 'CUST_C',
            customerName: '顧客C',
            totalUsageCount: 6,
            totalAmount: 9000,
          },
        ],
      },
      SVC_Z: {
        serviceId: 'SVC_Z',
        serviceName: 'サービスZ',
        totalAmount: 10000,
        customerBreakdown: [
          {
            customerId: 'CUST_B',
            customerName: '顧客B',
            totalUsageCount: 4,
            totalAmount: 8000,
          },
          {
            customerId: 'CUST_C',
            customerName: '顧客C',
            totalUsageCount: 1,
            totalAmount: 2000,
          },
        ],
      },
    });

    // 確認: 各顧客・サービス組み合わせの利用回数または利用料金が正確に集計されていることを確認する
    expect(extractionResult.details).toEqual([
      {
        customerId: 'CUST_A',
        customerName: '顧客A',
        serviceId: 'SVC_X',
        serviceName: 'サービスX',
        totalUsageCount: 5,
        totalAmount: 5000,
      },
      {
        customerId: 'CUST_A',
        customerName: '顧客A',
        serviceId: 'SVC_Y',
        serviceName: 'サービスY',
        totalUsageCount: 3,
        totalAmount: 4500,
      },
      {
        customerId: 'CUST_B',
        customerName: '顧客B',
        serviceId: 'SVC_X',
        serviceName: 'サービスX',
        totalUsageCount: 2,
        totalAmount: 2000,
      },
      {
        customerId: 'CUST_B',
        customerName: '顧客B',
        serviceId: 'SVC_Z',
        serviceName: 'サービスZ',
        totalUsageCount: 4,
        totalAmount: 8000,
      },
      {
        customerId: 'CUST_C',
        customerName: '顧客C',
        serviceId: 'SVC_Y',
        serviceName: 'サービスY',
        totalUsageCount: 6,
        totalAmount: 9000,
      },
      {
        customerId: 'CUST_C',
        customerName: '顧客C',
        serviceId: 'SVC_Z',
        serviceName: 'サービスZ',
        totalUsageCount: 1,
        totalAmount: 2000,
      },
    ]);

    // 確認: 複数顧客・複数サービスの請求集計結果をCSVまたはJSON形式で出力する
    const csvOutput = extractionResult.exportAsCSV();
    expect(csvOutput).toContain('customerId,customerName,serviceId,serviceName,totalUsageCount,totalAmount');
    expect(csvOutput).toContain('CUST_A,顧客A,SVC_X,サービスX,5,5000');
    expect(csvOutput).toContain('CUST_A,顧客A,SVC_Y,サービスY,3,4500');
    expect(csvOutput).toContain('CUST_B,顧客B,SVC_X,サービスX,2,2000');
    expect(csvOutput).toContain('CUST_B,顧客B,SVC_Z,サービスZ,4,8000');
    expect(csvOutput).toContain('CUST_C,顧客C,SVC_Y,サービスY,6,9000');
    expect(csvOutput).toContain('CUST_C,顧客C,SVC_Z,サービスZ,1,2000');

    // 確認: 出力ファイルの形式が正しく、データが破損していないことを確認する
    const jsonOutput = extractionResult.exportAsJSON();
    expect(jsonOutput).toEqual({
      extractedAt: expect.any(String),
      summary: {
        totalCustomers: 3,
        totalServices: 3,
        grandTotalAmount: 30500,
      },
      details: extractionResult.details,
    });

    // 確認: 総額の検証 (顧客A: 9500, 顧客B: 10000, 顧客C: 11000)
    const customerTotalAmount = Object.values(extractionResult.byCustomer)
      .reduce((sum: number, customer: any) => sum + customer.totalAmount, 0);
    expect(customerTotalAmount).toBe(30500);

    // 確認: サービスごとの総額の検証 (SVC_X: 7000, SVC_Y: 13500, SVC_Z: 10000)
    const serviceTotalAmount = Object.values(extractionResult.byService)
      .reduce((sum: number, service: any) => sum + service.totalAmount, 0);
    expect(serviceTotalAmount).toBe(30500);

    // 確認: 顧客・サービスの組み合わせ数が正確であることを確認する
    expect(extractionResult.details.length).toBe(6);

    // 確認: 出力結果が空でないことと、すべてのレコードが有効なデータを含むことを確認する
    extractionResult.details.forEach((record: any) => {
      expect(record.customerId).toBeTruthy();
      expect(record.customerName).toBeTruthy();
      expect(record.serviceId).toBeTruthy();
      expect(record.serviceName).toBeTruthy();
      expect(record.totalUsageCount).toBeGreaterThan(0);
      expect(record.totalAmount).toBeGreaterThan(0);
    });
  });
});