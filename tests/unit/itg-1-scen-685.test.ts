import { describe, test, expect, beforeEach } from "@jest/globals";
import {
  validateQualityRulesForContradiction,
} from "../../src/logic/it-1781935279444-2-1-1";

describe("営業データ入力時の品質検証ルール定義・実行機能", () => {
  // SCEN-685: [error] 営業データ品質自動検証・通知機能 - 検証ルールが矛盾している場合、検証プロセスがエラーで中断される
  test("検証ルール矛盾時にエラーで中断される", () => {
    const contradictoryRules = [
      {
        rule_id: "rule_001",
        field_name: "sales_amount",
        condition_type: "minimum",
        condition_value: 1000,
        error_message: "売上金額は1000円以上である必要があります",
      },
      {
        rule_id: "rule_002",
        field_name: "sales_amount",
        condition_type: "maximum",
        condition_value: 500,
        error_message: "売上金額は500円以下である必要があります",
      },
    ];

    expect(() => {
      validateQualityRulesForContradiction(contradictoryRules);
    }).toThrow(/検証ルール.*矛盾/);
  });
});