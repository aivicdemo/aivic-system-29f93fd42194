import { describe, test, expect, beforeEach } from "@jest/globals";
import { validateSalesDataQuality } from "../../src/logic/it-1781935279444-2-2-1";

describe("営業データ完全性・正確性自動検証機能", () => {
  // SCEN-1030: 検証ルール定義が不完全またはルール実行に失敗した場合、適切なエラーが返される

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("検証ルール定義が不完全な場合、必須項目不足エラーを返す", () => {
    // 不完全なルール定義：ルール名が空文字
    const incompleteRuleWithEmptyName = {
      ruleName: "",
      conditionExpression: "value > 0",
      targetField: "appointmentCount",
      description: "アポ数は0より大きい",
    };

    expect(() =>
      validateSalesDataQuality(incompleteRuleWithEmptyName)
    ).toThrow(/ルール名/);
  });

  test("検証ルール定義で条件式が空の場合、必須項目不足エラーを返す", () => {
    // 不完全なルール定義：条件式が空文字
    const incompleteRuleWithEmptyCondition = {
      ruleName: "appointmentValidation",
      conditionExpression: "",
      targetField: "appointmentCount",
      description: "アポ数の検証",
    };

    expect(() =>
      validateSalesDataQuality(incompleteRuleWithEmptyCondition)
    ).toThrow(/条件式/);
  });

  test("検証ルール定義で対象フィールドが空の場合、必須項目不足エラーを返す", () => {
    // 不完全なルール定義：対象フィールドが空文字
    const incompleteRuleWithEmptyField = {
      ruleName: "appointmentValidation",
      conditionExpression: "value > 0",
      targetField: "",
      description: "アポ数の検証",
    };

    expect(() =>
      validateSalesDataQuality(incompleteRuleWithEmptyField)
    ).toThrow(/対象フィールド/);
  });

  test("無効な条件式でルール実行失敗時、ルール実行エラーを返す", () => {
    // 無効な条件式を含むルール定義
    const invalidRuleDefinition = {
      ruleName: "appointmentValidation",
      conditionExpression: "value >>> invalid syntax >>>",
      targetField: "appointmentCount",
      description: "アポ数の検証",
    };

    expect(() =>
      validateSalesDataQuality(invalidRuleDefinition)
    ).toThrow(/ルール実行エラー/);
  });

  test("検証ルール定義が完全な場合、検証結果を返す（正常系）", () => {
    // 完全で有効なルール定義
    const validRuleDefinition = {
      ruleName: "appointmentValidation",
      conditionExpression: "value > 0",
      targetField: "appointmentCount",
      description: "アポ数は0より大きい",
    };

    const testData = {
      appointmentCount: 5,
      contractCount: 2,
      customerId: "CUST001",
    };

    const result = validateSalesDataQuality(validRuleDefinition, testData);

    expect(result).toEqual({
      isValid: true,
      ruleName: "appointmentValidation",
      targetField: "appointmentCount",
      message: "検証に合格しました",
      errors: [],
    });
  });

  test("検証ルール実行時にデータが条件を満たさない場合、検証不合格を返す", () => {
    // 有効なルール定義
    const validRuleDefinition = {
      ruleName: "appointmentValidation",
      conditionExpression: "value > 10",
      targetField: "appointmentCount",
      description: "アポ数は10より大きい",
    };

    const testData = {
      appointmentCount: 5,
      contractCount: 2,
      customerId: "CUST001",
    };

    const result = validateSalesDataQuality(validRuleDefinition, testData);

    expect(result).toEqual({
      isValid: false,
      ruleName: "appointmentValidation",
      targetField: "appointmentCount",
      message: "検証に不合格しました",
      errors: ["appointmentCount: 値が条件を満たしていません（期待: > 10、実績: 5）"],
    });
  });

  test("複数必須フィールドが空の場合、すべての不足項目を返す", () => {
    // 複数の必須フィールドが空
    const incompleteRuleWithMultipleEmpty = {
      ruleName: "",
      conditionExpression: "",
      targetField: "appointmentCount",
      description: "検証ルール",
    };

    expect(() =>
      validateSalesDataQuality(incompleteRuleWithMultipleEmpty)
    ).toThrow(/ルール名|条件式/);
  });

  test("ルール定義の構造が不正な場合、適切なエラーを返す", () => {
    // ルール定義が null または undefined
    const nullRuleDefinition = null;

    expect(() => validateSalesDataQuality(nullRuleDefinition as any)).toThrow(
      /ルール定義/
    );
  });

  test("条件式が実行時例外を発生させる場合、ルール実行エラーを返す", () => {
    // ゼロ除算を引き起こす可能性のある条件式
    const problematicRuleDefinition = {
      ruleName: "divisionValidation",
      conditionExpression: "value / 0",
      targetField: "appointmentCount",
      description: "ゼロ除算テスト",
    };

    expect(() =>
      validateSalesDataQuality(problematicRuleDefinition)
    ).toThrow(/ルール実行エラー/);
  });

  test("対象フィールドがデータに存在しない場合、フィールド検出エラーを返す", () => {
    // 有効なルール定義だが、テストデータに対象フィールドが存在しない
    const validRuleDefinition = {
      ruleName: "contractValidation",
      conditionExpression: "value > 0",
      targetField: "nonexistentField",
      description: "存在しないフィールドの検証",
    };

    const testData = {
      appointmentCount: 5,
      contractCount: 2,
      customerId: "CUST001",
    };

    expect(() =>
      validateSalesDataQuality(validRuleDefinition, testData)
    ).toThrow(/フィールド/);
  });
});