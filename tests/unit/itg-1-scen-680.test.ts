import { generateMonthlySummaryReport } from "../../src/logic/it-1-br-1781935279444-1-2-1";

describe("月次サマリーテンプレートの定義・管理機能", () => {
  // SCEN-680: [normal] 月次成果レポート自動集計機能 - レポート生成完了後、配信可能な状態に遷移する
  test("レポート生成完了後、ステータスが配信可能に遷移し、配信機能から選択可能になること", () => {
    const input = {
      salesDataList: [
        {
          customerId: "CUST001",
          serviceId: "SVC001",
          appointmentCount: 5,
          contractCount: 2,
          customerFeedback: "positive",
          recordDate: "2024-01-15",
        },
        {
          customerId: "CUST002",
          serviceId: "SVC002",
          appointmentCount: 3,
          contractCount: 1,
          customerFeedback: "neutral",
          recordDate: "2024-01-16",
        },
      ],
      templateId: "TMPL001",
      reportPeriod: {
        startDate: "2024-01-01",
        endDate: "2024-01-31",
      },
      generatedBy: "USER001",
      generatedAt: new Date("2024-02-01T09:00:00Z"),
    };

    const result = generateMonthlySummaryReport(input);

    expect(result).toEqual({
      reportId: expect.any(String),
      templateId: "TMPL001",
      status: "配信可能",
      reportPeriod: {
        startDate: "2024-01-01",
        endDate: "2024-01-31",
      },
      generatedAt: new Date("2024-02-01T09:00:00Z"),
      generatedBy: "USER001",
      totalAppointments: 8,
      totalContracts: 3,
      customerSummaries: [
        {
          customerId: "CUST001",
          serviceId: "SVC001",
          appointmentCount: 5,
          contractCount: 2,
          feedbackType: "positive",
        },
        {
          customerId: "CUST002",
          serviceId: "SVC002",
          appointmentCount: 3,
          contractCount: 1,
          feedbackType: "neutral",
        },
      ],
      isDistributable: true,
      canSelectForDistribution: true,
      distributionReadyAt: expect.any(Date),
    });

    expect(result.status).toBe("配信可能");
    expect(result.isDistributable).toBe(true);
    expect(result.canSelectForDistribution).toBe(true);
  });

  test("営業データが存在しない場合、エラーを投げる", () => {
    const input = {
      salesDataList: [],
      templateId: "TMPL001",
      reportPeriod: {
        startDate: "2024-01-01",
        endDate: "2024-01-31",
      },
      generatedBy: "USER001",
      generatedAt: new Date("2024-02-01T09:00:00Z"),
    };

    expect(() => generateMonthlySummaryReport(input)).toThrow(/営業データ/);
  });

  test("テンプレートIDが未指定の場合、エラーを投げる", () => {
    const input = {
      salesDataList: [
        {
          customerId: "CUST001",
          serviceId: "SVC001",
          appointmentCount: 5,
          contractCount: 2,
          customerFeedback: "positive",
          recordDate: "2024-01-15",
        },
      ],
      templateId: "",
      reportPeriod: {
        startDate: "2024-01-01",
        endDate: "2024-01-31",
      },
      generatedBy: "USER001",
      generatedAt: new Date("2024-02-01T09:00:00Z"),
    };

    expect(() => generateMonthlySummaryReport(input)).toThrow(/テンプレート/);
  });

  test("レポート期間が不正な場合、エラーを投げる", () => {
    const input = {
      salesDataList: [
        {
          customerId: "CUST001",
          serviceId: "SVC001",
          appointmentCount: 5,
          contractCount: 2,
          customerFeedback: "positive",
          recordDate: "2024-01-15",
        },
      ],
      templateId: "TMPL001",
      reportPeriod: {
        startDate: "2024-01-31",
        endDate: "2024-01-01",
      },
      generatedBy: "USER001",
      generatedAt: new Date("2024-02-01T09:00:00Z"),
    };

    expect(() => generateMonthlySummaryReport(input)).toThrow(/期間/);
  });

  test("複数顧客・複数サービスのデータが正確に集計され、配信可能ステータスになること", () => {
    const input = {
      salesDataList: [
        {
          customerId: "CUST001",
          serviceId: "SVC001",
          appointmentCount: 10,
          contractCount: 4,
          customerFeedback: "positive",
          recordDate: "2024-01-10",
        },
        {
          customerId: "CUST001",
          serviceId: "SVC002",
          appointmentCount: 6,
          contractCount: 2,
          customerFeedback: "positive",
          recordDate: "2024-01-12",
        },
        {
          customerId: "CUST002",
          serviceId: "SVC001",
          appointmentCount: 8,
          contractCount: 3,
          customerFeedback: "neutral",
          recordDate: "2024-01-15",
        },
      ],
      templateId: "TMPL002",
      reportPeriod: {
        startDate: "2024-01-01",
        endDate: "2024-01-31",
      },
      generatedBy: "USER002",
      generatedAt: new Date("2024-02-01T10:30:00Z"),
    };

    const result = generateMonthlySummaryReport(input);

    expect(result.status).toBe("配信可能");
    expect(result.totalAppointments).toBe(24);
    expect(result.totalContracts).toBe(9);
    expect(result.customerSummaries.length).toBe(3);
    expect(result.isDistributable).toBe(true);
    expect(result.canSelectForDistribution).toBe(true);
  });
});