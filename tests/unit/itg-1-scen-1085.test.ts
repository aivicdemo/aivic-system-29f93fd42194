import { validateNamingRuleDefinition } from "../../src/logic/it-1-br-1781935279444-1-2-1";

describe("月次サマリーテンプレートの定義・管理機能", () => {
  // SCEN-1085: [error] ドキュメント命名規則・フォルダ構成自動適用機能 - 命名規則定義が不完全な場合にエラーが返される
  test("命名規則定義が不完全な場合にエラーが返される", () => {
    const incompleteNamingRuleDefinition = {
      prefix: "DOC",
      suffix: "",
      folderStructure: "YYYY/MM",
      dateFormat: "YYYYMMDD",
    };

    expect(() =>
      validateNamingRuleDefinition(incompleteNamingRuleDefinition)
    ).toThrow(/サフィックス/);
  });

  test("命名規則定義のプレフィックスが空白の場合にエラーが返される", () => {
    const incompleteNamingRuleDefinition = {
      prefix: "",
      suffix: "_FINAL",
      folderStructure: "YYYY/MM",
      dateFormat: "YYYYMMDD",
    };

    expect(() =>
      validateNamingRuleDefinition(incompleteNamingRuleDefinition)
    ).toThrow(/プレフィックス/);
  });

  test("命名規則定義のフォルダ構成が空白の場合にエラーが返される", () => {
    const incompleteNamingRuleDefinition = {
      prefix: "DOC",
      suffix: "_FINAL",
      folderStructure: "",
      dateFormat: "YYYYMMDD",
    };

    expect(() =>
      validateNamingRuleDefinition(incompleteNamingRuleDefinition)
    ).toThrow(/フォルダ構成/);
  });

  test("命名規則定義の日付フォーマットが空白の場合にエラーが返される", () => {
    const incompleteNamingRuleDefinition = {
      prefix: "DOC",
      suffix: "_FINAL",
      folderStructure: "YYYY/MM",
      dateFormat: "",
    };

    expect(() =>
      validateNamingRuleDefinition(incompleteNamingRuleDefinition)
    ).toThrow(/日付フォーマット/);
  });

  test("命名規則定義が完全な場合に検証成功が返される", () => {
    const completeNamingRuleDefinition = {
      prefix: "DOC",
      suffix: "_FINAL",
      folderStructure: "YYYY/MM",
      dateFormat: "YYYYMMDD",
    };

    const result = validateNamingRuleDefinition(
      completeNamingRuleDefinition
    );

    expect(result).toEqual({
      isValid: true,
      errorCode: null,
      errorMessage: null,
      invalidFields: [],
    });
  });

  test("命名規則定義の複数項目が不完全な場合に全てのエラー情報が返される", () => {
    const incompleteNamingRuleDefinition = {
      prefix: "",
      suffix: "",
      folderStructure: "",
      dateFormat: "",
    };

    expect(() =>
      validateNamingRuleDefinition(incompleteNamingRuleDefinition)
    ).toThrow(/必須項目/);
  });
});