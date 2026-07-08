import { filterValidPricebookVersions } from "../../src/logic/it-6-2-2-1";

describe("物価本版の有効期間フィルタリング", () => {
  // SCEN-923
  test("複数の物価本版が並存する場合、有効期間内の版のみが対応付け対象として選別される", () => {
    // テストデータ: 複数の物価本版を作成
    const pricebookVersions = [
      {
        version_id: "v_a_001",
        version_number: "A",
        effective_start_date: "2023-01-01",
        effective_end_date: "2023-12-31",
        material_item_id: "item_001",
        material_name: "コンクリート",
        unit_price: 10000,
      },
      {
        version_id: "v_b_001",
        version_number: "B",
        effective_start_date: "2024-01-01",
        effective_end_date: "2024-12-31",
        material_item_id: "item_001",
        material_name: "コンクリート",
        unit_price: 10500,
      },
      {
        version_id: "v_c_001",
        version_number: "C",
        effective_start_date: "2025-01-01",
        effective_end_date: "2025-12-31",
        material_item_id: "item_001",
        material_name: "コンクリート",
        unit_price: 11000,
      },
    ];

    // 現在日時を 2024 年 6 月 15 日に設定
    const current_date = new Date("2024-06-15");

    // 対応付け機能を実行
    const filtered_versions = filterValidPricebookVersions(
      pricebookVersions,
      current_date
    );

    // 対応付け候補として表示される物価本版の一覧を確認
    // 期待結果: 有効期間内にある版B のみが表示される
    expect(filtered_versions).toHaveLength(1);
    expect(filtered_versions[0].version_number).toBe("B");
    expect(filtered_versions[0].version_id).toBe("v_b_001");
    expect(filtered_versions[0].effective_start_date).toBe("2024-01-01");
    expect(filtered_versions[0].effective_end_date).toBe("2024-12-31");
    expect(filtered_versions[0].unit_price).toBe(10500);

    // 有効期間外の版A、版Cが除外されていることを確認
    const version_numbers = filtered_versions.map((v) => v.version_number);
    expect(version_numbers).not.toContain("A");
    expect(version_numbers).not.toContain("C");
  });
});