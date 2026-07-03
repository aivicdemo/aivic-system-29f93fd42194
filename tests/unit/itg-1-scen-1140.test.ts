import { validateReportDistribution } from "../../src/logic/it-1-1-1";

describe("営業成果データの自動検証ルール定義と異常検出機能", () => {
  // SCEN-1140: [edge] レポート配信完了判定機能 - 複数顧客への部分配信失敗時に失敗した顧客のみアラートが生成される
  test("SCEN-1140: 部分配信失敗時に失敗顧客のみアラートが生成される", () => {
    const distributionJob = {
      jobId: "job_20240115_001",
      targetCustomers: [
        { customerId: "cust_001", email: "sales@company1.co.jp", status: "valid" },
        {
          customerId: "cust_002",
          email: "invalid-email@",
          status: "invalid",
        },
        { customerId: "cust_003", email: "sales@company3.co.jp", status: "valid" },
        {
          customerId: "cust_004",
          email: "",
          status: "invalid",
        },
        { customerId: "cust_005", email: "sales@company5.co.jp", status: "valid" },
        { customerId: "cust_006", email: "sales@company6.co.jp", status: "valid" },
      ],
      reportContent: {
        reportId: "rpt_20240115_001",
        title: "2024年1月営業成果レポート",
        data: {
          totalApos: 150,
          totalContracts: 45,
          totalRevenue: 2500000,
        },
      },
      distributionStartedAt: new Date("2024-01-15T09:00:00Z"),
    };

    const distributionResults = [
      {
        customerId: "cust_001",
        success: true,
        deliveredAt: new Date("2024-01-15T09:05:00Z"),
        failureReason: null,
      },
      {
        customerId: "cust_002",
        success: false,
        deliveredAt: null,
        failureReason: "配信先不正",
      },
      {
        customerId: "cust_003",
        success: true,
        deliveredAt: new Date("2024-01-15T09:06:00Z"),
        failureReason: null,
      },
      {
        customerId: "cust_004",
        success: false,
        deliveredAt: null,
        failureReason: "配信先空値",
      },
      {
        customerId: "cust_005",
        success: true,
        deliveredAt: new Date("2024-01-15T09:07:00Z"),
        failureReason: null,
      },
      {
        customerId: "cust_006",
        success: true,
        deliveredAt: new Date("2024-01-15T09:08:00Z"),
        failureReason: null,
      },
    ];

    const result = validateReportDistribution({
      jobId: distributionJob.jobId,
      targetCustomers: distributionJob.targetCustomers,
      reportId: distributionJob.reportContent.reportId,
      distributionResults: distributionResults,
    });

    // 期待値の計算:
    // - 失敗顧客: cust_002 (配信先不正), cust_004 (配信先空値) = 2社
    // - 成功顧客: cust_001, cust_003, cust_005, cust_006 = 4社
    // - アラート件数: 失敗顧客数 = 2件
    // - 正常配信顧客にはアラート生成なし

    expect(result.isPartialFailure).toBe(true);
    expect(result.failedCustomerCount).toBe(2);
    expect(result.successCustomerCount).toBe(4);
    expect(result.alerts.length).toBe(2);

    // アラート1: cust_002
    expect(result.alerts[0]).toEqual({
      alertId: expect.any(String),
      customerId: "cust_002",
      jobId: distributionJob.jobId,
      reportId: distributionJob.reportContent.reportId,
      severity: "error",
      failureReason: "配信先不正",
      detectedAt: expect.any(Date),
      message: expect.stringContaining("cust_002"),
    });

    // アラート2: cust_004
    expect(result.alerts[1]).toEqual({
      alertId: expect.any(String),
      customerId: "cust_004",
      jobId: distributionJob.jobId,
      reportId: distributionJob.reportContent.reportId,
      severity: "error",
      failureReason: "配信先空値",
      detectedAt: expect.any(Date),
      message: expect.stringContaining("cust_004"),
    });

    // 失敗顧客の特定
    const failedCustomerIds = result.alerts.map((a) => a.customerId);
    expect(failedCustomerIds).toEqual(["cust_002", "cust_004"]);
    expect(failedCustomerIds.length).toBe(result.failedCustomerCount);

    // 成功顧客にはアラートが生成されていないことを確認
    const successCustomerIds = distributionResults
      .filter((r) => r.success)
      .map((r) => r.customerId);
    const alertCustomerIds = result.alerts.map((a) => a.customerId);
    const successWithAlert = successCustomerIds.filter((id) =>
      alertCustomerIds.includes(id)
    );
    expect(successWithAlert.length).toBe(0);

    // 失敗顧客数とアラート件数が完全に一致
    expect(result.alerts.length).toBe(result.failedCustomerCount);

    // 各アラートに失敗理由が記録されているか確認
    result.alerts.forEach((alert) => {
      expect(alert.failureReason).toBeTruthy();
      expect(
        ["配信先不正", "配信先空値", "タイムアウト"].includes(
          alert.failureReason
        )
      ).toBe(true);
    });

    // 配信ジョブ全体の結果判定
    expect(result.distributionSummary).toEqual({
      totalTargetCount: 6,
      successCount: 4,
      failureCount: 2,
      successRate: expect.closeTo(66.67, 0.01),
      completedAt: expect.any(Date),
    });
  });
});