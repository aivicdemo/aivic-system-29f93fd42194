import { searchSalesActivities } from "../../src/logic/it-1-2-1";

describe("営業活動データ検索機能", () => {
  test("SCEN-1195: 存在しない顧客IDで検索した場合、空配列が返される", () => {
    const nonExistentCustomerId = "CUST-99999";

    const result = searchSalesActivities({
      customerId: nonExistentCustomerId,
    });

    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBe(0);
    expect(result).toEqual([]);
  });
});