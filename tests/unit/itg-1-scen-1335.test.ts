import { describe, test, expect } from "@jest/globals";
import {
  validateSalesDataAgainstRules,
} from "../../src/logic/it-1781935279444-2-1-1";

describe("営業データ入力時の品質検証ルール定義・実行", () => {
  // SCEN-1335: 複数の検証ルール条件が存在する場合、すべての条件に対する検証結果が正しく判定される
  test("should validate all rule conditions independently and record results correctly", () => {
    // 入力: 複数の検証ルール条件を含むテストデータセット
    const validationRules = [
      {
        ruleId: "rule_001",
        ruleName: "必須項目チェック",
        ruleType: "required",
        targetField: "customerName",
        conditions: [
          {
            conditionId: "cond_001",
            operator: "notEmpty",
            expectedValue: null,
          },
        ],
      },
      {
        ruleId: "rule_002",
        ruleName: "形式チェック",
        ruleType: "format",
        targetField: "contactDate",
        conditions: [
          {
            conditionId: "cond_002",
            operator: "matchPattern",
            expectedValue: "YYYY-MM-DD",
          },
        ],
      },
      {
        ruleId: "rule_003",
        ruleName: "範囲チェック",
        ruleType: "range",
        targetField: "appointmentCount",
        conditions: [
          {
            conditionId: "cond_003",
            operator: "greaterThanOrEqual",
            expectedValue: 0,
          },
          {
            conditionId: "cond_004",
            operator: "lessThanOrEqual",
            expectedValue: 100,
          },
        ],
      },
      {
        ruleId: "rule_004",
        ruleName: "重複チェック",
        ruleType: "duplicate",
        targetField: "transactionId",
        conditions: [
          {
            conditionId: "cond_005",
            operator: "unique",
            expectedValue: null,
          },
        ],
      },
    ];

    const salesData = {
      customerName: "テスト顧客",
      contactDate: "2024-01-15",
      appointmentCount: 5,
      transactionId: "TX001",
      dealContent: "提案営業",
      appointmentStatus: "確定",
    };

    // 実行: 複数の検証ルール条件をすべて実行
    const result = validateSalesDataAgainstRules(validationRules, salesData);

    // 期待値: すべての検証ルール条件が正しく個別に判定される
    expect(result).toEqual({
      isValid: true,
      validationResults: [
        {
          ruleId: "rule_001",
          ruleName: "必須項目チェック",
          passed: true,
          failedConditions: [],
          details: "必須項目チェック: 合格",
        },
        {
          ruleId: "rule_002",
          ruleName: "形式チェック",
          passed: true,
          failedConditions: [],
          details: "形式チェック: 合格",
        },
        {
          ruleId: "rule_003",
          ruleName: "範囲チェック",
          passed: true,
          failedConditions: [],
          details: "範囲チェック: 合格",
        },
        {
          ruleId: "rule_004",
          ruleName: "重複チェック",
          passed: true,
          failedConditions: [],
          details: "重複チェック: 合格",
        },
      ],
    });

    // テスト: 部分的に不合格のケース
    const invalidSalesData = {
      customerName: "",
      contactDate: "2024-13-45",
      appointmentCount: 150,
      transactionId: "TX001",
      dealContent: "提案営業",
      appointmentStatus: "確定",
    };

    const partialResult = validateSalesDataAgainstRules(
      validationRules,
      invalidSalesData
    );

    expect(partialResult).toEqual({
      isValid: false,
      validationResults: [
        {
          ruleId: "rule_001",
          ruleName: "必須項目チェック",
          passed: false,
          failedConditions: ["cond_001"],
          details: "customerName が空です",
        },
        {
          ruleId: "rule_002",
          ruleName: "形式チェック",
          passed: false,
          failedConditions: ["cond_002"],
          details: "contactDate の形式が不正です",
        },
        {
          ruleId: "rule_003",
          ruleName: "範囲チェック",
          passed: false,
          failedConditions: ["cond_004"],
          details: "appointmentCount が最大値 100 を超えています",
        },
        {
          ruleId: "rule_004",
          ruleName: "重複チェック",
          passed: true,
          failedConditions: [],
          details: "重複チェック: 合格",
        },
      ],
    });

    // テスト: 複数条件の組み合わせで全て不合格のケース
    const allInvalidSalesData = {
      customerName: "",
      contactDate: "invalid-date",
      appointmentCount: -5,
      transactionId: "",
      dealContent: "",
      appointmentStatus: "",
    };

    const allInvalidResult = validateSalesDataAgainstRules(
      validationRules,
      allInvalidSalesData
    );

    expect(allInvalidResult.isValid).toBe(false);
    expect(allInvalidResult.validationResults.length).toBe(4);
    expect(allInvalidResult.validationResults[0].passed).toBe(false);
    expect(allInvalidResult.validationResults[1].passed).toBe(false);
    expect(allInvalidResult.validationResults[2].passed).toBe(false);
    expect(allInvalidResult.validationResults[3].passed).toBe(false);

    // テスト: エラー検出時のルール名と不合格理由の明確性
    const errorDetailResult = validateSalesDataAgainstRules(
      validationRules,
      { ...invalidSalesData, appointmentCount: 150 }
    );

    const appointmentRuleResult = errorDetailResult.validationResults.find(
      (r: { ruleId: string }) => r.ruleId === "rule_003"
    );
    expect(appointmentRuleResult).toBeDefined();
    expect(appointmentRuleResult.ruleName).toBe("範囲チェック");
    expect(appointmentRuleResult.details).toMatch(/最大値.*100/);
    expect(appointmentRuleResult.failedConditions).toContain("cond_004");

    // テスト: 複数条件の独立性を確認（相互影響がないこと）
    const independenceTestRules = [
      {
        ruleId: "rule_a",
        ruleName: "チェックA",
        ruleType: "required",
        targetField: "fieldA",
        conditions: [
          {
            conditionId: "cond_a1",
            operator: "notEmpty",
            expectedValue: null,
          },
        ],
      },
      {
        ruleId: "rule_b",
        ruleName: "チェックB",
        ruleType: "range",
        targetField: "fieldB",
        conditions: [
          {
            conditionId: "cond_b1",
            operator: "greaterThanOrEqual",
            expectedValue: 10,
          },
        ],
      },
    ];

    const independenceTestData = {
      fieldA: "値あり",
      fieldB: 5,
    };

    const independenceResult = validateSalesDataAgainstRules(
      independenceTestRules,
      independenceTestData
    );

    expect(independenceResult.validationResults[0].passed).toBe(true);
    expect(independenceResult.validationResults[1].passed).toBe(false);
    expect(independenceResult.validationResults[0].failedConditions.length).toBe(
      0
    );
    expect(independenceResult.validationResults[1].failedConditions.length).toBe(
      1
    );
  });
});