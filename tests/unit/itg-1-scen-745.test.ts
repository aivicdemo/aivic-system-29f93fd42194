import { extractAndAggregateChargeItems } from '../../src/logic/it-1-2-1';

describe('営業成果データから請求対象項目を自動抽出し、顧客ごと・サービスごとの請求額を集計する機能', () => {
  // SCEN-745: [normal] 請求対象項目の自動抽出と請求額集計 - 月次締め日に営業データから請求ルールに基づいて請求対象項目が自動判定・抽出され、顧客ごと・サービスごとの請求額が集計される
  test('月次締め日に営業データから請求ルールに基づいて請求対象項目が自動判定・抽出され、顧客ごと・サービスごとの請求額が正しく集計される', () => {
    // 営業データ: 複数顧客の営業データ（サービス利用履歴、利用数量、単価）
    const salesData = [
      {
        customerId: 'CUST-001',
        customerName: '顧客A',
        serviceId: 'SVC-001',
        serviceName: 'コンサルティングサービス',
        usageAmount: 1500,
        unitPrice: 100,
        contractStatus: 'active',
        contractStartDate: '2024-01-01',
        contractEndDate: '2024-12-31',
        quantity: 15,
      },
      {
        customerId: 'CUST-001',
        customerName: '顧客A',
        serviceId: 'SVC-002',
        serviceName: 'システム保守サービス',
        usageAmount: 800,
        unitPrice: 50,
        contractStatus: 'active',
        contractStartDate: '2024-01-01',
        contractEndDate: '2024-12-31',
        quantity: 16,
      },
      {
        customerId: 'CUST-002',
        customerName: '顧客B',
        serviceId: 'SVC-001',
        serviceName: 'コンサルティングサービス',
        usageAmount: 2000,
        unitPrice: 100,
        contractStatus: 'active',
        contractStartDate: '2024-01-01',
        contractEndDate: '2024-12-31',
        quantity: 20,
      },
      {
        customerId: 'CUST-003',
        customerName: '顧客C',
        serviceId: 'SVC-003',
        serviceName: 'トレーニングサービス',
        usageAmount: 500,
        unitPrice: 80,
        contractStatus: 'suspended',
        contractStartDate: '2024-01-01',
        contractEndDate: '2024-12-31',
        quantity: 6,
      },
    ];

    // 請求ルール設定
    const chargeRules = {
      minimumChargeAmount: 1000,
      activeContractStatusOnly: true,
      discountThreshold: 2000,
      discountRate: 0.1,
    };

    // 期待される請求対象項目と集計結果
    // CUST-001, SVC-001: usageAmount=1500 >= 1000, contractStatus=active → 対象
    //   usageAmount * (1 - discount) = 1500 * (1 - 0) = 1500 (2000未満なので割引なし)
    // CUST-001, SVC-002: usageAmount=800 < 1000 → 対象外
    // CUST-002, SVC-001: usageAmount=2000 >= 1000, contractStatus=active → 対象
    //   usageAmount * (1 - discount) = 2000 * (1 - 0.1) = 1800 (2000以上なので割引10%適用)
    // CUST-003, SVC-003: contractStatus=suspended → 対象外

    const expectedChargeSummary = {
      chargeItems: [
        {
          customerId: 'CUST-001',
          customerName: '顧客A',
          serviceId: 'SVC-001',
          serviceName: 'コンサルティングサービス',
          chargeAmount: 1500,
          discountApplied: false,
          status: 'chargeable',
        },
        {
          customerId: 'CUST-002',
          customerName: '顧客B',
          serviceId: 'SVC-001',
          serviceName: 'コンサルティングサービス',
          chargeAmount: 1800,
          discountApplied: true,
          status: 'chargeable',
        },
      ],
      aggregation: [
        {
          customerId: 'CUST-001',
          customerName: '顧客A',
          totalCharge: 1500,
          itemCount: 1,
        },
        {
          customerId: 'CUST-002',
          customerName: '顧客B',
          totalCharge: 1800,
          itemCount: 1,
        },
      ],
      totalAmount: 3300,
      monthClosureDate: '2024-01-31',
    };

    // 関数実行
    const result = extractAndAggregateChargeItems({
      salesData,
      chargeRules,
      monthClosureDate: new Date('2024-01-31'),
    });

    // 請求対象項目の正確性検証
    expect(result.chargeItems).toHaveLength(2);
    expect(result.chargeItems[0]).toEqual({
      customerId: 'CUST-001',
      customerName: '顧客A',
      serviceId: 'SVC-001',
      serviceName: 'コンサルティングサービス',
      chargeAmount: 1500,
      discountApplied: false,
      status: 'chargeable',
    });
    expect(result.chargeItems[1]).toEqual({
      customerId: 'CUST-002',
      customerName: '顧客B',
      serviceId: 'SVC-001',
      serviceName: 'コンサルティングサービス',
      chargeAmount: 1800,
      discountApplied: true,
      status: 'chargeable',
    });

    // 顧客ごとの集計結果検証
    expect(result.aggregation).toHaveLength(2);
    expect(result.aggregation[0]).toEqual({
      customerId: 'CUST-001',
      customerName: '顧客A',
      totalCharge: 1500,
      itemCount: 1,
    });
    expect(result.aggregation[1]).toEqual({
      customerId: 'CUST-002',
      customerName: '顧客B',
      totalCharge: 1800,
      itemCount: 1,
    });

    // 合計請求額の検証
    expect(result.totalAmount).toBe(3300);

    // 月次締め日の記録検証
    expect(result.monthClosureDate).toBe('2024-01-31');

    // 請求ルール適用の検証
    expect(result.chargeItems[0].discountApplied).toBe(false);
    expect(result.chargeItems[1].discountApplied).toBe(true);

    // ステータス確認
    expect(result.chargeItems.every((item) => item.status === 'chargeable')).toBe(true);

    // 入力値の営業データと期待値の一貫性検証
    expect(result.chargeItems[0].chargeAmount).toBe(1500);
    expect(result.chargeItems[1].chargeAmount).toBe(1800);
  });
});