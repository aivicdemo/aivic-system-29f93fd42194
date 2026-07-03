import { describe, test, expect } from "@jest/globals";
import { validateSalesDataMetadata } from "../../src/logic/it-1781935279444-2-2-1";

describe("営業データ品質検証 - メタデータ定義欠落時のエラーハンドリング", () => {
  // SCEN-1313
  test("メタデータ定義が欠落している場合、検証処理が中断されて欠落項目を示すエラーが発生する", () => {
    // 前提: 営業データファイルが選択され、メタデータ定義が一部欠落している状態

    // ハッピーパス: 完全なメタデータ定義がある場合は検証成功
    const completeMetadata = {
      fields: [
        {
          columnName: "contact_date",
          dataType: "DATE",
          required: true,
          validationRule: "YYYY-MM-DD",
        },
        {
          columnName: "appointment_count",
          dataType: "INTEGER",
          required: true,
          validationRule: ">=0",
        },
        {
          columnName: "contract_count",
          dataType: "INTEGER",
          required: true,
          validationRule: ">=0",
        },
      ],
      validationRules: [
        {
          ruleId: "rule_001",
          fieldName: "contact_date",
          condition: "NOT NULL",
        },
      ],
    };

    const result = validateSalesDataMetadata(completeMetadata);
    expect(result.isValid).toBe(true);
    expect(result.errors).toEqual([]);

    // エラーケース 1: fields 配列が完全に欠落している場合
    const missingFieldsMetadata = {
      validationRules: [
        {
          ruleId: "rule_001",
          fieldName: "contact_date",
          condition: "NOT NULL",
        },
      ],
    };

    expect(() => validateSalesDataMetadata(missingFieldsMetadata)).toThrow(
      /メタデータ/
    );

    // エラーケース 2: validationRules が欠落している場合
    const missingValidationRulesMetadata = {
      fields: [
        {
          columnName: "contact_date",
          dataType: "DATE",
          required: true,
          validationRule: "YYYY-MM-DD",
        },
      ],
    };

    expect(() =>
      validateSalesDataMetadata(missingValidationRulesMetadata)
    ).toThrow(/バリデーションルール/);

    // エラーケース 3: fields 内で必須フィールド(columnName)が欠落している場合
    const missingColumnNameMetadata = {
      fields: [
        {
          dataType: "DATE",
          required: true,
          validationRule: "YYYY-MM-DD",
        },
      ],
      validationRules: [
        {
          ruleId: "rule_001",
          fieldName: "contact_date",
          condition: "NOT NULL",
        },
      ],
    };

    expect(() =>
      validateSalesDataMetadata(missingColumnNameMetadata)
    ).toThrow(/カラム名/);

    // エラーケース 4: fields 内で必須フィールド(dataType)が欠落している場合
    const missingDataTypeMetadata = {
      fields: [
        {
          columnName: "contact_date",
          required: true,
          validationRule: "YYYY-MM-DD",
        },
      ],
      validationRules: [
        {
          ruleId: "rule_001",
          fieldName: "contact_date",
          condition: "NOT NULL",
        },
      ],
    };

    expect(() => validateSalesDataMetadata(missingDataTypeMetadata)).toThrow(
      /データ型/
    );

    // エラーケース 5: fields 内で必須フィールド(validationRule)が欠落している場合
    const missingValidationRuleFieldMetadata = {
      fields: [
        {
          columnName: "contact_date",
          dataType: "DATE",
          required: true,
        },
      ],
      validationRules: [
        {
          ruleId: "rule_001",
          fieldName: "contact_date",
          condition: "NOT NULL",
        },
      ],
    };

    expect(() =>
      validateSalesDataMetadata(missingValidationRuleFieldMetadata)
    ).toThrow(/バリデーションルール/);

    // エラーケース 6: fields 配列が空の場合
    const emptyFieldsMetadata = {
      fields: [],
      validationRules: [
        {
          ruleId: "rule_001",
          fieldName: "contact_date",
          condition: "NOT NULL",
        },
      ],
    };

    expect(() => validateSalesDataMetadata(emptyFieldsMetadata)).toThrow(
      /必須項目/
    );

    // エラーケース 7: validationRules 配列が空の場合
    const emptyValidationRulesMetadata = {
      fields: [
        {
          columnName: "contact_date",
          dataType: "DATE",
          required: true,
          validationRule: "YYYY-MM-DD",
        },
      ],
      validationRules: [],
    };

    expect(() =>
      validateSalesDataMetadata(emptyValidationRulesMetadata)
    ).toThrow(/バリデーションルール/);

    // エラーケース 8: null が渡された場合
    expect(() => validateSalesDataMetadata(null as any)).toThrow(
      /メタデータ/
    );

    // エラーケース 9: undefined が渡された場合
    expect(() => validateSalesDataMetadata(undefined as any)).toThrow(
      /メタデータ/
    );

    // エラーケース 10: 複数の必須フィールドが欠落している場合（最初に検出したものでエラー）
    const multiplesMissingMetadata = {
      fields: [
        {
          dataType: "DATE",
          required: true,
        },
      ],
    };

    expect(() =>
      validateSalesDataMetadata(multiplesMissingMetadata)
    ).toThrow(/メタデータ|カラム名|バリデーションルール/);
  });
});