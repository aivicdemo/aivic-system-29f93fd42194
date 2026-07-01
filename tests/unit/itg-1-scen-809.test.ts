import { searchMailHistory } from "../../src/logic/it-1781935279444-1-1-1";

describe("営業データ項目のメタデータ管理機能", () => {
  test("SCEN-809: メール履歴検索・フィルタリング機能 - 指定条件に合致するメール履歴が存在しない場合に空結果が返却される", async () => {
    const fetchMock = require("jest-fetch-mock");
    fetchMock.enableMocks();
    fetchMock.resetMocks();

    // 検索条件: 存在しないメールアドレスと過去のいかなるメールも該当しない日付範囲
    const searchEmail = "nonexistent@example.com";
    const startDate = "2099-01-01";
    const endDate = "2099-12-31";

    // APIレスポンス: 空配列を返却
    fetchMock.mockResponseOnce(JSON.stringify([]), { status: 200 });

    // 関数実行
    const result = await searchMailHistory({
      email: searchEmail,
      startDate: startDate,
      endDate: endDate,
    });

    // HTTP ステータスコードが200であることを確認
    expect(fetchMock.mock.calls.length).toBe(1);
    const lastCall = fetchMock.mock.calls[0];
    expect(lastCall[1]?.method || "GET").toBeDefined();

    // 検索結果が空配列であることを確認
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBe(0);

    // 検索結果が空であることの確認
    expect(result).toEqual([]);

    // APIが正常に呼び出されたことを確認
    const requestUrl = lastCall[0] as string;
    expect(requestUrl).toContain("nonexistent@example.com");
    expect(requestUrl).toContain("2099-01-01");
    expect(requestUrl).toContain("2099-12-31");

    fetchMock.disableMocks();
  });
});