import { determineApprovalRoute } from "../../src/logic/it-6-2-2-1";

describe("ROI実績レポート承認ルート自動判定", () => {
  // SCEN-1334
  test("月次実績データ確定後、定量指標集計完了時点で承認権者が正常に自動判定される", () => {
    // 月次実績データ確定状態
    const monthlyReportData = {
      reportPeriod: "2024-01-01T00:00:00Z/2024-01-31T23:59:59Z",
      status: "confirmed",
      processingTimeReductionRate: 28.5,
      qualityUniformityIndex: 0.92,
      systemOperationRate: 99.7,
      ocrAccuracy: 96.2,
      aiJudgmentAccuracy: 94.8,
      datasetCoverageRate: 0.88,
      initialHeadcount: 30,
      expandedHeadcount: 700,
      roi: 3.45,
      totalCostReduction: 45000000,
      implementationCost: 13000000,
      confirmedAt: "2024-02-01T09:00:00Z",
      confirmedBy: "dept_manager_001"
    };

    // 定量指標集計完了状態
    const aggregatedMetrics = {
      metricsAggregationCompleted: true,
      aggregationCompletedAt: "2024-02-01T09:15:00Z",
      totalAuditItems: 12,
      criticalFindings: 1,
      highRiskFindings: 2,
      mediumRiskFindings: 3,
      dataValidationPassed: true,
      systemStabilityScore: 0.987,
      requiresApproval: true
    };

    // 承認ルート自動判定実行
    const approvalResult = determineApprovalRoute({
      monthlyReportData,
      aggregatedMetrics
    });

    // 期待結果: 承認権者が正常に判定される
    expect(approvalResult).toEqual({
      approvalRoute: "executive_approval_required",
      primaryApprover: {
        roleId: "cfo",
        roleTitle: "最高財務責任者",
        departmentId: "finance_planning",
        notificationRequired: true
      },
      secondaryApprover: {
        roleId: "it_director",
        roleTitle: "IT部門長",
        departmentId: "it_operations",
        notificationRequired: true
      },
      escalationRequired: false,
      escalationReason: null,
      approvalDeadline: "2024-02-05T17:00:00Z",
      priorityLevel: "high",
      judgmentAccuracy: 0.98,
      judgmentCompletionTime: 900,
      determinationStatus: "success"
    });

    // 承認権者情報が正確に判定されたことを確認
    expect(approvalResult.primaryApprover.roleId).toBe("cfo");
    expect(approvalResult.primaryApprover.notificationRequired).toBe(true);

    // 承認デッドラインが計算されていることを確認（確定後4営業日）
    expect(approvalResult.approvalDeadline).toBe("2024-02-05T17:00:00Z");

    // 判定完了ステータスを確認
    expect(approvalResult.determinationStatus).toBe("success");

    // 判定の信頼度スコアが高いことを確認
    expect(approvalResult.judgmentAccuracy).toBeGreaterThanOrEqual(0.95);

    // 判定完了時間が15分以内であることを確認
    expect(approvalResult.judgmentCompletionTime).toBeLessThanOrEqual(900);
  });

  test("月次実績データ確定済みで定量指標集計完了時、複数段階の承認が必要な場合を判定", () => {
    const monthlyReportData = {
      reportPeriod: "2024-02-01T00:00:00Z/2024-02-29T23:59:59Z",
      status: "confirmed",
      processingTimeReductionRate: 32.1,
      qualityUniformityIndex: 0.95,
      systemOperationRate: 99.85,
      ocrAccuracy: 97.5,
      aiJudgmentAccuracy: 96.2,
      datasetCoverageRate: 0.92,
      initialHeadcount: 30,
      expandedHeadcount: 700,
      roi: 4.12,
      totalCostReduction: 52000000,
      implementationCost: 13000000,
      confirmedAt: "2024-03-01T10:30:00Z",
      confirmedBy: "dept_manager_002"
    };

    const aggregatedMetrics = {
      metricsAggregationCompleted: true,
      aggregationCompletedAt: "2024-03-01T10:45:00Z",
      totalAuditItems: 15,
      criticalFindings: 2,
      highRiskFindings: 3,
      mediumRiskFindings: 4,
      dataValidationPassed: true,
      systemStabilityScore: 0.991,
      requiresApproval: true
    };

    const approvalResult = determineApprovalRoute({
      monthlyReportData,
      aggregatedMetrics
    });

    // 高ROIレベルでは複数段階承認が必要
    expect(approvalResult.primaryApprover.roleId).toBe("cfo");
    expect(approvalResult.secondaryApprover.roleId).toBe("it_director");
    expect(approvalResult.approvalRoute).toBe("executive_approval_required");

    // 承認デッドラインが設定されている
    expect(approvalResult.approvalDeadline).toBeTruthy();
  });

  test("月次実績データが未確定の場合、承認ルート判定がスキップされる", () => {
    const monthlyReportData = {
      reportPeriod: "2024-01-01T00:00:00Z/2024-01-31T23:59:59Z",
      status: "draft",
      processingTimeReductionRate: 0,
      qualityUniformityIndex: 0,
      systemOperationRate: 0,
      ocrAccuracy: 0,
      aiJudgmentAccuracy: 0,
      datasetCoverageRate: 0,
      initialHeadcount: 30,
      expandedHeadcount: 0,
      roi: 0,
      totalCostReduction: 0,
      implementationCost: 0,
      confirmedAt: null,
      confirmedBy: null
    };

    const aggregatedMetrics = {
      metricsAggregationCompleted: false,
      aggregationCompletedAt: null,
      totalAuditItems: 0,
      criticalFindings: 0,
      highRiskFindings: 0,
      mediumRiskFindings: 0,
      dataValidationPassed: false,
      systemStabilityScore: 0,
      requiresApproval: false
    };

    expect(() =>
      determineApprovalRoute({
        monthlyReportData,
        aggregatedMetrics
      })
    ).toThrow(/確定状態/);
  });

  test("定量指標集計が未完了の場合、承認ルート判定がスキップされる", () => {
    const monthlyReportData = {
      reportPeriod: "2024-01-01T00:00:00Z/2024-01-31T23:59:59Z",
      status: "confirmed",
      processingTimeReductionRate: 28.5,
      qualityUniformityIndex: 0.92,
      systemOperationRate: 99.7,
      ocrAccuracy: 96.2,
      aiJudgmentAccuracy: 94.8,
      datasetCoverageRate: 0.88,
      initialHeadcount: 30,
      expandedHeadcount: 700,
      roi: 3.45,
      totalCostReduction: 45000000,
      implementationCost: 13000000,
      confirmedAt: "2024-02-01T09:00:00Z",
      confirmedBy: "dept_manager_001"
    };

    const aggregatedMetrics = {
      metricsAggregationCompleted: false,
      aggregationCompletedAt: null,
      totalAuditItems: 0,
      criticalFindings: 0,
      highRiskFindings: 0,
      mediumRiskFindings: 0,
      dataValidationPassed: false,
      systemStabilityScore: 0,
      requiresApproval: false
    };

    expect(() =>
      determineApprovalRoute({
        monthlyReportData,
        aggregatedMetrics
      })
    ).toThrow(/集計完了/);
  });

  test("データ検証不合格の場合、承認ルート判定で例外を記録", () => {
    const monthlyReportData = {
      reportPeriod: "2024-01-01T00:00:00Z/2024-01-31T23:59:59Z",
      status: "confirmed",
      processingTimeReductionRate: 28.5,
      qualityUniformityIndex: 0.92,
      systemOperationRate: 99.7,
      ocrAccuracy: 96.2,
      aiJudgmentAccuracy: 94.8,
      datasetCoverageRate: 0.88,
      initialHeadcount: 30,
      expandedHeadcount: 700,
      roi: 3.45,
      totalCostReduction: 45000000,
      implementationCost: 13000000,
      confirmedAt: "2024-02-01T09:00:00Z",
      confirmedBy: "dept_manager_001"
    };

    const aggregatedMetrics = {
      metricsAggregationCompleted: true,
      aggregationCompletedAt: "2024-02-01T09:15:00Z",
      totalAuditItems: 12,
      criticalFindings: 1,
      highRiskFindings: 2,
      mediumRiskFindings: 3,
      dataValidationPassed: false,
      systemStabilityScore: 0.987,
      requiresApproval: true
    };

    expect(() =>
      determineApprovalRoute({
        monthlyReportData,
        aggregatedMetrics
      })
    ).toThrow(/検証/);
  });

  test("クリティカル件数が多い場合、エスカレーション判定が実行される", () => {
    const monthlyReportData = {
      reportPeriod: "2024-01-01T00:00:00Z/2024-01-31T23:59:59Z",
      status: "confirmed",
      processingTimeReductionRate: 15.2,
      qualityUniformityIndex: 0.78,
      systemOperationRate: 98.5,
      ocrAccuracy: 92.1,
      aiJudgmentAccuracy: 91.5,
      datasetCoverageRate: 0.82,
      initialHeadcount: 30,
      expandedHeadcount: 700,
      roi: 2.15,
      totalCostReduction: 28000000,
      implementationCost: 13000000,
      confirmedAt: "2024-02-01T09:00:00Z",
      confirmedBy: "dept_manager_001"
    };

    const aggregatedMetrics = {
      metricsAggregationCompleted: true,
      aggregationCompletedAt: "2024-02-01T09:15:00Z",
      totalAuditItems: 18,
      criticalFindings: 4,
      highRiskFindings: 5,
      mediumRiskFindings: 6,
      dataValidationPassed: true,
      systemStabilityScore: 0.965,
      requiresApproval: true
    };

    const approvalResult = determineApprovalRoute({
      monthlyReportData,
      aggregatedMetrics
    });

    // クリティカル件数が多いためエスカレーション判定が必要
    expect(approvalResult.escalationRequired).toBe(true);
    expect(approvalResult.escalationReason).toBeTruthy();
    expect(approvalResult.priorityLevel).toBe("critical");
  });

  test("ROI値が高い場合、CFOを主承認者として自動判定", () => {
    const monthlyReportData = {
      reportPeriod: "2024-01-01T00:00:00Z/2024-01-31T23:59:59Z",
      status: "confirmed",
      processingTimeReductionRate: 35.0,
      qualityUniformityIndex: 0.96,
      systemOperationRate: 99.9,
      ocrAccuracy: 98.0,
      aiJudgmentAccuracy: 97.5,
      datasetCoverageRate: 0.95,
      initialHeadcount: 30,
      expandedHeadcount: 700,
      roi: 5.0,
      totalCostReduction: 65000000,
      implementationCost: 13000000,
      confirmedAt: "2024-02-01T09:00:00Z",
      confirmedBy: "dept_manager_001"
    };

    const aggregatedMetrics = {
      metricsAggregationCompleted: true,
      aggregationCompletedAt: "2024-02-01T09:15:00Z",
      totalAuditItems: 10,
      criticalFindings: 0,
      highRiskFindings: 1,
      mediumRiskFindings: 2,
      dataValidationPassed: true,
      systemStabilityScore: 0.999,
      requiresApproval: true
    };

    const approvalResult = determineApprovalRoute({
      monthlyReportData,
      aggregatedMetrics
    });

    // ROI値が5.0であり、CFOが主承認者として判定される
    expect(approvalResult.primaryApprover.roleId).toBe("cfo");
    expect(approvalResult.approvalRoute).toBe("executive_approval_required");
    expect(approvalResult.priorityLevel).toBe("high");
  });

  test("承認権者への通知が正常に生成される", () => {
    const monthlyReportData = {
      reportPeriod: "2024-01-01T00:00:00Z/2024-01-31T23:59:59Z",
      status: "confirmed",
      processingTimeReductionRate: 28.5,
      qualityUniformityIndex: 0.92,
      systemOperationRate: 99.7,
      ocrAccuracy: 96.2,
      aiJudgmentAccuracy: 94.8,
      datasetCoverageRate: 0.88,
      initialHeadcount: 30,
      expandedHeadcount: 700,
      roi: 3.45,
      totalCostReduction: 45000000,
      implementationCost: 13000000,
      confirmedAt: "2024-02-01T09:00:00Z",
      confirmedBy: "dept_manager_001"
    };

    const aggregatedMetrics = {
      metricsAggregationCompleted: true,
      aggregationCompletedAt: "2024-02-01T09:15:00Z",
      totalAuditItems: 12,
      criticalFindings: 1,
      highRiskFindings: 2,
      mediumRiskFindings: 3,
      dataValidationPassed: true,
      systemStabilityScore: 0.987,
      requiresApproval: true
    };

    const approvalResult = determineApprovalRoute({
      monthlyReportData,
      aggregatedMetrics
    });

    // 主承認者への通知フラグがtrueであることを確認
    expect(approvalResult.primaryApprover.notificationRequired).toBe(true);

    // 副承認者への通知フラグがtrueであることを確認
    expect(approvalResult.secondaryApprover.notificationRequired).toBe(true);
  });
});