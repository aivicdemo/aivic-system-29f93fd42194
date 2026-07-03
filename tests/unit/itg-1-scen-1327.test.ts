import { describe, it, expect, beforeEach, afterEach } from "@jest/globals";
import {
  createValidationRuleForMandatoryField,
  type ValidationRule,
  type DataItemDefinition,
} from "../../src/logic/it-1781935279444-2-1-1";

describe("営業データ品質基準・検証ルール定義 - 必須フラグ自動検証ルール生成", () => {
  let mockDataItem: DataItemDefinition;
  let generatedRule: ValidationRule;

  beforeEach(() => {
    mockDataItem = {
      itemId: "item_001",
      itemName: "顧客名",
      dataType: "string",
      unit: "件",
      isMandatory: true,
      minValue: undefined,
      maxValue: undefined,
      allowedValues: undefined,
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("SCEN-1327: 必須フラグが True のデータ項目に対して Null チェック検証ルールが自動生成される", () => {
    // Arrange: 必須フラグ True のデータ項目を準備
    const dataItem: DataItemDefinition = {
      itemId: "item_cust_name",
      itemName: "顧客名",
      dataType: "string",
      unit: "件",
      isMandatory: true,
      minValue: undefined,
      maxValue: undefined,
      allowedValues: undefined,
    };

    // Act: 検証ルール生成関数を実行
    generatedRule = createValidationRuleForMandatoryField(dataItem);

    // Assert 1: 検証ルール ID が生成されている
    expect(generatedRule.ruleId).toBeDefined();
    expect(typeof generatedRule.ruleId).toBe("string");
    expect(generatedRule.ruleId.length).toBeGreaterThan(0);

    // Assert 2: 検証ルール名が "[項目名] - Null チェック" 形式である
    expect(generatedRule.ruleName).toBe("顧客名 - Null チェック");

    // Assert 3: 検証ルール説明に「当該項目の値が Null でないこと」が含まれている
    expect(generatedRule.ruleDescription).toContain(
      "当該項目の値が Null でないこと"
    );

    // Assert 4: 検証ルール種別が "NULL_CHECK" である
    expect(generatedRule.ruleType).toBe("NULL_CHECK");

    // Assert 5: 検証対象項目 ID が一致している
    expect(generatedRule.targetItemId).toBe("item_cust_name");

    // Assert 6: 検証ルールの条件に NOT_NULL が含まれている
    expect(generatedRule.conditions).toBeDefined();
    expect(Array.isArray(generatedRule.conditions)).toBe(true);
    expect(generatedRule.conditions.length).toBeGreaterThan(0);
    expect(generatedRule.conditions[0]).toEqual({
      conditionId: expect.any(String),
      conditionType: "NOT_NULL",
      operator: "is_not_null",
      value: null,
    });

    // Assert 7: 検証ルールが有効化된 상태이다
    expect(generatedRule.isActive).toBe(true);

    // Assert 8: 検証ルール適용 시점이 "INPUT" 이다
    expect(generatedRule.executionTiming).toBe("INPUT");

    // Assert 9: エラーメッセージが適切に設定されている
    expect(generatedRule.errorMessage).toContain("顧客名");
    expect(generatedRule.errorMessage).toContain("必須項目");

    // Assert 10: 생성 일시가 記錄されている
    expect(generatedRule.createdAt).toBeDefined();
    expect(generatedRule.createdAt instanceof Date).toBe(true);

    // Assert 11: 必須フラグが False の場合は検証ルールが生成されない（エラーが発生）
    const nonMandatoryItem: DataItemDefinition = {
      itemId: "item_optional",
      itemName: "備考",
      dataType: "string",
      unit: "件",
      isMandatory: false,
      minValue: undefined,
      maxValue: undefined,
      allowedValues: undefined,
    };

    expect(() => {
      createValidationRuleForMandatoryField(nonMandatoryItem);
    }).toThrow(/必須/);

    // Assert 12: データ項目が null の場合はエラーが発生
    expect(() => {
      createValidationRuleForMandatoryField(null as any);
    }).toThrow(/項目/);

    // Assert 13: 検証ルール作成者が「システム自動」として記録される
    expect(generatedRule.createdBy).toBe("SYSTEM_AUTO");

    // Assert 14: 検証ルールに紐付くデータ項目の情報が保持されている
    expect(generatedRule.relatedDataItem).toEqual({
      itemId: "item_cust_name",
      itemName: "顧客名",
      dataType: "string",
    });

    // Assert 15: 複数の必須フラグ True データ項目に対して独立して検証ルールが生成される
    const secondItem: DataItemDefinition = {
      itemId: "item_deal_status",
      itemName: "成約ステータス",
      dataType: "string",
      unit: "件",
      isMandatory: true,
      minValue: undefined,
      maxValue: undefined,
      allowedValues: ["成約", "失注", "保留中"],
    };

    const secondRule = createValidationRuleForMandatoryField(secondItem);
    expect(secondRule.ruleName).toBe("成約ステータス - Null チェック");
    expect(secondRule.targetItemId).toBe("item_deal_status");
    expect(secondRule.ruleId).not.toBe(generatedRule.ruleId);
  });
});