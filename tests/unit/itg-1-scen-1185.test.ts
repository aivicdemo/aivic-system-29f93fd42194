import { searchSalesActivityData } from '../../src/logic/it-1781935279444-1-1-1';

describe('営業データ項目メタデータ管理機能 - 営業活動データ検索', () => {
  // SCEN-1185: [edge] 営業活動データ検索・抽出・検証 - 検索条件に合致するデータが存在しない場合、空結果が返される
  test('存在しない検索条件を指定したとき、空の配列と適切なメッセージが返される', () => {
    // 前提: 営業システムに営業データが記録されている
    // 発生条件: 存在しない営業担当者IDと過去の日付範囲を検索条件に設定して検索を実行
    const search_criteria = {
      sales_staff_id: 'NONEXISTENT_STAFF_999',
      start_date: '2020-01-01',
      end_date: '2020-12-31',
      customer_code: 'NONEXISTENT_CUST_001',
    };

    const result = searchSalesActivityData(search_criteria);

    // 結果: 空の配列が返される
    expect(result.data).toEqual([]);

    // 結果: ステータスコード200が返される（エラーではなく正常系）
    expect(result.status_code).toBe(200);

    // 結果: 適切なメッセージが返される
    expect(result.message).toMatch(/該当するデータはありません/);

    // 結果: データ件数が0件と示される
    expect(result.total_count).toBe(0);
  });
});