import { calculateOptimalDiscount } from "../../src/logic/it-1781935279444-1-1-1";

describe("営業データ項目のメタデータ管理機能（割引基準の一元管理）", () => {
  // SCEN-955: [normal] 契約別割引基準確認・統一機能 - 割引率が複数段階で設定されている場合、最適な割引条件が選択される
  test("複数段階割引率から注文数量に基づいて最適な割引条件が自動選択される", () => {
    const multi_stage_discount_tiers = [
      { quantity_min: 10, quantity_max: 50, discount_rate: 0.05 },
      { quantity_min: 51, quantity_max: 100, discount_rate: 0.1 },
      { quantity_min: 101, quantity_max: Infinity, discount_rate: 0.15 },
    ];

    const contract_id_A = "CNT-2024-001";
    const contract_id_B = "CNT-2024-002";

    // テストケース 1: 数量 30 個 → 5% 割引が選択される
    const result_30_qty = calculateOptimalDiscount({
      contract_id: contract_id_A,
      order_quantity: 30,
      discount_tiers: multi_stage_discount_tiers,
    });
    expect(result_30_qty.selected_discount_rate).toBe(0.05);
    expect(result_30_qty.matching_tier).toEqual({
      quantity_min: 10,
      quantity_max: 50,
      discount_rate: 0.05,
    });
    expect(result_30_qty.is_valid).toBe(true);

    // テストケース 2: 数量 75 個 → 10% 割引が選択される
    const result_75_qty = calculateOptimalDiscount({
      contract_id: contract_id_A,
      order_quantity: 75,
      discount_tiers: multi_stage_discount_tiers,
    });
    expect(result_75_qty.selected_discount_rate).toBe(0.1);
    expect(result_75_qty.matching_tier).toEqual({
      quantity_min: 51,
      quantity_max: 100,
      discount_rate: 0.1,
    });
    expect(result_75_qty.is_valid).toBe(true);

    // テストケース 3: 数量 120 個 → 15% 割引が選択される
    const result_120_qty = calculateOptimalDiscount({
      contract_id: contract_id_A,
      order_quantity: 120,
      discount_tiers: multi_stage_discount_tiers,
    });
    expect(result_120_qty.selected_discount_rate).toBe(0.15);
    expect(result_120_qty.matching_tier).toEqual({
      quantity_min: 101,
      quantity_max: Infinity,
      discount_rate: 0.15,
    });
    expect(result_120_qty.is_valid).toBe(true);

    // テストケース 4: 異なる契約 B でも同じ割引基準が一貫して適用される（数量 75 個）
    const result_contract_b_75_qty = calculateOptimalDiscount({
      contract_id: contract_id_B,
      order_quantity: 75,
      discount_tiers: multi_stage_discount_tiers,
    });
    expect(result_contract_b_75_qty.selected_discount_rate).toBe(0.1);
    expect(result_contract_b_75_qty.matching_tier.discount_rate).toBe(
      result_75_qty.matching_tier.discount_rate
    );
    expect(result_contract_b_75_qty.is_valid).toBe(true);

    // テストケース 5: 契約間の割引基準統一性を検証（同一数量で同一割引率が返される）
    expect(result_75_qty.selected_discount_rate).toBe(
      result_contract_b_75_qty.selected_discount_rate
    );

    // テストケース 6: 最適な割引条件が正確に選択されていることを段階的に検証
    // 割引率の昇順が維持されていることを確認
    expect(result_30_qty.selected_discount_rate).toBeLessThan(
      result_75_qty.selected_discount_rate
    );
    expect(result_75_qty.selected_discount_rate).toBeLessThan(
      result_120_qty.selected_discount_rate
    );

    // テストケース 7: 境界値テスト - 数量 50 個（第1段階の上限）→ 5% が選択される
    const result_boundary_50_qty = calculateOptimalDiscount({
      contract_id: contract_id_A,
      order_quantity: 50,
      discount_tiers: multi_stage_discount_tiers,
    });
    expect(result_boundary_50_qty.selected_discount_rate).toBe(0.05);
    expect(result_boundary_50_qty.matching_tier.quantity_max).toBe(50);

    // テストケース 8: 境界値テスト - 数量 51 個（第2段階の下限）→ 10% が選択される
    const result_boundary_51_qty = calculateOptimalDiscount({
      contract_id: contract_id_A,
      order_quantity: 51,
      discount_tiers: multi_stage_discount_tiers,
    });
    expect(result_boundary_51_qty.selected_discount_rate).toBe(0.1);
    expect(result_boundary_51_qty.matching_tier.quantity_min).toBe(51);

    // テストケース 9: 数量が範囲外の場合のエラーハンドリング
    expect(() =>
      calculateOptimalDiscount({
        contract_id: contract_id_A,
        order_quantity: 5,
        discount_tiers: multi_stage_discount_tiers,
      })
    ).toThrow(/数量範囲/);

    // テストケース 10: 割引階層が空の場合のエラーハンドリング
    expect(() =>
      calculateOptimalDiscount({
        contract_id: contract_id_A,
        order_quantity: 75,
        discount_tiers: [],
      })
    ).toThrow(/割引階層/);
  });
});