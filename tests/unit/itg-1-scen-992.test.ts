import { determineRetroactiveRuleApplication } from "../../src/logic/it-1781935279444-2-1-1";

describe("営業データ入力時の品質検証ルール定義・実行機能", () => {
  test("SCEN-992: 請求ルール変更時の遡及適用判定機能 - 境界値における遡及判定が正確に行われる", () => {
    const ruleChangeEffectiveDate = new Date("2024-01-01T00:00:00Z");
    const oldRuleConfig = {
      ruleId: "rule_001",
      discountRate: 0.1,
      minimumBillingAmount: 5000,
      appliedFrom: new Date("2023-01-01T00:00:00Z"),
      appliedUntil: new Date("2023-12-31T23:59:59Z"),
    };
    const newRuleConfig = {
      ruleId: "rule_002",
      discountRate: 0.15,
      minimumBillingAmount: 10000,
      appliedFrom: new Date("2024-01-01T00:00:00Z"),
      appliedUntil: new Date("2024-12-31T23:59:59Z"),
    };

    const dataBeforeChangeDate = {
      dataId: "data_001",
      occurrenceDate: new Date("2023-12-31T00:00:00Z"),
      customerId: "cust_001",
      serviceType: "service_A",
      amount: 20000,
    };

    const dataOnChangeDate = {
      dataId: "data_002",
      occurrenceDate: new Date("2024-01-01T00:00:00Z"),
      customerId: "cust_001",
      serviceType: "service_A",
      amount: 20000,
    };

    const dataAfterChangeDate = {
      dataId: "data_003",
      occurrenceDate: new Date("2024-01-02T00:00:00Z"),
      customerId: "cust_001",
      serviceType: "service_A",
      amount: 20000,
    };

    const resultBeforeChange = determineRetroactiveRuleApplication({
      operatingData: dataBeforeChangeDate,
      ruleChangeEffectiveDate: ruleChangeEffectiveDate,
      oldRuleConfig: oldRuleConfig,
      newRuleConfig: newRuleConfig,
    });

    const resultOnChange = determineRetroactiveRuleApplication({
      operatingData: dataOnChangeDate,
      ruleChangeEffectiveDate: ruleChangeEffectiveDate,
      oldRuleConfig: oldRuleConfig,
      newRuleConfig: newRuleConfig,
    });

    const resultAfterChange = determineRetroactiveRuleApplication({
      operatingData: dataAfterChangeDate,
      ruleChangeEffectiveDate: ruleChangeEffectiveDate,
      oldRuleConfig: oldRuleConfig,
      newRuleConfig: newRuleConfig,
    });

    expect(resultBeforeChange.isRetroactivelyApplied).toBe(false);
    expect(resultBeforeChange.appliedRuleId).toBe("rule_001");
    expect(resultBeforeChange.discountRate).toBe(0.1);
    expect(resultBeforeChange.minimumBillingAmount).toBe(5000);
    expect(resultBeforeChange.reason).toBe(
      "遡及適用対象外: 発生日が変更開始日より前"
    );

    expect(resultOnChange.isRetroactivelyApplied).toBe(true);
    expect(resultOnChange.appliedRuleId).toBe("rule_002");
    expect(resultOnChange.discountRate).toBe(0.15);
    expect(resultOnChange.minimumBillingAmount).toBe(10000);
    expect(resultOnChange.reason).toBe(
      "遡及適用対象: 発生日が変更開始日以降"
    );

    expect(resultAfterChange.isRetroactivelyApplied).toBe(true);
    expect(resultAfterChange.appliedRuleId).toBe("rule_002");
    expect(resultAfterChange.discountRate).toBe(0.15);
    expect(resultAfterChange.minimumBillingAmount).toBe(10000);
    expect(resultAfterChange.reason).toBe(
      "遡及適用対象: 発生日が変更開始日以降"
    );

    expect(resultBeforeChange.isRetroactivelyApplied).not.toBe(
      resultOnChange.isRetroactivelyApplied
    );
    expect(resultOnChange.appliedRuleId).not.toBe(
      resultBeforeChange.appliedRuleId
    );
  });
});