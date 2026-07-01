import { investigateSalesDataItems } from "../../src/logic/it-1781935279444-1-1-1";

const fetchMock = require("jest-fetch-mock");

describe("営業データ項目のメタデータ管理機能", () => {
  test("SCEN-1346: 営業システムにデータ項目が存在しない場合に空配列が返される", async () => {
    fetchMock.resetMocks();

    const salesSystemUrl = "https://sales-system.example.com/api/data-items";

    fetchMock.mockResponseOnce(JSON.stringify([]), { status: 200 });

    const result = await investigateSalesDataItems({
      salesSystemUrl: salesSystemUrl,
    });

    expect(typeof result).toBe("object");
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBe(0);
    expect(result).toEqual([]);
  });
});