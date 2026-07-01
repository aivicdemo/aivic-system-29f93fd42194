import {
  validateSalesDataWithComplexRules,
} from "../../src/logic/it-1781935279444-2-2-1";

describe("営業データ品質検証 - 複合検証ルール条件の評価", () => {
  // SCEN-1068
  test("複数の検証ルール条件を組み合わせた営業データの検証が正確に実行される", () => {
    // 検証ルール条件の定義: 金額 > 10000 AND 顧客区分 = '法人' AND 営業担当者が未割当でない
    const validation_rules = [
      {
        rule_id: "rule_001",
        rule_name: "金額下限チェック",
        condition_operator: "AND",
        conditions: [
          {
            condition_id: "cond_001",
            field_name: "amount",
            operator: ">",
            value: 10000,
            data_type: "number",
          },
        ],
      },
      {
        rule_id: "rule_002",
        rule_name: "顧客区分チェック",
        condition_operator: "AND",
        conditions: [
          {
            condition_id: "cond_002",
            field_name: "customer_type",
            operator: "=",
            value: "法人",
            data_type: "string",
          },
        ],
      },
      {
        rule_id: "rule_003",
        rule_name: "営業担当者割当チェック",
        condition_operator: "AND",
        conditions: [
          {
            condition_id: "cond_003",
            field_name: "sales_person_id",
            operator: "!=",
            value: null,
            data_type: "string",
          },
        ],
      },
    ];

    // テスト用営業データセット
    const test_data_sets = [
      {
        data_id: "data_001",
        amount: 15000,
        customer_type: "法人",
        sales_person_id: "sp_001",
        expected_result: "合格",
        description: "すべての条件を満たす",
      },
      {
        data_id: "data_002",
        amount: 5000,
        customer_type: "法人",
        sales_person_id: "sp_002",
        expected_result: "不合格",
        description: "金額が下限未満",
      },
      {
        data_id: "data_003",
        amount: 15000,
        customer_type: "個人",
        sales_person_id: "sp_003",
        expected_result: "不合格",
        description: "顧客区分が異なる",
      },
      {
        data_id: "data_004",
        amount: 15000,
        customer_type: "法人",
        sales_person_id: null,
        expected_result: "不合格",
        description: "営業担当者が未割当",
      },
      {
        data_id: "data_005",
        amount: 10000,
        customer_type: "法人",
        sales_person_id: "sp_004",
        expected_result: "不合格",
        description: "金額が境界値（10000は条件未満）",
      },
      {
        data_id: "data_006",
        amount: 10001,
        customer_type: "法人",
        sales_person_id: "sp_005",
        expected_result: "合格",
        description: "金額が境界値超過",
      },
      {
        data_id: "data_007",
        amount: 50000,
        customer_type: "法人",
        sales_person_id: "sp_006",
        expected_result: "合格",
        description: "すべての条件を満たす（大金額）",
      },
    ];

    // 各テストデータに対して検証を実行
    const validation_results = test_data_sets.map((test_data) => {
      const result = validateSalesDataWithComplexRules(
        {
          amount: test_data.amount,
          customer_type: test_data.customer_type,
          sales_person_id: test_data.sales_person_id,
        },
        validation_rules
      );

      return {
        data_id: test_data.data_id,
        validation_status: result.status,
        is_valid: result.is_valid,
        passed_conditions: result.passed_conditions,
        failed_conditions: result.failed_conditions,
        error_messages: result.error_messages,
      };
    });

    // 期待される検証結果の確認

    // テストケース1: すべての条件を満たす場合は合格
    expect(validation_results[0]).toEqual({
      data_id: "data_001",
      validation_status: "合格",
      is_valid: true,
      passed_conditions: 3,
      failed_conditions: 0,
      error_messages: [],
    });

    // テストケース2: 金額が下限未満の場合は不合格
    expect(validation_results[1]).toEqual({
      data_id: "data_002",
      validation_status: "不合格",
      is_valid: false,
      passed_conditions: 2,
      failed_conditions: 1,
      error_messages: expect.arrayContaining([
        expect.stringMatching(/金額/),
      ]),
    });

    // テストケース3: 顧客区分が異なる場合は不合格
    expect(validation_results[2]).toEqual({
      data_id: "data_003",
      validation_status: "不合格",
      is_valid: false,
      passed_conditions: 2,
      failed_conditions: 1,
      error_messages: expect.arrayContaining([
        expect.stringMatching(/顧客区分/),
      ]),
    });

    // テストケース4: 営業担当者が未割当の場合は不合格
    expect(validation_results[3]).toEqual({
      data_id: "data_004",
      validation_status: "不合格",
      is_valid: false,
      passed_conditions: 2,
      failed_conditions: 1,
      error_messages: expect.arrayContaining([
        expect.stringMatching(/営業担当者/),
      ]),
    });

    // テストケース5: 境界値（10000は条件未満）は不合格
    expect(validation_results[4]).toEqual({
      data_id: "data_005",
      validation_status: "不合格",
      is_valid: false,
      passed_conditions: 2,
      failed_conditions: 1,
      error_messages: expect.arrayContaining([
        expect.stringMatching(/金額/),
      ]),
    });

    // テストケース6: 境界値超過（10001）は合格
    expect(validation_results[5]).toEqual({
      data_id: "data_006",
      validation_status: "合格",
      is_valid: true,
      passed_conditions: 3,
      failed_conditions: 0,
      error_messages: [],
    });

    // テストケース7: すべての条件を満たす（大金額）は合格
    expect(validation_results[6]).toEqual({
      data_id: "data_007",
      validation_status: "合格",
      is_valid: true,
      passed_conditions: 3,
      failed_conditions: 0,
      error_messages: [],
    });

    // 複合条件の論理演算（AND）が正確に機能しているか検証
    const all_pass_count = validation_results.filter(
      (r) => r.is_valid === true
    ).length;
    expect(all_pass_count).toBe(3); // data_001, data_006, data_007 のみ合格

    const all_fail_count = validation_results.filter(
      (r) => r.is_valid === false
    ).length;
    expect(all_fail_count).toBe(4); // data_002, data_003, data_004, data_005 は不合格

    // 検証ルール条件の変更を行い、再度検証を実行
    const modified_rules = [
      {
        rule_id: "rule_001_modified",
        rule_name: "金額下限チェック（修正版）",
        condition_operator: "AND",
        conditions: [
          {
            condition_id: "cond_001_modified",
            field_name: "amount",
            operator: ">=",
            value: 10000,
            data_type: "number",
          },
        ],
      },
      {
        rule_id: "rule_002",
        rule_name: "顧客区分チェック",
        condition_operator: "AND",
        conditions: [
          {
            condition_id: "cond_002",
            field_name: "customer_type",
            operator: "=",
            value: "法人",
            data_type: "string",
          },
        ],
      },
      {
        rule_id: "rule_003",
        rule_name: "営業担当者割当チェック",
        condition_operator: "AND",
        conditions: [
          {
            condition_id: "cond_003",
            field_name: "sales_person_id",
            operator: "!=",
            value: null,
            data_type: "string",
          },
        ],
      },
    ];

    // 修正後のルールで境界値データを再検証
    const modified_result = validateSalesDataWithComplexRules(
      {
        amount: 10000,
        customer_type: "法人",
        sales_person_id: "sp_004",
      },
      modified_rules
    );

    // >= 演算子に変更後、金額10000は条件を満たすようになる
    expect(modified_result).toEqual({
      validation_status: "合格",
      is_valid: true,
      passed_conditions: 3,
      failed_conditions: 0,
      error_messages: [],
    });
  });
});