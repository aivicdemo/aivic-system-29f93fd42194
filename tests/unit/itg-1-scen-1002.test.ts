import { describe, test, expect } from "@jest/globals";
import { validateDataQualityRule } from "../../src/logic/it-1781935279444-2-2-1";

describe("営業データ品質検証基準", () => {
  test("SCEN-1002: 必須項目が定義されていない検証ルールの場合にエラーが発生する", () => {
    // 前提: 検証ルール作成画面が開かれている
    // トリガー: 必須項目を指定せずに検証ルールを保存しようとする
    // 期待結果: 「必須項目が定義されていません」エラーが発生する

    const invalidRule = {
      ruleId: "rule_001",
      ruleName: "営業データ検証ルール",
      requiredFields: [], // 必須項目が空
      dataTypes: {
        顧客名: "string",
        アポ数: "number",
      },
      valueRanges: {
        アポ数: { min: 0, max: 100 },
      },
      createdAt: new Date("2024-01-15T10:00:00Z"),
    };

    // エラーが発生することを検証（ビジネスキーワード「必須項目」で regex match）
    expect(() => validateDataQualityRule(invalidRule)).toThrow(/必須項目/);
  });
});