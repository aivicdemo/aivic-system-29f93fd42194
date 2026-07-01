import { extractBillingItemsAndAggregate } from '../../src/logic/it-1-2-1';

describe('営業成果データから請求対象項目を自動抽出し、顧客ごと・サービスごとの請求額を集計する機能', () => {
  // SCEN-749: [error] 請求対象項目の自動抽出と請求額集計 - 営業データの請求計算に使用される単価マスタが存在しない場合、集計処理がエラーとして検出される
  test('単価マスタに存在しない商品コードを含む営業データで集計処理を実行した場合、エラーが検出され処理が中断される', () => {
    // テストデータ準備: 単価マスタに存在しない商品コード "PROD-999" を含む営業データ
    const salesData = [
      {
        customer_id: 'CUST-001',
        service_id: 'SVC-001',
        product_code: 'PROD-999', // 単価マスタに存在しない商品コード
        quantity: 5,
        date: '2024-01-15',
      },
    ];

    // 単価マスタ: "PROD-999" は意図的に除外
    const pricemaster = [
      {
        product_code: 'PROD-001',
        unit_price: 10000,
      },
      {
        product_code: 'PROD-002',
        unit_price: 20000,
      },
    ];

    // システムログ記録用のモック
    const systemLogs: Array<{ level: string; message: string; timestamp: string }> = [];

    // 集計処理を実行
    const result = extractBillingItemsAndAggregate(
      {
        sales_data: salesData,
        price_master: pricemaster,
        system_logs: systemLogs,
      },
    );

    // エラーが検出されたことを確認
    expect(result.error).toBeDefined();
    expect(result.error?.message).toMatch(/単価マスタ/);

    // エラーメッセージが適切に表示されていることを検証
    expect(result.error?.message).toMatch(/PROD-999/);

    // システムログにエラー情報が記録されていることを確認
    expect(systemLogs.length).toBeGreaterThan(0);
    const errorLog = systemLogs.find((log) => log.level === 'ERROR');
    expect(errorLog).toBeDefined();
    expect(errorLog?.message).toMatch(/単価マスタ/);

    // 処理が中断されたことを確認 (集計結果が確定していない)
    expect(result.aggregated_billing).toBeNull();
    expect(result.is_processing_halted).toBe(true);

    // 不正な請求額が確定していないことを検証
    expect(result.confirmed_billing_amount).toBeUndefined();
  });
});