import { describe, test, expect } from "@jest/globals";
import { validateReportDistributionRule } from "../../src/logic/it-1-br-1781935279444-1-2-1";

describe("月次サマリーテンプレート定義・管理機能", () => {
  // SCEN-1065: [error] レポート配信ルール判定機能 - 配信ルール定義が無効または矛盾している場合、エラーを返す
  test("should return error when distribution rule is invalid or contradictory", () => {
    // ケース1: 空のルール定義（無効）
    expect(() =>
      validateReportDistributionRule({
        rule_id: "",
        rule_name: "",
        start_datetime: null,
        end_datetime: null,
        target_customers: [],
        distribution_channel: "",
        is_active: false,
      })
    ).toThrow(/ルール定義が無効です/);

    // ケース2: nullルール定義（無効）
    expect(() => validateReportDistributionRule(null as any)).toThrow(
      /ルール定義が無効です/
    );

    // ケース3: 開始日時が終了日時より後ろ（矛盾）
    expect(() =>
      validateReportDistributionRule({
        rule_id: "rule_001",
        rule_name: "distribution_rule_test",
        start_datetime: new Date("2024-12-31T23:59:59Z"),
        end_datetime: new Date("2024-01-01T00:00:00Z"),
        target_customers: ["cust_001"],
        distribution_channel: "email",
        is_active: true,
      })
    ).toThrow(/ルール定義に矛盾があります/);

    // ケース4: 矛盾する条件（配信チャネルが空で有効フラグがtrue）
    expect(() =>
      validateReportDistributionRule({
        rule_id: "rule_002",
        rule_name: "invalid_channel",
        start_datetime: new Date("2024-01-01T00:00:00Z"),
        end_datetime: new Date("2024-12-31T23:59:59Z"),
        target_customers: ["cust_002"],
        distribution_channel: "",
        is_active: true,
      })
    ).toThrow(/ルール定義に矛盾があります/);

    // ケース5: ターゲット顧客が空で有効フラグがtrue
    expect(() =>
      validateReportDistributionRule({
        rule_id: "rule_003",
        rule_name: "no_customer_rule",
        start_datetime: new Date("2024-01-01T00:00:00Z"),
        end_datetime: new Date("2024-12-31T23:59:59Z"),
        target_customers: [],
        distribution_channel: "portal",
        is_active: true,
      })
    ).toThrow(/ルール定義に矛盾があります/);

    // ケース6: 有効なルール定義（成功ケース）
    const valid_result = validateReportDistributionRule({
      rule_id: "rule_004",
      rule_name: "valid_distribution_rule",
      start_datetime: new Date("2024-01-01T00:00:00Z"),
      end_datetime: new Date("2024-12-31T23:59:59Z"),
      target_customers: ["cust_001", "cust_002"],
      distribution_channel: "email",
      is_active: true,
    });

    expect(valid_result).toEqual({
      is_valid: true,
      rule_id: "rule_004",
      status_code: 200,
      message: "ルール定義は有効です",
    });
  });
});