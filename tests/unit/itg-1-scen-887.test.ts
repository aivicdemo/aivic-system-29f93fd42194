import { determineOptimalDiscount } from "../../src/logic/it-1-2-1";

describe("割引・キャンペーン適用判定機能 - 複数の割引ルールが該当する場合に最適な割引が選択される", () => {
  test("SCEN-887: 複数の割引ルールから最適な割引が自動選択され請求金額に反映される", () => {
    // 複数の割引ルールを事前設定
    const discountRules = [
      {
        discount_rule_id: "rule_001",
        discount_type: "rate",
        discount_value: 10,
        applicable_customer_rank: "standard",
        min_purchase_amount: 50000,
      },
      {
        discount_rule_id: "rule_002",
        discount_type: "rate",
        discount_value: 15,
        applicable_customer_rank: "premium",
        min_purchase_amount: 80000,
      },
      {
        discount_rule_id: "rule_003",
        discount_type: "fixed",
        discount_value: 5000,
        applicable_customer_rank: "standard",
        min_purchase_amount: 70000,
      },
    ];

    // 割引適用対象の顧客情報
    const customerInfo = {
      customer_id: "cust_12345",
      customer_rank: "premium",
      purchase_amount: 100000,
    };

    // 割引ルール適用判定機能を実行
    const result = determineOptimalDiscount(discountRules, customerInfo);

    // 期待値: 顧客ランク "premium" かつ購入金額 100,000円 に該当する割引ルール
    // rule_002: 割引率15% → 割引額 = 100,000 * 0.15 = 15,000円
    // rule_001: 割引率10% → 割引額 = 100,000 * 0.10 = 10,000円 (ランク不一致なので除外)
    // rule_003: 固定割引5,000円 (ランク一致、金額条件も満たすが額が小さい)
    // 最適割引: rule_002 (割引額 15,000円が最大)

    // 選択された割引ルールが最適割引であることを確認
    expect(result.selected_discount_rule_id).toBe("rule_002");
    expect(result.selected_discount_type).toBe("rate");
    expect(result.selected_discount_value).toBe(15);

    // 計算された割引額が正確であることを確認
    expect(result.discount_amount).toBe(15000);

    // 請求金額が正しく計算されていることを確認
    const expected_billing_amount = 100000 - 15000;
    expect(result.final_billing_amount).toBe(expected_billing_amount);

    // 該当した全割引ルールが正確に抽出されていることを確認
    expect(result.applicable_rules).toHaveLength(2);
    const applicable_rule_ids = result.applicable_rules.map(
      (r: { discount_rule_id: string }) => r.discount_rule_id
    );
    expect(applicable_rule_ids).toContain("rule_002");
    expect(applicable_rule_ids).toContain("rule_003");
    expect(applicable_rule_ids).not.toContain("rule_001");

    // 選択されなかった割引ルールが適用されていないことを確認
    expect(result.non_selected_rules).toContain("rule_001");
    expect(result.non_selected_rules).toContain("rule_003");

    // システムログに割引選択の判定結果が正確に記録されていることを確認
    expect(result.selection_log).toBeDefined();
    expect(result.selection_log.evaluated_rules).toHaveLength(3);
    expect(result.selection_log.selected_rule_id).toBe("rule_002");
    expect(result.selection_log.selection_reason).toBe(
      "最大割引額の割引ルールを自動選択"
    );
    expect(result.selection_log.timestamp).toBeDefined();
  });
});