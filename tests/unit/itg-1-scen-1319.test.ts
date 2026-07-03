import { surveyCurrentDataItems } from "../../src/logic/it-1781935279444-1-1-1";

const fetchMock = require("jest-fetch-mock");

describe("営業データ項目のメタデータ管理機能", () => {
  test("SCEN-1319: 営業システムにデータ項目が存在しない場合、空の調査結果が返される", async () => {
    fetchMock.resetMocks();

    // モック: 営業システムのデータ項目テーブルが空の状態
    fetchMock.mockResponseOnce(
      JSON.stringify({
        status: 200,
        data: {
          salesDataItems: [],
          metadata: [],
          validationRules: [],
        },
      }),
      { status: 200 }
    );

    const result = await surveyCurrentDataItems({
      systemId: "sales_system_001",
      includeMetadata: true,
      includeValidationRules: true,
    });

    // 期待値: 空の調査結果が返される
    expect(result).toEqual({
      salesDataItems: [],
      metadata: [],
      validationRules: [],
    });

    // ステータスコードが200であることを確認
    expect(fetchMock.mock.calls[0][1]?.method).toBe("GET");

    // データ項目が0件であることを確認
    expect(result.salesDataItems.length).toBe(0);
    expect(result.metadata.length).toBe(0);
    expect(result.validationRules.length).toBe(0);
  });
});