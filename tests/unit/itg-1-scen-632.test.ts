import { searchSalesActivities } from "../../src/logic/it-1781935279444-2-1-1";

describe("営業活動データ検索・権限制御機能", () => {
  // SCEN-632
  test("検索条件に合致するデータが0件の場合、空結果が正常に返される", async () => {
    const searchParams = {
      salesPersonName: "存在しない営業担当者",
      startDate: "2099-01-01",
      endDate: "2099-12-31",
      userId: "user-001",
      userRole: "sales_rep",
    };

    const result = await searchSalesActivities(searchParams);

    expect(result.statusCode).toBe(200);
    expect(result.data).toEqual([]);
    expect(result.totalCount).toBe(0);
    expect(result.pageSize).toBe(20);
    expect(result.currentPage).toBe(1);
    expect(result.totalPages).toBe(0);
    expect(result.errorMessage).toBeUndefined();
    expect(Array.isArray(result.data)).toBe(true);
    expect(result.data.length).toBe(0);
  });
});