import { evaluateDiscountEligibility } from "../../src/logic/it-1781935279444-1-1-1";

describe("営業データ項目のメタデータ管理機能 - 割引・キャンペーン適用判定", () => {
  // SCEN-903: [edge] 割引・キャンペーン適用判定機能 - 成果データが契約の最小基準値に到達した境界値で割引が適用される
  test("成果データが最小基準値の境界値で割引適用判定が正確に実行される", () => {
    // テスト用契約データ：最小基準値を100とする割引ルール
    const contract_id_1 = "C001";
    const discount_rule_1 = {
      rule_id: "DR001",
      contract_id: contract_id_1,
      performance_threshold: 100,
      discount_rate: 0.1,
      campaign_type: "performance_based",
      is_active: true,
    };

    const contract_id_2 = "C002";
    const discount_rule_2 = {
      rule_id: "DR002",
      contract_id: contract_id_2,
      performance_threshold: 50,
      discount_rate: 0.05,
      campaign_type: "performance_based",
      is_active: true,
    };

    // ケース1: 成果データ値が基準値未満（99）→ 割引適用されない
    const result_below_threshold = evaluateDiscountEligibility({
      contract_id: contract_id_1,
      performance_value: 99,
      discount_rules: [discount_rule_1],
    });

    expect(result_below_threshold).toEqual({
      is_eligible: false,
      applied_discount_rate: 0,
      matching_rules: [],
    });

    // ケース2: 成果データ値が基準値と同値（100）→ 割引適用される
    const result_at_threshold = evaluateDiscountEligibility({
      contract_id: contract_id_1,
      performance_value: 100,
      discount_rules: [discount_rule_1],
    });

    expect(result_at_threshold).toEqual({
      is_eligible: true,
      applied_discount_rate: 0.1,
      matching_rules: [
        {
          rule_id: "DR001",
          performance_threshold: 100,
          discount_rate: 0.1,
        },
      ],
    });

    // ケース3: 成果データ値が基準値を超過（101）→ 割引適用される
    const result_above_threshold = evaluateDiscountEligibility({
      contract_id: contract_id_1,
      performance_value: 101,
      discount_rules: [discount_rule_1],
    });

    expect(result_above_threshold).toEqual({
      is_eligible: true,
      applied_discount_rate: 0.1,
      matching_rules: [
        {
          rule_id: "DR001",
          performance_threshold: 100,
          discount_rate: 0.1,
        },
      ],
    });

    // ケース4: 複数の割引ルール存在時、それぞれの基準値で正しく判定される
    const multiple_rules = [discount_rule_1, discount_rule_2];

    // 契約C001で成果値99 → どの割引も適用されない
    const result_c001_99 = evaluateDiscountEligibility({
      contract_id: contract_id_1,
      performance_value: 99,
      discount_rules: multiple_rules,
    });

    expect(result_c001_99).toEqual({
      is_eligible: false,
      applied_discount_rate: 0,
      matching_rules: [],
    });

    // 契約C001で成果値100 → DR001（基準値100）のみ適用
    const result_c001_100 = evaluateDiscountEligibility({
      contract_id: contract_id_1,
      performance_value: 100,
      discount_rules: multiple_rules,
    });

    expect(result_c001_100).toEqual({
      is_eligible: true,
      applied_discount_rate: 0.1,
      matching_rules: [
        {
          rule_id: "DR001",
          performance_threshold: 100,
          discount_rate: 0.1,
        },
      ],
    });

    // 契約C002で成果値49 → どの割引も適用されない
    const result_c002_49 = evaluateDiscountEligibility({
      contract_id: contract_id_2,
      performance_value: 49,
      discount_rules: multiple_rules,
    });

    expect(result_c002_49).toEqual({
      is_eligible: false,
      applied_discount_rate: 0,
      matching_rules: [],
    });

    // 契約C002で成果値50 → DR002（基準値50）のみ適用
    const result_c002_50 = evaluateDiscountEligibility({
      contract_id: contract_id_2,
      performance_value: 50,
      discount_rules: multiple_rules,
    });

    expect(result_c002_50).toEqual({
      is_eligible: true,
      applied_discount_rate: 0.05,
      matching_rules: [
        {
          rule_id: "DR002",
          performance_threshold: 50,
          discount_rate: 0.05,
        },
      ],
    });

    // 契約C002で成果値150 → DR002（基準値50）のみ適用
    const result_c002_150 = evaluateDiscountEligibility({
      contract_id: contract_id_2,
      performance_value: 150,
      discount_rules: multiple_rules,
    });

    expect(result_c002_150).toEqual({
      is_eligible: true,
      applied_discount_rate: 0.05,
      matching_rules: [
        {
          rule_id: "DR002",
          performance_threshold: 50,
          discount_rate: 0.05,
        },
      ],
    });

    // エラーケース: 無効な割引ルールを渡された場合
    const inactive_rule = {
      rule_id: "DR003",
      contract_id: contract_id_1,
      performance_threshold: 100,
      discount_rate: 0.1,
      campaign_type: "performance_based",
      is_active: false,
    };

    const result_inactive = evaluateDiscountEligibility({
      contract_id: contract_id_1,
      performance_value: 100,
      discount_rules: [inactive_rule],
    });

    expect(result_inactive).toEqual({
      is_eligible: false,
      applied_discount_rate: 0,
      matching_rules: [],
    });

    // エラーケース: 契約IDが一致しないルール
    const result_no_matching_contract = evaluateDiscountEligibility({
      contract_id: "C999",
      performance_value: 100,
      discount_rules: [discount_rule_1, discount_rule_2],
    });

    expect(result_no_matching_contract).toEqual({
      is_eligible: false,
      applied_discount_rate: 0,
      matching_rules: [],
    });

    // エラーケース: performance_value が負数の場合
    expect(() =>
      evaluateDiscountEligibility({
        contract_id: contract_id_1,
        performance_value: -1,
        discount_rules: [discount_rule_1],
      })
    ).toThrow(/performance_value/);

    // エラーケース: discount_rules が空配列の場合
    const result_empty_rules = evaluateDiscountEligibility({
      contract_id: contract_id_1,
      performance_value: 100,
      discount_rules: [],
    });

    expect(result_empty_rules).toEqual({
      is_eligible: false,
      applied_discount_rate: 0,
      matching_rules: [],
    });
  });
});