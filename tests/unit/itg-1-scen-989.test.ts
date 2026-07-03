import { determineRetroactiveApplicabilityPeriod } from "../../src/logic/it-1781935279444-2-1-1";

describe("営業データ入力時の品質検証ルール定義・実行機能", () => {
  test("SCEN-989: 請求ルール変更時の遡及適用判定機能 - 請求ルール変更前後で契約・営業データを照合し遡及適用対象期間が正確に判定される", () => {
    // ======== Precondition: 請求ルール変更前の初期状態 ========
    const ruleA_start_date = new Date("2024-01-01T00:00:00Z");
    const ruleA_end_date = new Date("2024-06-30T23:59:59Z");
    const ruleA_id = "rule-A-001";
    const ruleA_base_fee = 50000;
    const ruleA_commission_rate = 0.1;

    // ======== Trigger: 請求ルールを新しいルール（ルールB）に変更 ========
    const rule_change_datetime = new Date("2024-05-15T10:30:00Z");

    const ruleB_id = "rule-B-001";
    const ruleB_base_fee = 60000;
    const ruleB_commission_rate = 0.15;

    // ======== Contract & Sales Data Setup ========
    const contract_data = [
      {
        contract_id: "contract-001",
        customer_id: "cust-001",
        contract_start_date: new Date("2024-01-15T00:00:00Z"),
        contract_end_date: new Date("2024-12-31T23:59:59Z"),
        applicable_rule_id: ruleA_id,
      },
      {
        contract_id: "contract-002",
        customer_id: "cust-002",
        contract_start_date: new Date("2024-05-01T00:00:00Z"),
        contract_end_date: new Date("2024-12-31T23:59:59Z"),
        applicable_rule_id: ruleA_id,
      },
      {
        contract_id: "contract-003",
        customer_id: "cust-003",
        contract_start_date: new Date("2024-04-01T00:00:00Z"),
        contract_end_date: new Date("2024-05-14T23:59:59Z"),
        applicable_rule_id: ruleA_id,
      },
    ];

    const sales_data = [
      {
        sales_id: "sales-001",
        contract_id: "contract-001",
        customer_id: "cust-001",
        sales_date: new Date("2024-04-10T09:00:00Z"),
        amount: 100000,
        rule_id_at_execution: ruleA_id,
      },
      {
        sales_id: "sales-002",
        contract_id: "contract-001",
        customer_id: "cust-001",
        sales_date: new Date("2024-05-20T14:30:00Z"),
        amount: 120000,
        rule_id_at_execution: ruleA_id,
      },
      {
        sales_id: "sales-003",
        contract_id: "contract-002",
        customer_id: "cust-002",
        sales_date: new Date("2024-05-10T10:00:00Z"),
        amount: 80000,
        rule_id_at_execution: ruleA_id,
      },
      {
        sales_id: "sales-004",
        contract_id: "contract-002",
        customer_id: "cust-002",
        sales_date: new Date("2024-06-01T15:00:00Z"),
        amount: 90000,
        rule_id_at_execution: ruleA_id,
      },
      {
        sales_id: "sales-005",
        contract_id: "contract-003",
        customer_id: "cust-003",
        sales_date: new Date("2024-05-05T08:00:00Z"),
        amount: 70000,
        rule_id_at_execution: ruleA_id,
      },
    ];

    // ======== Call: 遡及適用判定機能を実行 ========
    const retroactive_application_result = determineRetroactiveApplicabilityPeriod({
      previous_rule_id: ruleA_id,
      previous_rule_start_date: ruleA_start_date,
      previous_rule_end_date: ruleA_end_date,
      previous_rule_base_fee: ruleA_base_fee,
      previous_rule_commission_rate: ruleA_commission_rate,
      new_rule_id: ruleB_id,
      new_rule_base_fee: ruleB_base_fee,
      new_rule_commission_rate: ruleB_commission_rate,
      rule_change_datetime: rule_change_datetime,
      contract_data: contract_data,
      sales_data: sales_data,
    });

    // ======== Assertion 1: 対象期間内のすべてのデータが正確に抽出される ========
    const extracted_sales_within_period = retroactive_application_result.sales_data_within_retroactive_period;
    expect(extracted_sales_within_period).toHaveLength(4);

    const extracted_sales_ids = extracted_sales_within_period.map(
      (s: any) => s.sales_id
    );
    expect(extracted_sales_ids).toContain("sales-001");
    expect(extracted_sales_ids).toContain("sales-003");
    expect(extracted_sales_ids).toContain("sales-004");
    expect(extracted_sales_ids).toContain("sales-005");

    // ======== Assertion 2: 対象期間外のデータが除外される ========
    expect(extracted_sales_ids).not.toContain("sales-002");

    // ======== Assertion 3: ルール変更の境界日時で正確に適用ルールが切り替わる ========
    const boundary_validation = retroactive_application_result.boundary_cutover_validation;
    expect(boundary_validation.rule_change_datetime).toEqual(rule_change_datetime);
    expect(boundary_validation.applies_rule_a_before_cutover).toBe(true);
    expect(boundary_validation.applies_rule_b_after_cutover).toBe(true);

    // ======== Assertion 4: 遡及適用対象期間が正確に判定される ========
    const retroactive_period = retroactive_application_result.retroactive_period;
    expect(retroactive_period.start_date).toEqual(ruleA_start_date);
    expect(retroactive_period.end_date).toEqual(rule_change_datetime);
    expect(retroactive_period.is_retroactive_applicable).toBe(true);

    // ======== Assertion 5: 複数の契約パターンに対する遡及適用範囲の正確性 ========
    const contract_wise_applicability =
      retroactive_application_result.contract_wise_retroactive_applicability;
    expect(contract_wise_applicability).toHaveLength(3);

    const contract_001_result = contract_wise_applicability.find(
      (c: any) => c.contract_id === "contract-001"
    );
    expect(contract_001_result.is_retroactive_applicable).toBe(true);
    expect(contract_001_result.retroactive_sales_count).toBe(1);
    expect(contract_001_result.excluded_sales_count).toBe(1);

    const contract_002_result = contract_wise_applicability.find(
      (c: any) => c.contract_id === "contract-002"
    );
    expect(contract_002_result.is_retroactive_applicable).toBe(true);
    expect(contract_002_result.retroactive_sales_count).toBe(2);
    expect(contract_002_result.excluded_sales_count).toBe(0);

    const contract_003_result = contract_wise_applicability.find(
      (c: any) => c.contract_id === "contract-003"
    );
    expect(contract_003_result.is_retroactive_applicable).toBe(true);
    expect(contract_003_result.retroactive_sales_count).toBe(1);
    expect(contract_003_result.excluded_sales_count).toBe(0);

    // ======== Assertion 6: 契約終了後のデータは対象外 ========
    expect(
      extracted_sales_ids.filter(
        (id: string) =>
          sales_data.find((s: any) => s.sales_id === id)?.contract_id ===
          "contract-003"
      )
    ).toEqual(["sales-005"]);

    // ======== Assertion 7: 変更前後の請求額計算基準の差分が記録される ========
    const rule_comparison = retroactive_application_result.rule_change_impact;
    expect(rule_comparison.previous_rule_base_fee).toBe(ruleA_base_fee);
    expect(rule_comparison.new_rule_base_fee).toBe(ruleB_base_fee);
    expect(rule_comparison.base_fee_increase).toBe(10000);
    expect(rule_comparison.previous_rule_commission_rate).toBe(
      ruleA_commission_rate
    );
    expect(rule_comparison.new_rule_commission_rate).toBe(ruleB_commission_rate);
    expect(rule_comparison.commission_rate_increase).toBe(0.05);

    // ======== Assertion 8: 遡及適用判定ステータスが正常終了 ========
    expect(retroactive_application_result.status).toBe("success");
    expect(retroactive_application_result.error_message).toBeNull();
  });
});