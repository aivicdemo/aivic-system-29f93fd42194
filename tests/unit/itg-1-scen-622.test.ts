import { generateMonthlySummary } from '../../src/logic/it-1-br-1781935279444-1-2-1';

describe('月次サマリーテンプレート定義・生成機能', () => {
  test('SCEN-622: 定義済みテンプレートに基づいて月次営業成果データから顧客ごと・サービスごとの請求額と月次サマリーが自動生成される', () => {
    // テンプレート定義: 顧客別・サービス別の集計項目、単価、計算式を含む
    const templateDefinition = {
      templateId: 'tpl_202401',
      templateName: '月次成果サマリー_2024年01月',
      companyId: 'corp_001',
      aggregationLevels: ['customer', 'service'],
      items: [
        {
          itemId: 'item_001',
          itemName: '基本料金',
          dataSourceField: 'base_fee',
          calculationType: 'sum',
          unitPrice: 50000,
          displayOrder: 1,
        },
        {
          itemId: 'item_002',
          itemName: '成果報酬_アポ数',
          dataSourceField: 'appointment_count',
          calculationType: 'multiply',
          unitPrice: 5000,
          displayOrder: 2,
        },
        {
          itemId: 'item_003',
          itemName: '成果報酬_成約数',
          dataSourceField: 'deal_count',
          calculationType: 'multiply',
          unitPrice: 25000,
          displayOrder: 3,
        },
      ],
      discountRule: {
        ruleId: 'disc_001',
        discountRate: 0.1,
        applicableServices: ['service_A', 'service_B'],
      },
      periodStartDate: '2024-01-01',
      periodEndDate: '2024-01-31',
      createdAt: '2024-01-01T00:00:00Z',
      createdBy: 'operator_001',
    };

    // 当月の営業成果データ: 顧客1, サービスA/B と 顧客2, サービスA の組み合わせ
    const monthlySalesData = [
      {
        dataId: 'data_001',
        customerId: 'customer_001',
        customerName: '顧客A株式会社',
        serviceId: 'service_A',
        serviceName: 'サービスA',
        base_fee: 50000,
        appointment_count: 8,
        deal_count: 2,
        recordDate: '2024-01-15',
      },
      {
        dataId: 'data_002',
        customerId: 'customer_001',
        customerName: '顧客A株式会社',
        serviceId: 'service_B',
        serviceName: 'サービスB',
        base_fee: 50000,
        appointment_count: 5,
        deal_count: 1,
        recordDate: '2024-01-20',
      },
      {
        dataId: 'data_003',
        customerId: 'customer_002',
        customerName: '顧客B企業',
        serviceId: 'service_A',
        serviceName: 'サービスA',
        base_fee: 50000,
        appointment_count: 10,
        deal_count: 3,
        recordDate: '2024-01-18',
      },
    ];

    // 月次サマリー自動生成を実行
    const generatedSummary = generateMonthlySummary(
      templateDefinition,
      monthlySalesData
    );

    // 生成されたサマリーが存在することを確認
    expect(generatedSummary).toBeDefined();
    expect(generatedSummary.summaryId).toBeDefined();
    expect(generatedSummary.templateId).toBe('tpl_202401');
    expect(generatedSummary.periodStartDate).toBe('2024-01-01');
    expect(generatedSummary.periodEndDate).toBe('2024-01-31');

    // 生成されたサマリーが顧客ごとに正しく集計されていることを確認
    expect(generatedSummary.customerSummaries).toBeDefined();
    expect(generatedSummary.customerSummaries.length).toBe(2);

    // 顧客1（customer_001）の集計
    const customer1Summary = generatedSummary.customerSummaries.find(
      (s: any) => s.customerId === 'customer_001'
    );
    expect(customer1Summary).toBeDefined();
    expect(customer1Summary.customerName).toBe('顧客A株式会社');
    expect(customer1Summary.serviceSummaries.length).toBe(2);

    // 生成されたサマリーがサービスごとに正しく集計されていることを確認
    // 顧客1 - サービスA: 基本料金 50,000 + アポ報酬 (8 * 5,000) + 成約報酬 (2 * 25,000) = 50,000 + 40,000 + 50,000 = 140,000
    // 割引適用: 140,000 * 0.1 = 14,000 割引
    // 請求額: 140,000 - 14,000 = 126,000
    const customer1ServiceA = customer1Summary.serviceSummaries.find(
      (s: any) => s.serviceId === 'service_A'
    );
    expect(customer1ServiceA).toBeDefined();
    expect(customer1ServiceA.serviceName).toBe('サービスA');
    expect(customer1ServiceA.subtotal).toBe(140000);
    expect(customer1ServiceA.discountAmount).toBe(14000);
    expect(customer1ServiceA.billingAmount).toBe(126000);

    // 顧客1 - サービスB: 基本料金 50,000 + アポ報酬 (5 * 5,000) + 成約報酬 (1 * 25,000) = 50,000 + 25,000 + 25,000 = 100,000
    // 割引適用: 100,000 * 0.1 = 10,000 割引
    // 請求額: 100,000 - 10,000 = 90,000
    const customer1ServiceB = customer1Summary.serviceSummaries.find(
      (s: any) => s.serviceId === 'service_B'
    );
    expect(customer1ServiceB).toBeDefined();
    expect(customer1ServiceB.serviceName).toBe('サービスB');
    expect(customer1ServiceB.subtotal).toBe(100000);
    expect(customer1ServiceB.discountAmount).toBe(10000);
    expect(customer1ServiceB.billingAmount).toBe(90000);

    // 顧客1の合計請求額: 126,000 + 90,000 = 216,000
    expect(customer1Summary.totalBillingAmount).toBe(216000);

    // 顧客2（customer_002）の集計
    const customer2Summary = generatedSummary.customerSummaries.find(
      (s: any) => s.customerId === 'customer_002'
    );
    expect(customer2Summary).toBeDefined();
    expect(customer2Summary.customerName).toBe('顧客B企業');
    expect(customer2Summary.serviceSummaries.length).toBe(1);

    // 顧客2 - サービスA: 基本料金 50,000 + アポ報酬 (10 * 5,000) + 成約報酬 (3 * 25,000) = 50,000 + 50,000 + 75,000 = 175,000
    // 割引適用: 175,000 * 0.1 = 17,500 割引
    // 請求額: 175,000 - 17,500 = 157,500
    const customer2ServiceA = customer2Summary.serviceSummaries.find(
      (s: any) => s.serviceId === 'service_A'
    );
    expect(customer2ServiceA).toBeDefined();
    expect(customer2ServiceA.serviceName).toBe('サービスA');
    expect(customer2ServiceA.subtotal).toBe(175000);
    expect(customer2ServiceA.discountAmount).toBe(17500);
    expect(customer2ServiceA.billingAmount).toBe(157500);

    // 顧客2の合計請求額
    expect(customer2Summary.totalBillingAmount).toBe(157500);

    // 全体の請求額合計: 216,000 + 157,500 = 373,500
    expect(generatedSummary.totalBillingAmount).toBe(373500);

    // 各顧客・サービス組み合わせの請求額が正確に計算されていることを確認
    const allServiceSummaries = generatedSummary.customerSummaries.flatMap(
      (c: any) => c.serviceSummaries
    );
    expect(allServiceSummaries.length).toBe(3);
    allServiceSummaries.forEach((service: any) => {
      expect(service.billingAmount).toBeGreaterThan(0);
      expect(service.discountAmount).toBeGreaterThanOrEqual(0);
      expect(service.subtotal - service.discountAmount).toBe(
        service.billingAmount
      );
    });

    // 生成されたサマリーがテンプレート定義に従った形式で出力されていることを確認
    expect(generatedSummary.itemDetails).toBeDefined();
    expect(generatedSummary.itemDetails.length).toBeGreaterThan(0);
    generatedSummary.itemDetails.forEach((item: any) => {
      expect(item.itemId).toBeDefined();
      expect(item.itemName).toBeDefined();
      expect(item.displayOrder).toBeDefined();
    });

    // 複数顧客・複数サービスの組み合わせが混在する場合でも、データが重複・漏落なく処理されていることを確認
    const processedDataCount = generatedSummary.customerSummaries.reduce(
      (sum: number, c: any) =>
        sum +
        c.serviceSummaries.reduce(
          (serviceSum: number) => serviceSum + 1,
          0
        ),
      0
    );
    expect(processedDataCount).toBe(3); // 元データ3件が正確に処理されたこと

    // 重複チェック: 各 customer-service 組み合わせが一意であることを確認
    const uniqueKeys = new Set(
      generatedSummary.customerSummaries.flatMap((c: any) =>
        c.serviceSummaries.map(
          (s: any) => `${c.customerId}_${s.serviceId}`
        )
      )
    );
    expect(uniqueKeys.size).toBe(3); // 3つの一意な組み合わせ

    // 生成タイムスタンプと生成者情報が記録されていることを確認
    expect(generatedSummary.generatedAt).toBeDefined();
    expect(generatedSummary.generatedBy).toBeDefined();
    expect(generatedSummary.status).toBe('generated');
  });
});