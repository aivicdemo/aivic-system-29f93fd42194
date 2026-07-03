import { searchSalesActivities } from "../../src/logic/it-1781935279444-1-1-1";

describe("営業活動データ検索・抽出機能 - 検索結果が空の場合", () => {
  test("SCEN-1156: 存在しない営業担当者で検索すると空結果が返される", () => {
    // Arrange: 存在しない営業担当者名を検索条件に設定
    const searchCriteria = {
      salesRepName: "存在しない太郎",
      startDate: "2024-01-01",
      endDate: "2024-01-31",
      customerId: undefined,
      serviceType: undefined,
    };

    // Act: 検索を実行
    const result = searchSalesActivities(searchCriteria);

    // Assert: 空結果セットが返される
    expect(result.activities).toEqual([]);
    expect(result.totalCount).toBe(0);
    expect(result.message).toBe("検索結果がありません");

    // Assert: ページネーション機能が無効化
    expect(result.pagination.isEnabled).toBe(false);
    expect(result.pagination.totalPages).toBe(0);
    expect(result.pagination.currentPage).toBe(1);

    // Assert: ソート機能が無効化
    expect(result.sorting.isEnabled).toBe(false);

    // Assert: エクスポート機能が無効化
    expect(result.export.isEnabled).toBe(false);
  });
});