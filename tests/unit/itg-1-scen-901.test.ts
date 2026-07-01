import { calculateDiscountedBillingAmount } from "../../src/logic/it-1781935279444-1-1-1";

describe("営業データ項目のメタデータ管理機能 - 割引・キャンペーン適用判定", () => {
  test("SCEN-901: 複数の割引ルールが適用対象の場合、最も有利な割引率が選択される", () => {
    // ===== テストデータ設定 =====
    // 顧客ID、基本請求額、適用可能な複数の割引ルール
    const customerId = "CUST-001";
    const baseBillingAmount = 100000; // 基本請求額: 100,000円
    
    // 適用可能な割引ルール: 割引率10%、15%、20%
    const applicableDiscountRules = [
      {
        rule_id: "DISC-001",
        discount_rate: 0.10, // 10%割引
        apply_condition: "purchase_amount_over_50000",
        campaign_period_start: "2024-01-01",
        campaign_period_end: "2024-12-31",
        is_active: true,
      },
      {
        rule_id: "DISC-002",
        discount_rate: 0.15, // 15%割引
        apply_condition: "customer_tier_silver",
        campaign_period_start: "2024-01-01",
        campaign_period_end: "2024-12-31",
        is_active: true,
      },
      {
        rule_id: "DISC-003",
        discount_rate: 0.20, // 20%割引
        apply_condition: "campaign_winter_sale",
        campaign_period_start: "2024-01-01",
        campaign_period_end: "2024-12-31",
        is_active: true,
      },
    ];

    // 顧客の適用条件を満たすかどうかの確認
    const customerContext = {
      customer_id: customerId,
      purchase_amount: 75000, // 50,000以上を満たす
      customer_tier: "silver", // customer_tier_silverを満たす
      campaign_participation: ["campaign_winter_sale"], // campaign_winter_saleに参加
      evaluation_date: "2024-06-15", // キャンペーン期間内
    };

    // ===== 割引適用判定ロジック実行 =====
    const result = calculateDiscountedBillingAmount({
      customerId,
      baseBillingAmount,
      applicableDiscountRules,
      customerContext,
    });

    // ===== 期待値計算 =====
    // 複数の割引ルールのうち、すべての適用条件が満たされるものから最も高い割引率を選択
    // DISC-001: 10% → purchase_amount_over_50000満たす (75000 > 50000)
    // DISC-002: 15% → customer_tier_silver満たす
    // DISC-003: 20% → campaign_winter_sale満たす
    // 最も有利な割引率は 20%
    const selectedDiscountRate = 0.20;
    const expectedBillingAmount = baseBillingAmount * (1 - selectedDiscountRate);
    // 100,000 * (1 - 0.20) = 100,000 * 0.80 = 80,000

    // ===== 割引適用判定結果の検証 =====
    // 1. 選択された割引率が最も高い割引率であることを検証
    expect(result.selected_discount_rate).toBe(0.20);

    // 2. 選択された割引ルールIDが DISC-003 であることを検証
    expect(result.selected_rule_id).toBe("DISC-003");

    // 3. 割引適用後の請求額が正確であることを検証
    expect(result.final_billing_amount).toBe(80000);

    // 4. 割引額の計算が正確であることを検証
    const expectedDiscountAmount = baseBillingAmount * selectedDiscountRate;
    // 100,000 * 0.20 = 20,000
    expect(result.discount_amount).toBe(20000);

    // 5. 割引選択プロセスと選定理由がログに記録されていることを検証
    expect(result.selection_log).toBeDefined();
    expect(result.selection_log.length).toBeGreaterThan(0);
    
    // ログ内容の確認
    const selectionLog = result.selection_log[0];
    expect(selectionLog.rule_id).toBe("DISC-003");
    expect(selectionLog.discount_rate).toBe(0.20);
    expect(selectionLog.reason).toMatch(/最も有利な割引/);
    expect(selectionLog.timestamp).toBeDefined();

    // 6. 割引選択の根拠（評価された全ルール）がログに記録されていることを検証
    expect(result.evaluated_rules).toBeDefined();
    expect(result.evaluated_rules.length).toBe(3);
    
    // 評価結果の詳細確認
    const evaluatedRuleIds = result.evaluated_rules.map(
      (rule: { rule_id: string }) => rule.rule_id
    );
    expect(evaluatedRuleIds).toContain("DISC-001");
    expect(evaluatedRuleIds).toContain("DISC-002");
    expect(evaluatedRuleIds).toContain("DISC-003");

    // 各ルールの適用条件判定結果
    const disc001Result = result.evaluated_rules.find(
      (rule: { rule_id: string }) => rule.rule_id === "DISC-001"
    );
    expect(disc001Result.is_applicable).toBe(true);
    expect(disc001Result.discount_rate).toBe(0.10);

    const disc002Result = result.evaluated_rules.find(
      (rule: { rule_id: string }) => rule.rule_id === "DISC-002"
    );
    expect(disc002Result.is_applicable).toBe(true);
    expect(disc002Result.discount_rate).toBe(0.15);

    const disc003Result = result.evaluated_rules.find(
      (rule: { rule_id: string }) => rule.rule_id === "DISC-003"
    );
    expect(disc003Result.is_applicable).toBe(true);
    expect(disc003Result.discount_rate).toBe(0.20);

    // 7. 最終的な請求記録が完全であることを検証
    expect(result.billing_record).toBeDefined();
    expect(result.billing_record.customer_id).toBe(customerId);
    expect(result.billing_record.base_amount).toBe(100000);
    expect(result.billing_record.discount_rate).toBe(0.20);
    expect(result.billing_record.discount_amount).toBe(20000);
    expect(result.billing_record.final_amount).toBe(80000);
    expect(result.billing_record.applied_rule_id).toBe("DISC-003");
  });
});