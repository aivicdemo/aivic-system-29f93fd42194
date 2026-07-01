import { identifyApplicableDiscountRules } from "../../src/logic/it-1-br-1781935279444-1-2-1";

describe("月次サマリーテンプレートの定義・管理機能", () => {
  test("SCEN-951: 複数の割引ルール存在時に優先順位に基づき正しく割引が適用される", () => {
    // テストデータ: 複数の割引ルール（優先順位付き）が定義された契約
    const contractId = "CONTRACT_001";
    const baseAmount = 100000; // 基本請求額 100,000円

    const discountRules = [
      {
        id: "DISCOUNT_003",
        name: "割引ルール3",
        discountRate: 0.2, // 20%割引
        priority: 3,
        applicableCondition: "annual_contract",
        isActive: true,
      },
      {
        id: "DISCOUNT_001",
        name: "割引ルール1",
        discountRate: 0.1, // 10%割引
        priority: 1,
        applicableCondition: "volume_over_50",
        isActive: true,
      },
      {
        id: "DISCOUNT_002",
        name: "割引ルール2",
        discountRate: 0.15, // 15%割引
        priority: 2,
        applicableCondition: "long_term_contract",
        isActive: true,
      },
    ];

    const contractConditions = {
      volume: 60, // volume_over_50 条件を満たす
      contractType: "annual", // annual_contract 条件を満たす
      contractDuration: 24, // long_term_contract 条件を満たす
    };

    // 割引基準識別機能を実行
    const result = identifyApplicableDiscountRules({
      contractId,
      baseAmount,
      discountRules,
      contractConditions,
    });

    // 優先順位が最も高い割引ルール（priority: 1）のみが選択されることを検証
    expect(result.selectedDiscountRuleId).toBe("DISCOUNT_001");
    expect(result.selectedDiscountRuleName).toBe("割引ルール1");

    // 選択された割引ルールの割引率が正しいことを確認
    expect(result.selectedDiscountRate).toBe(0.1);

    // 割引額が正しく計算されていることを検証
    const expectedDiscountAmount = 100000 * 0.1; // 10,000円
    expect(result.discountAmount).toBe(expectedDiscountAmount);

    // 最終請求額が正しく計算されていることを検証
    const expectedFinalAmount = 100000 - expectedDiscountAmount; // 90,000円
    expect(result.finalAmount).toBe(expectedFinalAmount);

    // 適用された割引ルール以外が無視されていることを確認
    expect(result.appliedRuleCount).toBe(1);
    expect(result.ignoredDiscountRuleIds).toContain("DISCOUNT_002");
    expect(result.ignoredDiscountRuleIds).toContain("DISCOUNT_003");

    // 割引の重複適用が発生していないことを検証
    expect(result.discountAmount).toBeLessThan(baseAmount);
    expect(result.finalAmount).toBeGreaterThan(0);
    expect(result.finalAmount).toBe(baseAmount - expectedDiscountAmount);

    // 優先順位による順序付けが正しく機能していることを確認
    expect(result.priorityOrdered).toEqual([
      { id: "DISCOUNT_001", priority: 1 },
      { id: "DISCOUNT_002", priority: 2 },
      { id: "DISCOUNT_003", priority: 3 },
    ]);

    // 複数条件を満たす割引ルールが存在する場合の処理を確認
    expect(result.applicableRuleCount).toBe(3); // 全ルールが条件に合致
    expect(result.selectedDiscountRuleId).toBe("DISCOUNT_001"); // 優先度1が選択

    // 最も優先順位が高いルール（priority: 1）のみ適用されていることを確認
    expect(result.isCorrectlyApplied).toBe(true);
  });
});