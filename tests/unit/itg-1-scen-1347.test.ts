import { validateSalesData } from "../../src/logic/it-1781935279444-2-1-1";

describe("営業データ入力時の品質検証ルール定義・実行機能", () => {
  // SCEN-1347
  test("複数の検証ルール条件が組み合わされた場合、すべての条件が正しく評価される", () => {
    const testData = {
      customerId: "CUST001",
      customerName: "株式会社テスト",
      amount: 150000,
      appointmentDate: "2024-01-15T10:00:00Z",
      appointmentStatus: "confirmed",
      serviceType: "standard",
      contactPersonName: "山田太郎",
      remarks: "テスト営業活動",
    };

    const validationRules = [
      {
        ruleId: "rule_001",
        ruleName: "金額範囲チェック",
        fieldName: "amount",
        conditions: [
          {
            conditionId: "cond_001_1",
            operator: ">=",
            value: 10000,
            description: "最小金額10000以上",
          },
          {
            conditionId: "cond_001_2",
            operator: "<=",
            value: 1000000,
            description: "最大金額1000000以下",
          },
        ],
        logicalOperator: "AND",
      },
      {
        ruleId: "rule_002",
        ruleName: "顧客コード形式チェック",
        fieldName: "customerId",
        conditions: [
          {
            conditionId: "cond_002_1",
            operator: "regex",
            value: "^CUST[0-9]{3}$",
            description: "CUST+3桁の数字形式",
          },
        ],
        logicalOperator: "AND",
      },
      {
        ruleId: "rule_003",
        ruleName: "必須項目チェック",
        fieldName: "customerName",
        conditions: [
          {
            conditionId: "cond_003_1",
            operator: "required",
            value: true,
            description: "顧客名は必須",
          },
          {
            conditionId: "cond_003_2",
            operator: "minLength",
            value: 2,
            description: "顧客名は2文字以上",
          },
        ],
        logicalOperator: "AND",
      },
      {
        ruleId: "rule_004",
        ruleName: "ステータス値チェック",
        fieldName: "appointmentStatus",
        conditions: [
          {
            conditionId: "cond_004_1",
            operator: "in",
            value: ["confirmed", "pending", "cancelled"],
            description: "有効なステータス値のいずれか",
          },
        ],
        logicalOperator: "AND",
      },
    ];

    const result = validateSalesData(testData, validationRules);

    expect(result.isValid).toBe(true);
    expect(result.totalRulesEvaluated).toBe(4);
    expect(result.rulesPassedCount).toBe(4);
    expect(result.rulesFailedCount).toBe(0);

    expect(result.evaluationLog).toBeDefined();
    expect(result.evaluationLog.length).toBeGreaterThan(0);

    const rule001Log = result.evaluationLog.find(
      (log) => log.ruleId === "rule_001"
    );
    expect(rule001Log).toBeDefined();
    expect(rule001Log.ruleName).toBe("金額範囲チェック");
    expect(rule001Log.passed).toBe(true);
    expect(rule001Log.conditionsEvaluated).toBe(2);
    expect(rule001Log.logicalOperator).toBe("AND");

    const cond001_1Log = rule001Log.conditionResults.find(
      (c) => c.conditionId === "cond_001_1"
    );
    expect(cond001_1Log).toBeDefined();
    expect(cond001_1Log.operator).toBe(">=");
    expect(cond001_1Log.fieldValue).toBe(150000);
    expect(cond001_1Log.comparisonValue).toBe(10000);
    expect(cond001_1Log.result).toBe(true);

    const cond001_2Log = rule001Log.conditionResults.find(
      (c) => c.conditionId === "cond_001_2"
    );
    expect(cond001_2Log).toBeDefined();
    expect(cond001_2Log.operator).toBe("<=");
    expect(cond001_2Log.fieldValue).toBe(150000);
    expect(cond001_2Log.comparisonValue).toBe(1000000);
    expect(cond001_2Log.result).toBe(true);

    const rule002Log = result.evaluationLog.find(
      (log) => log.ruleId === "rule_002"
    );
    expect(rule002Log).toBeDefined();
    expect(rule002Log.ruleName).toBe("顧客コード形式チェック");
    expect(rule002Log.passed).toBe(true);
    expect(rule002Log.conditionsEvaluated).toBe(1);

    const cond002_1Log = rule002Log.conditionResults.find(
      (c) => c.conditionId === "cond_002_1"
    );
    expect(cond002_1Log).toBeDefined();
    expect(cond002_1Log.operator).toBe("regex");
    expect(cond002_1Log.fieldValue).toBe("CUST001");
    expect(cond002_1Log.result).toBe(true);

    const rule003Log = result.evaluationLog.find(
      (log) => log.ruleId === "rule_003"
    );
    expect(rule003Log).toBeDefined();
    expect(rule003Log.ruleName).toBe("必須項目チェック");
    expect(rule003Log.passed).toBe(true);
    expect(rule003Log.conditionsEvaluated).toBe(2);

    const cond003_1Log = rule003Log.conditionResults.find(
      (c) => c.conditionId === "cond_003_1"
    );
    expect(cond003_1Log).toBeDefined();
    expect(cond003_1Log.operator).toBe("required");
    expect(cond003_1Log.fieldValue).toBe("株式会社テスト");
    expect(cond003_1Log.result).toBe(true);

    const cond003_2Log = rule003Log.conditionResults.find(
      (c) => c.conditionId === "cond_003_2"
    );
    expect(cond003_2Log).toBeDefined();
    expect(cond003_2Log.operator).toBe("minLength");
    expect(cond003_2Log.fieldValue).toBe("株式会社テスト");
    expect(cond003_2Log.comparisonValue).toBe(2);
    expect(cond003_2Log.result).toBe(true);

    const rule004Log = result.evaluationLog.find(
      (log) => log.ruleId === "rule_004"
    );
    expect(rule004Log).toBeDefined();
    expect(rule004Log.ruleName).toBe("ステータス値チェック");
    expect(rule004Log.passed).toBe(true);
    expect(rule004Log.conditionsEvaluated).toBe(1);

    const cond004_1Log = rule004Log.conditionResults.find(
      (c) => c.conditionId === "cond_004_1"
    );
    expect(cond004_1Log).toBeDefined();
    expect(cond004_1Log.operator).toBe("in");
    expect(cond004_1Log.fieldValue).toBe("confirmed");
    expect(cond004_1Log.result).toBe(true);

    expect(result.evaluationLog[0].executionOrder).toBe(1);
    expect(result.evaluationLog[1].executionOrder).toBe(2);
    expect(result.evaluationLog[2].executionOrder).toBe(3);
    expect(result.evaluationLog[3].executionOrder).toBe(4);

    expect(result.details).toBeDefined();
    expect(result.details.allConditionsEvaluated).toBe(true);
    expect(result.details.totalConditions).toBe(7);
    expect(result.details.passedConditions).toBe(7);
    expect(result.details.failedConditions).toBe(0);

    expect(result.returnValue).toEqual({
      isValid: true,
      rulesEvaluatedCount: 4,
      conditionsEvaluatedCount: 7,
      evaluationTimestampISO: result.returnValue.evaluationTimestampISO,
      logHash: result.returnValue.logHash,
    });
  });
});