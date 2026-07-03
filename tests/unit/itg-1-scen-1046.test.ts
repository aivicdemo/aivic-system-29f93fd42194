import { describe, it, expect } from "@jest/globals";
import { validateRuleDefinition } from "../../src/logic/it-1781935279444-2-1-1";

describe("営業データ入力時の品質検証ルール定義・実行", () => {
  it("SCEN-1046: 検証ルールの条件定義に矛盾がある場合、ルール適用前にエラーとして検出される", () => {
    // 条件1: 金額 > 100000
    // 条件2: 金額 < 50000
    // この2つをANDで結合すると矛盾する（金額が同時に100000より大きく、50000より小さくなることは不可能）

    const ruleDefinition = {
      ruleName: "矛盾条件テストルール",
      conditions: [
        {
          conditionId: 1,
          field: "金額",
          operator: ">",
          value: 100000,
        },
        {
          conditionId: 2,
          field: "金額",
          operator: "<",
          value: 50000,
        },
      ],
      logicalOperator: "AND",
    };

    // validateRuleDefinition はルール定義の矛盾をチェックし、矛盾がある場合は例外をスロー
    expect(() => validateRuleDefinition(ruleDefinition)).toThrow(/矛盾する条件/);
  });
});