import { extractSalesData } from '../../src/logic/it-1-2-1';

describe('営業成果データから請求対象項目を自動抽出し、顧客ごと・サービスごとの請求額を集計する機能', () => {
  // SCEN-1165: [normal] 営業活動データの検索・抽出機能 - 検索条件に該当するデータが存在しない場合、空配列を返す
  test('検索条件に該当するデータが存在しない場合、空配列を返す', () => {
    const search_condition = {
      sales_rep_id: 'NONEXISTENT_REP_ID_999',
      start_date: '2023-01-01',
      end_date: '2023-01-31',
      customer_id: null,
      service_type: null,
    };

    const result = extractSalesData(search_condition);

    expect(Array.isArray(result)).toBe(true);
    expect(result).toEqual([]);
    expect(result.length).toBe(0);
  });
});