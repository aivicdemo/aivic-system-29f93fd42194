import { filterMaterialsBySearchCriteria } from "../../src/logic/it-1781935279444-2-2-1";

describe("資料検索フィルタリング機能", () => {
  // SCEN-771
  test("検索条件に合致する資料が0件の場合に空配列が返却される", () => {
    // 初期化: サンプル資料データセット
    const sampleMaterials = [
      {
        id: "mat_001",
        name: "基本契約書_2024",
        keyword: "基本契約",
        version: "1.0",
        createdAt: "2024-01-15",
      },
      {
        id: "mat_002",
        name: "提案資料_営業代行",
        keyword: "提案資料",
        version: "2.1",
        createdAt: "2024-02-20",
      },
      {
        id: "mat_003",
        name: "契約変更通知_顧客A",
        keyword: "契約変更",
        version: "1.5",
        createdAt: "2024-03-10",
      },
    ];

    // 検索条件: 存在しないキーワード
    const searchCriteria = {
      keyword: "XXXXXX_NOT_EXISTS",
      materials: sampleMaterials,
    };

    // フィルタリング処理を実行
    const result = filterMaterialsBySearchCriteria(searchCriteria);

    // 返却された結果の型を確認
    expect(Array.isArray(result)).toBe(true);

    // 返却された結果の要素数を確認
    expect(result.length).toBe(0);

    // 返却結果が空配列であることを確認
    expect(result).toEqual([]);
  });
});