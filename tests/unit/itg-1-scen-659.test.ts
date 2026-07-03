import { validateAndAggregateByCustomerService } from '../../src/logic/it-1781935279444-1-1-1';

describe('営業データ項目のメタデータ管理機能 - 顧客・サービス別集計ルール検証', () => {
  // SCEN-659: [normal] 顧客・サービス別集計ルール検証機能 - 顧客ごと・サービスごとの請求対象データが正確に抽出・集計される
  test('顧客ごと・サービスごとに請求対象データが正確に抽出・集計されること', () => {
    // テストデータ: 複数の顧客レコード
    const testCustomers = [
      { customerId: 'CUST001', customerName: '顧客A' },
      { customerId: 'CUST002', customerName: '顧客B' },
      { customerId: 'CUST003', customerName: '顧客C' }
    ];

    // テストデータ: 各顧客に紐付く複数のサービス
    const testServices = [
      { serviceId: 'SVC001', serviceName: 'サービス1' },
      { serviceId: 'SVC002', serviceName: 'サービス2' },
      { serviceId: 'SVC003', serviceName: 'サービス3' }
    ];

    // テストデータ: 顧客ごと・サービスごとの請求対象データ
    const billableData = [
      // 顧客Aのサービス1: 請求対象額 = 1000 + 2000 + 1500 = 4500
      { customerId: 'CUST001', serviceId: 'SVC001', amount: 1000, isBillable: true },
      { customerId: 'CUST001', serviceId: 'SVC001', amount: 2000, isBillable: true },
      { customerId: 'CUST001', serviceId: 'SVC001', amount: 1500, isBillable: true },
      // 顧客Aのサービス2: 請求対象額 = 3000 + 2500 = 5500
      { customerId: 'CUST001', serviceId: 'SVC002', amount: 3000, isBillable: true },
      { customerId: 'CUST001', serviceId: 'SVC002', amount: 2500, isBillable: true },
      // 顧客Aのサービス3: 請求対象額 = 1200 (請求対象外 0 + 請求対象外 -500 は除外)
      { customerId: 'CUST001', serviceId: 'SVC003', amount: 1200, isBillable: true },
      { customerId: 'CUST001', serviceId: 'SVC003', amount: -500, isBillable: false },
      
      // 顧客Bのサービス1: 請求対象額 = 2000
      { customerId: 'CUST002', serviceId: 'SVC001', amount: 2000, isBillable: true },
      // 顧客Bのサービス2: 請求対象額 = 3500 + 1500 = 5000
      { customerId: 'CUST002', serviceId: 'SVC002', amount: 3500, isBillable: true },
      { customerId: 'CUST002', serviceId: 'SVC002', amount: 1500, isBillable: true },
      // 顧客Bのサービス2: 請求対象外データは除外
      { customerId: 'CUST002', serviceId: 'SVC002', amount: 800, isBillable: false },
      
      // 顧客Cのサービス1: 請求対象額 = 4000
      { customerId: 'CUST003', serviceId: 'SVC001', amount: 4000, isBillable: true },
      // 顧客Cのサービス2: 請求対象額 = 2500
      { customerId: 'CUST003', serviceId: 'SVC002', amount: 2500, isBillable: true },
      // 顧客Cのサービス3: 請求対象額 = 1800
      { customerId: 'CUST003', serviceId: 'SVC003', amount: 1800, isBillable: true }
    ];

    // 集計ルール検証機能を実行
    const result = validateAndAggregateByCustomerService({
      customers: testCustomers,
      services: testServices,
      billableData: billableData
    });

    // 期待値の検証
    expect(result).toBeDefined();
    expect(result.success).toBe(true);
    
    // 顧客Aのサービス1の請求対象データが正確に抽出されたことを確認
    const custA_svc1 = result.aggregations.find(
      (agg) => agg.customerId === 'CUST001' && agg.serviceId === 'SVC001'
    );
    expect(custA_svc1).toBeDefined();
    expect(custA_svc1?.extractedItemCount).toBe(3);
    expect(custA_svc1?.aggregatedAmount).toBe(4500);
    
    // 顧客Aのサービス1の集計額が期待値と一致することを確認
    expect(custA_svc1?.customerName).toBe('顧客A');
    expect(custA_svc1?.serviceName).toBe('サービス1');

    // 顧客Bのサービス2に紐付く請求対象データが正確に抽出されたことを確認
    const custB_svc2 = result.aggregations.find(
      (agg) => agg.customerId === 'CUST002' && agg.serviceId === 'SVC002'
    );
    expect(custB_svc2).toBeDefined();
    // 請求対象のデータのみ: 3500 + 1500 = 5000（isBillable=false の 800 は除外）
    expect(custB_svc2?.extractedItemCount).toBe(2);
    expect(custB_svc2?.aggregatedAmount).toBe(5000);

    // 顧客Bのサービス2の集計額が期待値と一致することを確認
    expect(custB_svc2?.customerName).toBe('顧客B');
    expect(custB_svc2?.serviceName).toBe('サービス2');

    // 顧客C全体の複数サービスの請求対象データが顧客単位で正確に集計されていることを確認
    const custC_svc1 = result.aggregations.find(
      (agg) => agg.customerId === 'CUST003' && agg.serviceId === 'SVC001'
    );
    const custC_svc2 = result.aggregations.find(
      (agg) => agg.customerId === 'CUST003' && agg.serviceId === 'SVC002'
    );
    const custC_svc3 = result.aggregations.find(
      (agg) => agg.customerId === 'CUST003' && agg.serviceId === 'SVC003'
    );
    
    expect(custC_svc1?.aggregatedAmount).toBe(4000);
    expect(custC_svc2?.aggregatedAmount).toBe(2500);
    expect(custC_svc3?.aggregatedAmount).toBe(1800);
    
    // 顧客C全体の集計額: 4000 + 2500 + 1800 = 8300
    const custC_total = result.aggregations
      .filter((agg) => agg.customerId === 'CUST003')
      .reduce((sum, agg) => sum + agg.aggregatedAmount, 0);
    expect(custC_total).toBe(8300);

    // 請求対象外のデータが誤って含まれていないことを確認
    // custA_svc3 の isBillable=false の -500 は含まれていないはず
    const custA_svc3 = result.aggregations.find(
      (agg) => agg.customerId === 'CUST001' && agg.serviceId === 'SVC003'
    );
    expect(custA_svc3?.aggregatedAmount).toBe(1200); // -500 は除外
    expect(custA_svc3?.extractedItemCount).toBe(1);

    // custB_svc2 の isBillable=false の 800 は含まれていないはず
    expect(custB_svc2?.aggregatedAmount).toBe(5000); // 800 は除外

    // 抽出・集計結果がJSON形式で正確に出力されていることを確認
    expect(result.outputFormat).toBe('JSON');
    expect(result.aggregations).toBeInstanceOf(Array);
    expect(result.aggregations.length).toBeGreaterThan(0);

    // 各集計レコードが必須フィールドを持っていることを確認
    result.aggregations.forEach((agg) => {
      expect(agg.customerId).toBeDefined();
      expect(agg.customerName).toBeDefined();
      expect(agg.serviceId).toBeDefined();
      expect(agg.serviceName).toBeDefined();
      expect(agg.extractedItemCount).toBeDefined();
      expect(agg.aggregatedAmount).toBeDefined();
      expect(typeof agg.aggregatedAmount).toBe('number');
    });

    // 全体の集計件数が期待値と一致することを確認
    // 顧客A(3サービス) + 顧客B(2サービス) + 顧客C(3サービス) = 8件
    expect(result.aggregations.length).toBe(8);

    // 全体の合計請求額が期待値と一致することを確認
    // custA: 4500 + 5500 + 1200 = 11200
    // custB: 2000 + 5000 = 7000
    // custC: 4000 + 2500 + 1800 = 8300
    // 合計: 11200 + 7000 + 8300 = 26500
    const totalAmount = result.aggregations.reduce(
      (sum, agg) => sum + agg.aggregatedAmount,
      0
    );
    expect(totalAmount).toBe(26500);

    // 集計ルール検証が成功したことを確認
    expect(result.validationPassed).toBe(true);
    expect(result.errors).toEqual([]);
  });
});