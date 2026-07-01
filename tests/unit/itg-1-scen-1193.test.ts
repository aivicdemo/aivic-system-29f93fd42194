import { searchSalesActivities } from "../../src/logic/it-1-2-1";

describe("営業成果データから請求対象項目を自動抽出し、顧客ごと・サービスごとの請求額を集計する機能", () => {
  test("SCEN-1193: 検索条件に該当するデータが存在しない場合、空配列が返される", () => {
    // 検索条件として、システムに存在しないデータ値を設定
    const search_params = {
      sales_staff_id: "nonexistent_staff_id_xyz",
      start_date: "2020-01-01",
      end_date: "2020-12-31",
      customer_id: "nonexistent_customer_id_abc"
    };

    // 設定した検索条件で検索処理を実行
    const result = searchSalesActivities(search_params);

    // 返却されたデータの型が配列であることを検証
    expect(Array.isArray(result)).toBe(true);

    // 返却された配列の要素数がゼロであることを検証
    expect(result.length).toBe(0);

    // 返却されたデータが空配列であることを確認
    expect(result).toEqual([]);
  });
});