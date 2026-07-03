import {
  defineAggregationRule,
  executeAggregation,
  getAggregationResult,
  saveAggregationResult,
  skipBillingForZeroAggregation,
} from "../../src/logic/it-1-br-1781935279444-1-2-1";

describe("月次サマリーテンプレートの定義・管理機能", () => {
  // SCEN-999: [edge] 営業データ抽出・集計ルール定義 - 顧客またはサービスが0件の場合でも集計ルールが正常に動作する
  test("should handle aggregation rule definition and execution with zero customers or services", () => {
    // Arrange: テストデータベース初期化、顧客テーブルとサービステーブルを空状態にセットアップ
    const customersCount = 0;
    const servicesCount = 0;
    const templateId = "template_001";
    const ruleName = "月次集計ルール_Q1";
    const aggregationTarget = "sales_activities";
    const aggregationMethod = "sum";
    const aggregationItems = ["appointment_count", "deal_count"];

    // Act 1: 集計ルール定義画面でルール作成
    const ruleDefinitionInput = {
      templateId: templateId,
      ruleName: ruleName,
      aggregationTarget: aggregationTarget,
      aggregationMethod: aggregationMethod,
      aggregationItems: aggregationItems,
      customersCount: customersCount,
      servicesCount: servicesCount,
    };

    const definedRule = defineAggregationRule(ruleDefinitionInput);

    // Assert 1: ルール定義が正常に完了し、必須項目がすべて含まれていることを確認
    expect(definedRule.ruleId).toBeTruthy();
    expect(definedRule.ruleName).toBe(ruleName);
    expect(definedRule.aggregationTarget).toBe(aggregationTarget);
    expect(definedRule.aggregationMethod).toBe(aggregationMethod);
    expect(definedRule.status).toBe("active");
    expect(definedRule.aggregationItems).toEqual(aggregationItems);

    // Act 2: 集計処理を実行トリガー
    const aggregationExecutionInput = {
      ruleId: definedRule.ruleId,
      executionPeriod: "2024-01-01_2024-01-31",
      dataSourceCount: {
        customers: customersCount,
        services: servicesCount,
      },
    };

    const executionLog = executeAggregation(aggregationExecutionInput);

    // Assert 2: 集計実行ログが正常に記録され、エラーハンドリングが適切に行われたことを確認
    expect(executionLog.executionId).toBeTruthy();
    expect(executionLog.ruleId).toBe(definedRule.ruleId);
    expect(executionLog.status).toBe("completed");
    expect(executionLog.recordsProcessed).toBe(0);
    expect(executionLog.errorsOccurred).toBe(false);
    expect(executionLog.executionTimestampUtc).toBeTruthy();

    // Act 3: 集計結果を取得
    const aggregationResultInput = {
      ruleId: definedRule.ruleId,
      executionPeriod: "2024-01-01_2024-01-31",
    };

    const aggregationResult = getAggregationResult(aggregationResultInput);

    // Assert 3: 集計結果が0件の場合でも正常に表示形式が適用されることを確認
    expect(aggregationResult.totalRecords).toBe(0);
    expect(aggregationResult.displayMessage).toBe("集計対象なし");
    expect(aggregationResult.summaryByCustomer).toEqual([]);
    expect(aggregationResult.summaryByService).toEqual([]);
    expect(aggregationResult.aggregatedValues).toEqual({
      appointment_count: 0,
      deal_count: 0,
    });

    // Act 4: 集計結果を保存
    const saveResultInput = {
      ruleId: definedRule.ruleId,
      executionId: executionLog.executionId,
      aggregationResult: aggregationResult,
      templateId: templateId,
    };

    const savedResult = saveAggregationResult(saveResultInput);

    // Assert 4: データベースに集計結果が正常に保存されたことを確認
    expect(savedResult.saved).toBe(true);
    expect(savedResult.recordId).toBeTruthy();
    expect(savedResult.totalRecords).toBe(0);
    expect(savedResult.storageTimestampUtc).toBeTruthy();

    // Act 5: 請求自動化処理が集計結果0件の場合でも正常にスキップ・処理されることを確認
    const billingSkipInput = {
      ruleId: definedRule.ruleId,
      aggregationResultId: savedResult.recordId,
      aggregatedRecordCount: 0,
      executionPeriod: "2024-01-01_2024-01-31",
    };

    const billingResult = skipBillingForZeroAggregation(billingSkipInput);

    // Assert 5: 請求処理が適切にスキップされ、ステータスが正常に遷移したことを確認
    expect(billingResult.skipped).toBe(true);
    expect(billingResult.skipReason).toBe("zero_aggregation_records");
    expect(billingResult.billingProcessStatus).toBe("skipped");
    expect(billingResult.nextProcessStep).toBe("awaiting_next_period");
    expect(billingResult.processLog).toContain("集計結果が0件のため請求処理をスキップしました");
  });
});