import { generateMonthlySummary } from '../../src/logic/it-1-br-1781935279444-1-2-1';

describe('月次営業成果サマリー自動生成機能', () => {
  // SCEN-899
  test('営業データから顧客ごと・サービスごとの成果指標が正しく集計されレポートに反映される', () => {
    // テストデータ: 複数顧客の営業データを準備
    const salesData = [
      // 顧客A のデータ
      { customerId: 'CUST_A', serviceId: 'SVC_1', revenue: 100000, count: 5, profitRate: 0.20 },
      { customerId: 'CUST_A', serviceId: 'SVC_2', revenue: 150000, count: 8, profitRate: 0.25 },
      { customerId: 'CUST_A', serviceId: 'SVC_3', revenue: 80000, count: 3, profitRate: 0.15 },
      // 顧客B のデータ
      { customerId: 'CUST_B', serviceId: 'SVC_1', revenue: 120000, count: 6, profitRate: 0.18 },
      { customerId: 'CUST_B', serviceId: 'SVC_2', revenue: 200000, count: 10, profitRate: 0.22 },
      { customerId: 'CUST_B', serviceId: 'SVC_3', revenue: 90000, count: 4, profitRate: 0.17 },
      // 顧客C のデータ
      { customerId: 'CUST_C', serviceId: 'SVC_1', revenue: 110000, count: 5, profitRate: 0.19 },
      { customerId: 'CUST_C', serviceId: 'SVC_2', revenue: 160000, count: 9, profitRate: 0.24 },
      { customerId: 'CUST_C', serviceId: 'SVC_3', revenue: 85000, count: 4, profitRate: 0.16 },
    ];

    const reportDate = new Date('2024-01-31');

    // 月次営業成果サマリー自動生成機能を実行
    const result = generateMonthlySummary({
      salesData,
      reportDate,
    });

    // 生成されたレポートから顧客ごとの集計データを抽出して検証
    // 顧客A: 売上合計 = 100000 + 150000 + 80000 = 330000
    //        件数合計 = 5 + 8 + 3 = 16
    //        平均利益率 = (0.20 * 5 + 0.25 * 8 + 0.15 * 3) / 16 = (1 + 2 + 0.45) / 16 = 0.21562...
    const customerASummary = result.customerSummaries.find((c) => c.customerId === 'CUST_A');
    expect(customerASummary).toBeDefined();
    expect(customerASummary.totalRevenue).toBe(330000);
    expect(customerASummary.totalCount).toBe(16);
    expect(parseFloat(customerASummary.avgProfitRate.toFixed(5))).toBe(0.21563);

    // 顧客B: 売上合計 = 120000 + 200000 + 90000 = 410000
    //        件数合計 = 6 + 10 + 4 = 20
    //        平均利益率 = (0.18 * 6 + 0.22 * 10 + 0.17 * 4) / 20 = (1.08 + 2.2 + 0.68) / 20 = 0.198
    const customerBSummary = result.customerSummaries.find((c) => c.customerId === 'CUST_B');
    expect(customerBSummary).toBeDefined();
    expect(customerBSummary.totalRevenue).toBe(410000);
    expect(customerBSummary.totalCount).toBe(20);
    expect(parseFloat(customerBSummary.avgProfitRate.toFixed(3))).toBe(0.198);

    // 顧客C: 売上合計 = 110000 + 160000 + 85000 = 355000
    //        件数合計 = 5 + 9 + 4 = 18
    //        平均利益率 = (0.19 * 5 + 0.24 * 9 + 0.16 * 4) / 18 = (0.95 + 2.16 + 0.64) / 18 = 0.19833...
    const customerCSummary = result.customerSummaries.find((c) => c.customerId === 'CUST_C');
    expect(customerCSummary).toBeDefined();
    expect(customerCSummary.totalRevenue).toBe(355000);
    expect(customerCSummary.totalCount).toBe(18);
    expect(parseFloat(customerCSummary.avgProfitRate.toFixed(5))).toBe(0.19833);

    // 生成されたレポートからサービスごとの集計データを抽出して検証
    // サービス1: 売上合計 = 100000 + 120000 + 110000 = 330000
    //            件数合計 = 5 + 6 + 5 = 16
    //            平均利益率 = (0.20 * 5 + 0.18 * 6 + 0.19 * 5) / 16 = (1 + 1.08 + 0.95) / 16 = 0.19031...
    const service1Summary = result.serviceSummaries.find((s) => s.serviceId === 'SVC_1');
    expect(service1Summary).toBeDefined();
    expect(service1Summary.totalRevenue).toBe(330000);
    expect(service1Summary.totalCount).toBe(16);
    expect(parseFloat(service1Summary.avgProfitRate.toFixed(5))).toBe(0.19031);

    // サービス2: 売上合計 = 150000 + 200000 + 160000 = 510000
    //            件数合計 = 8 + 10 + 9 = 27
    //            平均利益率 = (0.25 * 8 + 0.22 * 10 + 0.24 * 9) / 27 = (2 + 2.2 + 2.16) / 27 = 0.23407...
    const service2Summary = result.serviceSummaries.find((s) => s.serviceId === 'SVC_2');
    expect(service2Summary).toBeDefined();
    expect(service2Summary.totalRevenue).toBe(510000);
    expect(service2Summary.totalCount).toBe(27);
    expect(parseFloat(service2Summary.avgProfitRate.toFixed(5))).toBe(0.23407);

    // サービス3: 売上合計 = 80000 + 90000 + 85000 = 255000
    //            件数合計 = 3 + 4 + 4 = 11
    //            平均利益率 = (0.15 * 3 + 0.17 * 4 + 0.16 * 4) / 11 = (0.45 + 0.68 + 0.64) / 11 = 0.16090...
    const service3Summary = result.serviceSummaries.find((s) => s.serviceId === 'SVC_3');
    expect(service3Summary).toBeDefined();
    expect(service3Summary.totalRevenue).toBe(255000);
    expect(service3Summary.totalCount).toBe(11);
    expect(parseFloat(service3Summary.avgProfitRate.toFixed(5))).toBe(0.16091);

    // 顧客×サービス組み合わせごとの成果指標が正しく集計されていることを検証
    const custAServ1 = result.customerServiceCombinations.find(
      (cs) => cs.customerId === 'CUST_A' && cs.serviceId === 'SVC_1'
    );
    expect(custAServ1).toBeDefined();
    expect(custAServ1.revenue).toBe(100000);
    expect(custAServ1.count).toBe(5);
    expect(custAServ1.profitRate).toBe(0.20);

    const custBServ2 = result.customerServiceCombinations.find(
      (cs) => cs.customerId === 'CUST_B' && cs.serviceId === 'SVC_2'
    );
    expect(custBServ2).toBeDefined();
    expect(custBServ2.revenue).toBe(200000);
    expect(custBServ2.count).toBe(10);
    expect(custBServ2.profitRate).toBe(0.22);

    const custCServ3 = result.customerServiceCombinations.find(
      (cs) => cs.customerId === 'CUST_C' && cs.serviceId === 'SVC_3'
    );
    expect(custCServ3).toBeDefined();
    expect(custCServ3.revenue).toBe(85000);
    expect(custCServ3.count).toBe(4);
    expect(custCServ3.profitRate).toBe(0.16);

    // レポートに表示される日付が当月の月末日となっていることを確認
    expect(result.reportDate).toEqual(new Date('2024-01-31'));

    // 全体売上合計の検証: 330000 + 410000 + 355000 = 1095000
    expect(result.totalRevenue).toBe(1095000);

    // 全体件数合計の検証: 16 + 20 + 18 = 54
    expect(result.totalCount).toBe(54);

    // 顧客サマリー数が正しいことを検証 (3顧客)
    expect(result.customerSummaries.length).toBe(3);

    // サービスサマリー数が正しいことを検証 (3サービス)
    expect(result.serviceSummaries.length).toBe(3);

    // 顧客×サービス組み合わせ数が正しいことを検証 (3 * 3 = 9)
    expect(result.customerServiceCombinations.length).toBe(9);
  });
});