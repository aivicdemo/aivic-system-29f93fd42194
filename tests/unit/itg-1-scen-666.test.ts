import { aggregatePerformanceByCustomerAndService } from '../../src/logic/it-1-2-1';

describe('営業成果データから請求対象項目を自動抽出し、顧客ごと・サービスごとの請求額を集計する機能', () => {
  // SCEN-666: [normal] 月次成果指標自動集計機能 - 営業データから顧客ごと・サービスごとの成果指標が自動集計される
  test('should automatically aggregate performance indicators by customer and service from sales data', () => {
    // テスト用営業データ：複数顧客、複数サービス
    const salesData = [
      {
        customerId: 'CUST001',
        customerName: '顧客A',
        serviceId: 'SVC001',
        serviceName: 'サービスX',
        appointmentCount: 5,
        contractCount: 2,
        customerReactionScore: 85,
        transactionDate: '2024-01-15',
      },
      {
        customerId: 'CUST001',
        customerName: '顧客A',
        serviceId: 'SVC001',
        serviceName: 'サービスX',
        appointmentCount: 3,
        contractCount: 1,
        customerReactionScore: 90,
        transactionDate: '2024-01-20',
      },
      {
        customerId: 'CUST001',
        customerName: '顧客A',
        serviceId: 'SVC002',
        serviceName: 'サービスY',
        appointmentCount: 4,
        contractCount: 3,
        customerReactionScore: 78,
        transactionDate: '2024-01-18',
      },
      {
        customerId: 'CUST002',
        customerName: '顧客B',
        serviceId: 'SVC001',
        serviceName: 'サービスX',
        appointmentCount: 6,
        contractCount: 2,
        customerReactionScore: 88,
        transactionDate: '2024-01-10',
      },
      {
        customerId: 'CUST002',
        customerName: '顧客B',
        serviceId: 'SVC002',
        serviceName: 'サービスY',
        appointmentCount: 2,
        contractCount: 1,
        customerReactionScore: 82,
        transactionDate: '2024-01-22',
      },
    ];

    // 自動集計処理を実行
    const result = aggregatePerformanceByCustomerAndService(salesData);

    // 期待値：顧客ごとの成果指標
    // 顧客A合計：アポ数 12(5+3+4)、成約数 6(2+1+3)、顧客反応スコア 84.33((85+90+78)/3)
    // 顧客B合計：アポ数 8(6+2)、成約数 3(2+1)、顧客反応スコア 85((88+82)/2)
    expect(result.byCustomer).toEqual({
      CUST001: {
        customerId: 'CUST001',
        customerName: '顧客A',
        totalAppointmentCount: 12,
        totalContractCount: 6,
        averageCustomerReactionScore: 84.33,
      },
      CUST002: {
        customerId: 'CUST002',
        customerName: '顧客B',
        totalAppointmentCount: 8,
        totalContractCount: 3,
        averageCustomerReactionScore: 85,
      },
    });

    // 期待値：サービスごとの成果指標
    // サービスX：顧客A(5+3=8)、顧客B(6)計14、成約数 5(2+1+2)、反応スコア 87.67((85+90+88)/3)
    // サービスY：顧客A(4)、顧客B(2)計6、成約数 4(3+1)、反応スコア 80((78+82)/2)
    expect(result.byService).toEqual({
      SVC001: {
        serviceId: 'SVC001',
        serviceName: 'サービスX',
        totalAppointmentCount: 14,
        totalContractCount: 5,
        averageCustomerReactionScore: 87.67,
      },
      SVC002: {
        serviceId: 'SVC002',
        serviceName: 'サービスY',
        totalAppointmentCount: 6,
        totalContractCount: 4,
        averageCustomerReactionScore: 80,
      },
    });

    // 期待値：顧客ごと・サービスごとの交差集計
    // CUST001-SVC001：アポ数 8(5+3)、成約数 3(2+1)、反応スコア 87.5((85+90)/2)
    // CUST001-SVC002：アポ数 4、成約数 3、反応スコア 78
    // CUST002-SVC001：アポ数 6、成約数 2、反応スコア 88
    // CUST002-SVC002：アポ数 2、成約数 1、反応スコア 82
    expect(result.byCustomerAndService).toEqual({
      'CUST001-SVC001': {
        customerId: 'CUST001',
        customerName: '顧客A',
        serviceId: 'SVC001',
        serviceName: 'サービスX',
        totalAppointmentCount: 8,
        totalContractCount: 3,
        averageCustomerReactionScore: 87.5,
      },
      'CUST001-SVC002': {
        customerId: 'CUST001',
        customerName: '顧客A',
        serviceId: 'SVC002',
        serviceName: 'サービスY',
        totalAppointmentCount: 4,
        totalContractCount: 3,
        averageCustomerReactionScore: 78,
      },
      'CUST002-SVC001': {
        customerId: 'CUST002',
        customerName: '顧客B',
        serviceId: 'SVC001',
        serviceName: 'サービスX',
        totalAppointmentCount: 6,
        totalContractCount: 2,
        averageCustomerReactionScore: 88,
      },
      'CUST002-SVC002': {
        customerId: 'CUST002',
        customerName: '顧客B',
        serviceId: 'SVC002',
        serviceName: 'サービスY',
        totalAppointmentCount: 2,
        totalContractCount: 1,
        averageCustomerReactionScore: 82,
      },
    });

    // 検証：全体集計値の合計が正確であること
    // 全顧客合計アポ数：20(12+8)
    // 全顧客合計成約数：9(6+3)
    // 全サービス合計アポ数：20(14+6)
    // 全サービス合計成約数：9(5+4)
    expect(result.total).toEqual({
      totalAppointmentCount: 20,
      totalContractCount: 9,
      overallAverageCustomerReactionScore: 84.25,
    });

    // 検証：エクスポート用レポート形式が正確に生成されていること
    expect(result.exportReport).toBeDefined();
    expect(result.exportReport.generatedAt).toBeDefined();
    expect(result.exportReport.periodStart).toBe('2024-01-10');
    expect(result.exportReport.periodEnd).toBe('2024-01-22');
    expect(result.exportReport.customerCount).toBe(2);
    expect(result.exportReport.serviceCount).toBe(2);
    expect(result.exportReport.totalRecords).toBe(5);

    // 検証：エクスポートレポートデータの行数が正確であること
    // ヘッダー1行 + 顧客別4行 + サービス別2行 + 交差集計4行 = 11行
    expect(result.exportReport.csvRows).toBeDefined();
    expect(Array.isArray(result.exportReport.csvRows)).toBe(true);
    expect(result.exportReport.csvRows.length).toBe(11);
  });
});