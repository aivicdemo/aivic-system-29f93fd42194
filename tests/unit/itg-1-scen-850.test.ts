import { describe, test, expect } from "@jest/globals";

describe("営業データ項目のメタデータ管理機能", () => {
  test("SCEN-850: 存在しない顧客IDで過去データ検索実行時にデータ検索エラーが発生する", async () => {
    const fetchMock = require("jest-fetch-mock");
    fetchMock.enableMocks();
    fetchMock.resetMocks();

    const { searchHistoricalContractAndBillingData } = await import(
      "../../src/logic/it-1781935279444-1-1-1"
    );

    const nonExistentCustomerId = "CUST-999999";
    const searchStartDate = new Date("2023-01-15T00:00:00Z");
    const searchEndDate = new Date("2024-01-15T00:00:00Z");

    fetchMock.mockResponseOnce(
      JSON.stringify({
        error: "指定された顧客IDが見つかりません",
        statusCode: 404,
      }),
      { status: 404 }
    );

    expect(() =>
      searchHistoricalContractAndBillingData({
        customerId: nonExistentCustomerId,
        startDate: searchStartDate,
        endDate: searchEndDate,
      })
    ).toThrow(/顧客ID/);

    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining(nonExistentCustomerId),
      expect.any(Object)
    );

    expect(fetchMock).toHaveBeenCalledTimes(1);

    fetchMock.disableMocks();
  });
});