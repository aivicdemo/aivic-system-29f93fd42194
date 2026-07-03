import { extractSalesActivityData } from '../../src/logic/it-1-2-1';

describe('営業成果データから請求対象項目を自動抽出し、顧客ごと・サービスごとの請求額を集計する機能', () => {
  // SCEN-1166: [error] 営業活動データの検索・抽出機能 - 期間指定の開始日が終了日より後の場合、エラーを返す
  test('期間指定の開始日が終了日より後の場合、エラーメッセージを返す', () => {
    const search_params = {
      start_date: '2024-12-31',
      end_date: '2024-12-01',
      customer_id: 'CUST001',
      service_id: 'SRV001'
    };

    expect(() => extractSalesActivityData(search_params)).toThrow(/開始日/);
  });
});