import { extractBillingTargetItems, aggregateBillingAmount } from '../../src/logic/it-1-2-1';

describe('営業成果データから請求対象項目を自動抽出し、顧客ごと・サービスごとの請求額を集計する機能', () => {
  test('SCEN-1361: 映像対象外とマークされた営業データが集計から除外される', () => {
    // 準備: テストデータの初期化
    const salesData = [
      {
        id: 'SD001',
        customerId: 'CUST001',
        serviceId: 'SVC001',
        appointmentCount: 5,
        contractCount: 2,
        customerFeedback: 'positive',
        videoExcludedFlag: false,
        amount: 10000,
      },
      {
        id: 'SD002',
        customerId: 'CUST001',
        serviceId: 'SVC001',
        appointmentCount: 3,
        contractCount: 1,
        customerFeedback: 'neutral',
        videoExcludedFlag: true,
        amount: 5000,
      },
      {
        id: 'SD003',
        customerId: 'CUST002',
        serviceId: 'SVC002',
        appointmentCount: 4,
        contractCount: 2,
        customerFeedback: 'positive',
        videoExcludedFlag: false,
        amount: 8000,
      },
      {
        id: 'SD004',
        customerId: 'CUST001',
        serviceId: 'SVC002',
        appointmentCount: 2,
        contractCount: 0,
        customerFeedback: 'negative',
        videoExcludedFlag: true,
        amount: 2000,
      },
      {
        id: 'SD005',
        customerId: 'CUST002',
        serviceId: 'SVC001',
        appointmentCount: 6,
        contractCount: 3,
        customerFeedback: 'positive',
        videoExcludedFlag: false,
        amount: 15000,
      },
    ];

    // 請求対象項目の自動抽出を実行
    const extractedItems = extractBillingTargetItems(salesData);

    // 抽出結果の検証: videoExcludedFlag が true のレコードが除外されていることを確認
    expect(extractedItems).toEqual(
      expect.not.arrayContaining([
        expect.objectContaining({ id: 'SD002' }),
        expect.objectContaining({ id: 'SD004' }),
      ])
    );

    // 抽出結果に videoExcludedFlag が false のレコードが含まれていることを確認
    expect(extractedItems).toContainEqual(expect.objectContaining({ id: 'SD001' }));
    expect(extractedItems).toContainEqual(expect.objectContaining({ id: 'SD003' }));
    expect(extractedItems).toContainEqual(expect.objectContaining({ id: 'SD005' }));

    // 抽出後、集計機能を実行
    const aggregatedResult = aggregateBillingAmount(extractedItems);

    // 集計結果の検証: 映像対象外が除外された分を確認
    // 対象: SD001(10000) + SD003(8000) + SD005(15000) = 33000
    // 除外: SD002(5000) + SD004(2000) = 7000 は集計から外される
    expect(aggregatedResult.totalAmount).toBe(33000);

    // 顧客ごとの集計が正確に計算されていることを確認
    // CUST001: SD001 のみ (SD002, SD004 は除外) = 10000
    // CUST002: SD003 + SD005 = 8000 + 15000 = 23000
    const custData = aggregatedResult.byCustomer;
    expect(custData['CUST001']).toEqual({
      customerId: 'CUST001',
      totalAmount: 10000,
      recordCount: 1,
    });
    expect(custData['CUST002']).toEqual({
      customerId: 'CUST002',
      totalAmount: 23000,
      recordCount: 2,
    });

    // サービスごとの集計が正確に計算されていることを確認
    // SVC001: SD001 + SD005 (SD002 は除外) = 10000 + 15000 = 25000
    // SVC002: SD003 のみ (SD004 は除外) = 8000
    const svcData = aggregatedResult.byService;
    expect(svcData['SVC001']).toEqual({
      serviceId: 'SVC001',
      totalAmount: 25000,
      recordCount: 2,
    });
    expect(svcData['SVC002']).toEqual({
      serviceId: 'SVC002',
      totalAmount: 8000,
      recordCount: 1,
    });

    // 映像対象外フラグが true のレコードが集計結果に含まれていないことを最終確認
    const excludedRecordIds = ['SD002', 'SD004'];
    const allAggregatedIds = [
      ...aggregatedResult.byCustomer.flatMap((c: any) =>
        c.recordIds || []
      ),
      ...aggregatedResult.byService.flatMap((s: any) =>
        s.recordIds || []
      ),
    ];
    excludedRecordIds.forEach((excludedId) => {
      expect(allAggregatedIds).not.toContain(excludedId);
    });

    // 映像対象外フラグが false のレコードが集計に含まれていることを最終確認
    expect(extractedItems.length).toBe(3);
    expect(extractedItems.map((item: any) => item.id)).toEqual(
      expect.arrayContaining(['SD001', 'SD003', 'SD005'])
    );
  });
});