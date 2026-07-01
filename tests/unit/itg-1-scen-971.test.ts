import { calculateBillingAmount } from '../../src/logic/it-1-2-1';

describe('営業成果データから請求対象項目を自動抽出し、顧客ごと・サービスごとの請求額を集計する機能', () => {
  // SCEN-971: [normal] 請求額自動計算・検証機能 - 請求対象期間内のすべての営業データが検証対象に含まれて計算される
  test('請求対象期間内のすべての営業データが検証対象に含まれ、期間外データは除外されて請求額が正確に計算される', () => {
    const billing_period_start = '2024-01-01';
    const billing_period_end = '2024-01-31';

    // 期間内のデータ: 3件以上、異なる日付・金額で作成
    const sales_data_within_period = [
      {
        date: '2024-01-05',
        customer_id: 'CUST001',
        service_id: 'SVC_A',
        amount: 100000,
      },
      {
        date: '2024-01-15',
        customer_id: 'CUST001',
        service_id: 'SVC_A',
        amount: 150000,
      },
      {
        date: '2024-01-25',
        customer_id: 'CUST001',
        service_id: 'SVC_A',
        amount: 200000,
      },
    ];

    // 期間外のデータ: 開始日前
    const sales_data_before_period = {
      date: '2023-12-31',
      customer_id: 'CUST001',
      service_id: 'SVC_A',
      amount: 50000,
    };

    // 期間外のデータ: 終了日後
    const sales_data_after_period = {
      date: '2024-02-01',
      customer_id: 'CUST001',
      service_id: 'SVC_A',
      amount: 75000,
    };

    // 計算対象：期間内データのみ（3件の合計）
    const expected_total_amount = 100000 + 150000 + 200000; // 450000

    // 実行：請求額自動計算機能
    const result = calculateBillingAmount({
      billing_period_start,
      billing_period_end,
      sales_data: [
        sales_data_before_period,
        ...sales_data_within_period,
        sales_data_after_period,
      ],
    });

    // 検証1: 計算結果の請求額が期間内データの合計額と一致すること
    expect(result.total_billing_amount).toBe(expected_total_amount);

    // 検証2: 検証対象に含まれたデータレコード数が期間内データの件数と一致すること
    expect(result.validated_records_count).toBe(3);

    // 検証3: 期間内のすべてのレコードが検証対象リストに含まれていることを確認
    expect(result.validated_records).toHaveLength(3);
    expect(result.validated_records).toContainEqual(
      expect.objectContaining({
        date: '2024-01-05',
        customer_id: 'CUST001',
        service_id: 'SVC_A',
        amount: 100000,
      })
    );
    expect(result.validated_records).toContainEqual(
      expect.objectContaining({
        date: '2024-01-15',
        customer_id: 'CUST001',
        service_id: 'SVC_A',
        amount: 150000,
      })
    );
    expect(result.validated_records).toContainEqual(
      expect.objectContaining({
        date: '2024-01-25',
        customer_id: 'CUST001',
        service_id: 'SVC_A',
        amount: 200000,
      })
    );

    // 検証4: 期間外のレコード（開始日前・終了日後）が除外されていることを確認
    expect(result.excluded_records_count).toBe(2);
    expect(result.excluded_records).toHaveLength(2);
    expect(result.excluded_records).toContainEqual(
      expect.objectContaining({
        date: '2023-12-31',
        amount: 50000,
        reason: 'before_period',
      })
    );
    expect(result.excluded_records).toContainEqual(
      expect.objectContaining({
        date: '2024-02-01',
        amount: 75000,
        reason: 'after_period',
      })
    );

    // 検証5: 顧客ごとの請求額が正確に集計されること
    expect(result.billing_by_customer).toEqual({
      CUST001: expected_total_amount,
    });

    // 検証6: サービスごとの請求額が正確に集計されること
    expect(result.billing_by_service).toEqual({
      SVC_A: expected_total_amount,
    });

    // 検証7: 顧客ごと・サービスごとの組み合わせ請求額が正確に集計されること
    expect(result.billing_by_customer_service).toEqual({
      'CUST001_SVC_A': expected_total_amount,
    });

    // 検証8: 検証ステータスが「成功」であること
    expect(result.validation_status).toBe('success');

    // 検証9: エラーが存在しないこと
    expect(result.errors).toHaveLength(0);
  });
});