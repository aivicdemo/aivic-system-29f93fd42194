import { applyUnifiedJudgmentLogic } from "../../src/logic/it-6-2-2-1";

describe("統一判定ロジック適用機能 - 複数ロジック該当時の優先度制御", () => {
  test("SCEN-1046: 複数ロジック条件が同時に該当する境界ケースで優先度順に正しくロジックが選択される", () => {
    // ============================================================
    // 1. 複数ロジック該当時の優先度テスト（優先度1が最優先）
    // ============================================================
    const boundary_case_1 = {
      quoteId: "Q-2024-001",
      itemCategory: "鉄筋",
      quantity: 100,
      unitPrice: 10500,
      totalAmount: 1050000,
      region: "東京都",
      constructionType: "鉄骨造",
      quoteDate: "2024-06-15",
      logicRules: [
        {
          logicId: "L-001",
          priority: 1,
          name: "東京都-鉄筋基準ロジック",
          conditions: {
            regions: ["東京都"],
            categories: ["鉄筋"],
            priceRangeMin: 1000000,
            priceRangeMax: 1100000,
          },
        },
        {
          logicId: "L-002",
          priority: 2,
          name: "鉄筋通常ロジック",
          conditions: {
            regions: ["東京都", "神奈川県"],
            categories: ["鉄筋"],
            priceRangeMin: 900000,
            priceRangeMax: 1200000,
          },
        },
        {
          logicId: "L-003",
          priority: 3,
          name: "全国標準ロジック",
          conditions: {
            regions: ["全国"],
            categories: ["鉄筋"],
            priceRangeMin: 500000,
            priceRangeMax: 2000000,
          },
        },
      ],
    };

    const result_1 = applyUnifiedJudgmentLogic(boundary_case_1);
    expect(result_1.appliedLogicId).toBe("L-001");
    expect(result_1.appliedLogicPriority).toBe(1);
    expect(result_1.appliedLogicName).toBe("東京都-鉄筋基準ロジック");
    expect(result_1.matchedLogicCount).toBe(3);

    // ============================================================
    // 2. 価格帯境界値に複数ロジックが同時に該当する場合
    // ============================================================
    const boundary_case_2 = {
      quoteId: "Q-2024-002",
      itemCategory: "コンクリート",
      quantity: 500,
      unitPrice: 16000,
      totalAmount: 8000000,
      region: "大阪府",
      constructionType: "鉄筋コンクリート造",
      quoteDate: "2024-06-20",
      logicRules: [
        {
          logicId: "L-004",
          priority: 1,
          name: "高額物件-大阪府ロジック",
          conditions: {
            regions: ["大阪府"],
            categories: ["コンクリート"],
            priceRangeMin: 7500000,
            priceRangeMax: 8500000,
          },
        },
        {
          logicId: "L-005",
          priority: 2,
          name: "中堅物件-関西ロジック",
          conditions: {
            regions: ["大阪府", "兵庫県"],
            categories: ["コンクリート"],
            priceRangeMin: 5000000,
            priceRangeMax: 10000000,
          },
        },
        {
          logicId: "L-006",
          priority: 3,
          name: "コンクリート標準ロジック",
          conditions: {
            regions: ["全国"],
            categories: ["コンクリート"],
            priceRangeMin: 1000000,
            priceRangeMax: 20000000,
          },
        },
      ],
    };

    const result_2 = applyUnifiedJudgmentLogic(boundary_case_2);
    expect(result_2.appliedLogicId).toBe("L-004");
    expect(result_2.appliedLogicPriority).toBe(1);
    expect(result_2.appliedLogicName).toBe("高額物件-大阪府ロジック");
    expect(result_2.matchedLogicCount).toBe(3);

    // ============================================================
    // 3. 優先度2のロジックが選択されるケース
    // （優先度1のロジック条件が非該当で、優先度2が最優先）
    // ============================================================
    const boundary_case_3 = {
      quoteId: "Q-2024-003",
      itemCategory: "型枠",
      quantity: 200,
      unitPrice: 5500,
      totalAmount: 1100000,
      region: "神奈川県",
      constructionType: "鉄筋造",
      quoteDate: "2024-06-25",
      logicRules: [
        {
          logicId: "L-007",
          priority: 1,
          name: "東京都専用ロジック",
          conditions: {
            regions: ["東京都"],
            categories: ["型枠"],
            priceRangeMin: 1000000,
            priceRangeMax: 1200000,
          },
        },
        {
          logicId: "L-008",
          priority: 2,
          name: "関東共通ロジック",
          conditions: {
            regions: ["東京都", "神奈川県", "千葉県"],
            categories: ["型枠"],
            priceRangeMin: 800000,
            priceRangeMax: 1300000,
          },
        },
        {
          logicId: "L-009",
          priority: 3,
          name: "全国標準ロジック",
          conditions: {
            regions: ["全国"],
            categories: ["型枠"],
            priceRangeMin: 500000,
            priceRangeMax: 2000000,
          },
        },
      ],
    };

    const result_3 = applyUnifiedJudgmentLogic(boundary_case_3);
    expect(result_3.appliedLogicId).toBe("L-008");
    expect(result_3.appliedLogicPriority).toBe(2);
    expect(result_3.appliedLogicName).toBe("関東共通ロジック");
    expect(result_3.matchedLogicCount).toBe(2);

    // ============================================================
    // 4. 複数ロジック該当時の記録・乖離パターン抽出テスト
    // ============================================================
    const boundary_case_4 = {
      quoteId: "Q-2024-004",
      itemCategory: "鉄筋",
      quantity: 150,
      unitPrice: 9800,
      totalAmount: 1470000,
      region: "東京都",
      constructionType: "鉄骨造",
      quoteDate: "2024-07-01",
      logicRules: [
        {
          logicId: "L-010",
          priority: 1,
          name: "東京都-高額鉄筋",
          conditions: {
            regions: ["東京都"],
            categories: ["鉄筋"],
            priceRangeMin: 1400000,
            priceRangeMax: 1600000,
          },
        },
        {
          logicId: "L-011",
          priority: 2,
          name: "東京都-鉄筋標準",
          conditions: {
            regions: ["東京都"],
            categories: ["鉄筋"],
            priceRangeMin: 1000000,
            priceRangeMax: 1800000,
          },
        },
        {
          logicId: "L-012",
          priority: 3,
          name: "鉄筋全国基準",
          conditions: {
            regions: ["全国"],
            categories: ["鉄筋"],
            priceRangeMin: 500000,
            priceRangeMax: 3000000,
          },
        },
      ],
    };

    const result_4 = applyUnifiedJudgmentLogic(boundary_case_4);
    expect(result_4.appliedLogicId).toBe("L-010");
    expect(result_4.appliedLogicPriority).toBe(1);
    expect(result_4.matchedLogicCount).toBe(3);
    expect(result_4.deviationPatternId).toBeDefined();
    expect(result_4.recordedAt).toBeDefined();

    // ============================================================
    // 5. 境界値ちょうどのケース（複数ロジック該当）
    // ============================================================
    const boundary_case_5 = {
      quoteId: "Q-2024-005",
      itemCategory: "労務",
      quantity: 1,
      unitPrice: 5000000,
      totalAmount: 5000000,
      region: "京都府",
      constructionType: "木造",
      quoteDate: "2024-07-05",
      logicRules: [
        {
          logicId: "L-013",
          priority: 1,
          name: "京都府-大型物件",
          conditions: {
            regions: ["京都府"],
            categories: ["労務"],
            priceRangeMin: 5000000,
            priceRangeMax: 7000000,
          },
        },
        {
          logicId: "L-014",
          priority: 2,
          name: "関西-中型物件",
          conditions: {
            regions: ["京都府", "大阪府", "兵庫県"],
            categories: ["労務"],
            priceRangeMin: 3000000,
            priceRangeMax: 8000000,
          },
        },
      ],
    };

    const result_5 = applyUnifiedJudgmentLogic(boundary_case_5);
    expect(result_5.appliedLogicId).toBe("L-013");
    expect(result_5.appliedLogicPriority).toBe(1);
    expect(result_5.boundaryValueMatch).toBe(true);
    expect(result_5.matchedLogicCount).toBe(2);

    // ============================================================
    // 6. エラーケース: ロジック条件が null または未定義
    // ============================================================
    const invalid_case_1 = {
      quoteId: "Q-2024-006",
      itemCategory: "不明",
      quantity: 0,
      unitPrice: 0,
      totalAmount: 0,
      region: null,
      constructionType: null,
      quoteDate: "2024-07-10",
      logicRules: null,
    };

    expect(() => applyUnifiedJudgmentLogic(invalid_case_1)).toThrow(/ロジック/);

    // ============================================================
    // 7. エラーケース: 条件に該当するロジックがない場合
    // ============================================================
    const invalid_case_2 = {
      quoteId: "Q-2024-007",
      itemCategory: "不明な品目",
      quantity: 100,
      unitPrice: 1000,
      totalAmount: 100000,
      region: "沖縄県",
      constructionType: "特殊",
      quoteDate: "2024-07-15",
      logicRules: [
        {
          logicId: "L-015",
          priority: 1,
          name: "東京都専用",
          conditions: {
            regions: ["東京都"],
            categories: ["鉄筋"],
            priceRangeMin: 1000000,
            priceRangeMax: 2000000,
          },
        },
      ],
    };

    expect(() => applyUnifiedJudgmentLogic(invalid_case_2)).toThrow(/該当/);

    // ============================================================
    // 8. 同じ優先度内での複数該当時の安定性テスト
    // ============================================================
    const boundary_case_6 = {
      quoteId: "Q-2024-008",
      itemCategory: "鋼材",
      quantity: 300,
      unitPrice: 12000,
      totalAmount: 3600000,
      region: "福岡県",
      constructionType: "鉄骨造",
      quoteDate: "2024-07-20",
      logicRules: [
        {
          logicId: "L-016",
          priority: 1,
          name: "福岡県-鋼材A",
          conditions: {
            regions: ["福岡県"],
            categories: ["鋼材"],
            priceRangeMin: 3000000,
            priceRangeMax: 4000000,
          },
        },
        {
          logicId: "L-017",
          priority: 1,
          name: "福岡県-鋼材B",
          conditions: {
            regions: ["福岡県"],
            categories: ["鋼材"],
            priceRangeMin: 3200000,
            priceRangeMax: 3900000,
          },
        },
        {
          logicId: "L-018",
          priority: 2,
          name: "九州標準ロジック",
          conditions: {
            regions: ["福岡県", "佐賀県"],
            categories: ["鋼材"],
            priceRangeMin: 2000000,
            priceRangeMax: 5000000,
          },
        },
      ],
    };

    const result_6 = applyUnifiedJudgmentLogic(boundary_case_6);
    expect(result_6.appliedLogicPriority).toBe(1);
    expect(["L-016", "L-017"]).toContain(result_6.appliedLogicId);
    expect(result_6.matchedLogicCount).toBe(3);
    expect(result_6.deterministicSelection).toBe(true);
  });
});