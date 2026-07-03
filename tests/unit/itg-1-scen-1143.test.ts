import { calculateAndAggregateInvoiceAmounts } from '../../src/logic/it-1-2-1';

describe('営業成果データから請求対象項目を自動抽出し、顧客ごと・サービスごとの請求額を集計する機能', () => {
  test('SCEN-1143: 請求対象外の営業データが集計から除外される', () => {
    // テストデータ: 請求対象のデータ 3 件
    const billableData = [
      {
        dataId: 'data_1001',
        customerId: 'cust_100',
        serviceId: 'svc_200',
        status: '完了',
        invoiceFlag: true,
        amount: 10000,
        quantity: 1,
      },
      {
        dataId: 'data_1002',
        customerId: 'cust_100',
        serviceId: 'svc_201',
        status: '完了',
        invoiceFlag: true,
        amount: 15000,
        quantity: 1,
      },
      {
        dataId: 'data_1003',
        customerId: 'cust_101',
        serviceId: 'svc_200',
        status: '完了',
        invoiceFlag: true,
        amount: 20000,
        quantity: 1,
      },
    ];

    // テストデータ: 請求対象外のデータ 2 件
    const nonBillableData = [
      {
        dataId: 'data_2001',
        customerId: 'cust_100',
        serviceId: 'svc_202',
        status: 'キャンセル',
        invoiceFlag: false,
        amount: 5000,
        quantity: 0,
      },
      {
        dataId: 'data_2002',
        customerId: 'cust_102',
        serviceId: 'svc_203',
        status: 'キャンセル',
        invoiceFlag: false,
        amount: 8000,
        quantity: 0,
      },
    ];

    // 全データを結合（混合状態）
    const allSalesData = [...billableData, ...nonBillableData];

    // 請求額自動計算機能を実行
    const result = calculateAndAggregateInvoiceAmounts({
      salesDataList: allSalesData,
      periodStart: '2024-01-01',
      periodEnd: '2024-01-31',
    });

    // 集計対象データ件数を検証（請求対象 3 件のみ）
    expect(result.aggregatedCount).toBe(3);

    // 集計対象外データが除外されていることを確認
    expect(result.excludedCount).toBe(2);

    // 顧客ごとの請求額集計を検証
    expect(result.invoiceAmountByCustomer).toEqual({
      cust_100: 25000, // data_1001(10000) + data_1002(15000)
      cust_101: 20000, // data_1003(20000)
    });

    // サービスごとの請求額集計を検証
    expect(result.invoiceAmountByService).toEqual({
      svc_200: 30000, // data_1001(10000) + data_1003(20000)
      svc_201: 15000, // data_1002(15000)
    });

    // 請求総額が請求対象データのみで計算されていることを検証
    expect(result.totalInvoiceAmount).toBe(45000); // 10000 + 15000 + 20000

    // 除外されたデータの詳細を確認
    expect(result.excludedDataDetails).toEqual([
      {
        dataId: 'data_2001',
        reason: 'ステータスまたは請求フラグ不適格',
      },
      {
        dataId: 'data_2002',
        reason: 'ステータスまたは請求フラグ不適格',
      },
    ]);

    // 集計処理のステータスが成功であることを検証
    expect(result.status).toBe('success');

    // 集計処理の実行時刻が ISO 文字列であることを検証
    expect(result.executedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/);
  });
});