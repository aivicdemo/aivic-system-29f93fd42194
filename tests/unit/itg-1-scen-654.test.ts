import { validateValidationRule } from "../../src/logic/it-1781935279444-2-1-1";

describe("営業データ入力時の品質検証ルール定義・実行機能", () => {
  // SCEN-654: [error] 営業データ異常値・漏れデータ自動検出機能 - 不正な検証ルール定義が与えられた場合、エラーが適切に発生する
  test("不正な検証ルール定義が入力された場合、適切なエラーメッセージが表示され、ルール定義がシステムに保存されないこと", () => {
    // ケース1: 空の条件式
    const emptyConditionRule = {
      ruleId: "RULE_001",
      fieldName: "customer_name",
      operator: "required",
      condition: "",
      errorMessage: "顧客名は必須です",
    };
    expect(() => validateValidationRule(emptyConditionRule)).toThrow(/条件式/);

    // ケース2: 無効な演算子
    const invalidOperatorRule = {
      ruleId: "RULE_002",
      fieldName: "amount",
      operator: "invalid_op",
      condition: "100",
      errorMessage: "金額は100以上である必要があります",
    };
    expect(() => validateValidationRule(invalidOperatorRule)).toThrow(/演算子/);

    // ケース3: 存在しないフィールド参照
    const invalidFieldRule = {
      ruleId: "RULE_003",
      fieldName: "nonexistent_field",
      operator: "required",
      condition: "true",
      errorMessage: "フィールドが見つかりません",
    };
    expect(() => validateValidationRule(invalidFieldRule)).toThrow(/フィールド/);

    // ケース4: 正常な検証ルール定義は正常に処理されることを確認
    const validRule = {
      ruleId: "RULE_004",
      fieldName: "contact_date",
      operator: "type",
      condition: "date",
      errorMessage: "接触日時は日付形式である必要があります",
    };
    const result = validateValidationRule(validRule);
    expect(result).toEqual({
      isValid: true,
      ruleId: "RULE_004",
      fieldName: "contact_date",
      operator: "type",
      condition: "date",
      errorMessage: "接触日時は日付形式である必要があります",
    });

    // ケース5: 複数の不正要素を持つルール定義
    const multipleErrorsRule = {
      ruleId: "RULE_005",
      fieldName: "",
      operator: "unknown_operator",
      condition: "",
      errorMessage: "",
    };
    expect(() => validateValidationRule(multipleErrorsRule)).toThrow(/フィールド/);

    // ケース6: nullやundefinedを含むルール定義
    const nullFieldRule = {
      ruleId: "RULE_006",
      fieldName: null,
      operator: "required",
      condition: "true",
      errorMessage: "フィールド名が未指定です",
    };
    expect(() => validateValidationRule(nullFieldRule as any)).toThrow(/フィールド/);

    // ケース7: 範囲演算子の不正な条件値
    const invalidRangeRule = {
      ruleId: "RULE_007",
      fieldName: "sales_amount",
      operator: "range",
      condition: "invalid_range",
      errorMessage: "売上額は指定された範囲内である必要があります",
    };
    expect(() => validateValidationRule(invalidRangeRule)).toThrow(/範囲|条件値/);

    // ケース8: 正常系の複数フィールド検証
    const validComplexRule = {
      ruleId: "RULE_008",
      fieldName: "appointment_status",
      operator: "enum",
      condition: "confirmed,pending,cancelled",
      errorMessage: "アポ確定状況は有効な値である必要があります",
    };
    const complexResult = validateValidationRule(validComplexRule);
    expect(complexResult).toEqual({
      isValid: true,
      ruleId: "RULE_008",
      fieldName: "appointment_status",
      operator: "enum",
      condition: "confirmed,pending,cancelled",
      errorMessage: "アポ確定状況は有効な値である必要があります",
    });
  });
});