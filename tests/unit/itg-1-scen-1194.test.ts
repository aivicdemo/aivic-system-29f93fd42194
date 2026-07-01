import { searchSalesActivities } from "../../src/logic/it-1-2-1";

describe("営業成果データから請求対象項目を自動抽出し、顧客ごと・サービスごとの請求額を集計する機能", () => {
  // SCEN-1194: [error] 営業活動データ検索機能 - 期間の開始日が終了日より後の場合、エラーが発生する
  test("期間検索で開始日が終了日より後の場合、エラーが発生する", () => {
    const search_params = {
      start_date: "2024-12-31",
      end_date: "2024-12-01",
    };

    expect(() => searchSalesActivities(search_params)).toThrow(/開始日/);
  });
});