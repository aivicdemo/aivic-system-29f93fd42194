import { aggregateBillingAmount } from '../../src/logic/it-1781935279444-1-1-1';

describe('営業データ項目のメタデータ管理機能 - 請求額自動集計', () => {
  test('SCEN-1175: 請求集計対象の営業データが0件の場合、0円で集計される', () => {
    // Arrange: 営業データが0件の状態でセットアップ
    const emptyAalesDataList: Array<{
      customer_id: string;
      service_id: string;
      appointment_count: number;
      contract_count: number;
      unit_price: number;
    }> = [];

    const aggregationPeriod = {
      start_date: '2024-01-01',
      end_date: '2024-01-31',
    };

    // Act: 請求額自動集計・抽出機能を実行
    const result = aggregateBillingAmount({
      sales_data_list: emptyAalesDataList,
      period: aggregationPeriod,
    });

    // Assert: 集計処理が正常に完了したことを確認
    expect(result).toBeDefined();
    expect(result.status).toBe('success');

    // 集計結果のレコード件数を確認 (0件)
    expect(result.billing_records).toHaveLength(0);

    // 集計結果の請求額を確認 (0円)
    expect(result.total_billing_amount).toBe(0);

    // 集計結果が正常に返却されていることを確認
    expect(result.error_message).toBeUndefined();
  });
});