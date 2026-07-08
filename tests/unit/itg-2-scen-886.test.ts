import { determinePriceBookMapping } from "../../src/logic/it-6-2-2-2";

describe("査定員別の判定精度・乖離パターン分析ダッシュボード", () => {
  // SCEN-886: [normal] 物価本との項目マッピング・適用基準特定
  test("見積項目に対して対応する物価本の時期・地域・工種が一意に特定される", () => {
    const estimate_items = [
      {
        item_id: "EST001",
        item_name: "鉄骨工事",
        region: "東京",
        construction_type: "S造",
        applicable_period: "2024-01",
      },
      {
        item_id: "EST002",
        item_name: "コンクリート工事",
        region: "大阪",
        construction_type: "RC造",
        applicable_period: "2024-01",
      },
      {
        item_id: "EST003",
        item_name: "鉄骨工事",
        region: "東京",
        construction_type: "S造",
        applicable_period: "2024-02",
      },
      {
        item_id: "EST004",
        item_name: "左官工事",
        region: "名古屋",
        construction_type: "RC造",
        applicable_period: "2024-01",
      },
    ];

    const price_books = [
      {
        pb_id: "PB001",
        item_name: "鉄骨工事",
        region: "東京",
        construction_type: "S造",
        period: "2024-01",
        standard_price: 25000,
      },
      {
        pb_id: "PB002",
        item_name: "コンクリート工事",
        region: "大阪",
        construction_type: "RC造",
        period: "2024-01",
        standard_price: 18000,
      },
      {
        pb_id: "PB003",
        item_name: "鉄骨工事",
        region: "東京",
        construction_type: "S造",
        period: "2024-02",
        standard_price: 25500,
      },
      {
        pb_id: "PB004",
        item_name: "左官工事",
        region: "名古屋",
        construction_type: "RC造",
        period: "2024-01",
        standard_price: 12000,
      },
    ];

    const mapping_result = determinePriceBookMapping(
      estimate_items,
      price_books
    );

    // すべての見積項目がマッピングされていることを確認
    expect(mapping_result.mapped_count).toBe(4);

    // マッピング結果に重複がないことを確認
    const mapped_pb_ids = mapping_result.mappings.map((m) => m.pb_id);
    const unique_pb_ids = new Set(mapped_pb_ids);
    expect(unique_pb_ids.size).toBe(4);

    // 各見積項目が正確に1つの物価本にマッピングされていることを確認
    expect(mapping_result.mappings).toEqual([
      {
        item_id: "EST001",
        pb_id: "PB001",
        region: "東京",
        construction_type: "S造",
        period: "2024-01",
        is_unique: true,
      },
      {
        item_id: "EST002",
        pb_id: "PB002",
        region: "大阪",
        construction_type: "RC造",
        period: "2024-01",
        is_unique: true,
      },
      {
        item_id: "EST003",
        pb_id: "PB003",
        region: "東京",
        construction_type: "S造",
        period: "2024-02",
        is_unique: true,
      },
      {
        item_id: "EST004",
        pb_id: "PB004",
        region: "名古屋",
        construction_type: "RC造",
        period: "2024-01",
        is_unique: true,
      },
    ]);

    // 時期・地域・工種の組み合わせが一意であることを検証
    const combination_keys = mapping_result.mappings.map(
      (m) => `${m.period}|${m.region}|${m.construction_type}`
    );
    const unique_combinations = new Set(combination_keys);
    expect(unique_combinations.size).toBe(4);

    // マッピングに曖昧な対応がないことを確認
    expect(mapping_result.ambiguous_mappings).toBe(0);

    // マッピング結果のすべての項目がis_uniqueフラグをtrueに持つことを確認
    const all_unique = mapping_result.mappings.every((m) => m.is_unique);
    expect(all_unique).toBe(true);

    // マッピング結果に重複リスクがないことを確認
    expect(mapping_result.has_duplicates).toBe(false);
  });
});