import { calculateCRMRequirementPriorityScore } from "../../src/logic/it-1781935279444-1-1-1";

describe("CRM要件優先度スコア算出機能", () => {
  // SCEN-1343: [error] CRM要件優先度スコア算出 - スコア算出に必要なパラメータが不足している場合、エラーが返されて処理が停止する
  test("必須パラメータが不足している場合、エラーが返されて処理が停止する", () => {
    // 正常なリクエスト形式で全パラメータを確認
    const validRequest = {
      customerId: "CUST-001",
      transactionAmount: 1000000,
      winProbability: 0.85,
      requirementType: "営業データ標準化",
      developmentEffort: "高",
      strategicValue: "中",
    };

    // 顧客IDが不足しているケース
    const missingCustomerIdRequest = {
      transactionAmount: 1000000,
      winProbability: 0.85,
      requirementType: "営業データ標準化",
      developmentEffort: "高",
      strategicValue: "中",
    };

    // 案件金額が不足しているケース
    const missingTransactionAmountRequest = {
      customerId: "CUST-001",
      winProbability: 0.85,
      requirementType: "営業データ標準化",
      developmentEffort: "高",
      strategicValue: "中",
    };

    // 成約確度が不足しているケース
    const missingWinProbabilityRequest = {
      customerId: "CUST-001",
      transactionAmount: 1000000,
      requirementType: "営業データ標準化",
      developmentEffort: "高",
      strategicValue: "中",
    };

    // 顧客IDが不足している場合、エラーが発生することを検証
    expect(() =>
      calculateCRMRequirementPriorityScore(missingCustomerIdRequest as any)
    ).toThrow(/顧客ID/);

    // 案件金額が不足している場合、エラーが発生することを検証
    expect(() =>
      calculateCRMRequirementPriorityScore(
        missingTransactionAmountRequest as any
      )
    ).toThrow(/案件金額/);

    // 成約確度が不足している場合、エラーが発生することを検証
    expect(() =>
      calculateCRMRequirementPriorityScore(missingWinProbabilityRequest as any)
    ).toThrow(/成約確度/);

    // 全パラメータが揃っている場合は処理が実行されることを検証
    const result = calculateCRMRequirementPriorityScore(validRequest);
    expect(result).toBeDefined();
    expect(typeof result.priorityScore).toBe("number");
    expect(result.priorityScore).toBeGreaterThanOrEqual(0);
    expect(result.priorityScore).toBeLessThanOrEqual(100);
  });
});