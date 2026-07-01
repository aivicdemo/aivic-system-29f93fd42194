import { searchMaterials } from "../../src/logic/it-1-1-1";

describe("営業成果データの自動検証ルール定義と異常検出機能", () => {
  // SCEN-779
  test("検索結果が0件の場合、空配列が正確に返却される", async () => {
    const searchCondition = {
      keyword: "存在しないキーワード_xyz123",
      customerId: "CUST_001",
      documentType: "contract",
      dateFrom: "2024-01-01",
      dateTo: "2024-12-31",
    };

    const result = await searchMaterials(searchCondition);

    // 返却されたデータが配列型であることを確認
    expect(Array.isArray(result)).toBe(true);

    // 返却された配列が空配列であることを検証
    expect(result).toEqual([]);

    // 配列の length プロパティが 0 であることを検証
    expect(result.length).toBe(0);

    // null や undefined ではなく、厳密に空配列であることを確認
    expect(result).not.toBe(null);
    expect(result).not.toBe(undefined);

    // 返却値が空文字列やその他の不正な値でないことを確認
    expect(typeof result).toBe("object");
    expect(result instanceof Array).toBe(true);
  });
});