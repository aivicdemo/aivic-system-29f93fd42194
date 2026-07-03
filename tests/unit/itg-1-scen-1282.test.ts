import { executeMonthlyReportDistribution } from '../../src/logic/it-1-br-1781935279444-1-2-1';

describe('月次サマリーテンプレートの定義・管理機能', () => {
  // SCEN-1282: [normal] 定義済みルール基づく自動配信 - 月次集計完了・最終承認獲得時に、配信ルール定義に基づき対象顧客に標準化レポートが自動配信される
  test('月次集計完了・最終承認後、配信ルール定義に基づいて対象顧客全員に標準化レポートが自動配信される', () => {
    const monthlyAggregationCompleteDate = new Date('2024-01-31T23:59:59Z');
    const finalApprovalDate = new Date('2024-02-01T09:00:00Z');
    const distributionRuleId = 'dr-001-standard';
    const reportTemplateId = 'tpl-monthly-001';
    
    const targetCustomerList = [
      {
        customerId: 'cust-a001',
        customerName: 'Customer A Inc.',
        recipientEmail: 'sales@customer-a.com',
        distributionChannel: 'email',
        contractStatus: 'active'
      },
      {
        customerId: 'cust-b001',
        customerName: 'Customer B Corp.',
        recipientEmail: 'admin@customer-b.com',
        distributionChannel: 'email',
        contractStatus: 'active'
      },
      {
        customerId: 'cust-c001',
        customerName: 'Customer C Ltd.',
        recipientEmail: 'finance@customer-c.com',
        distributionChannel: 'portal',
        contractStatus: 'active'
      }
    ];

    const monthlyReportData = {
      reportPeriodStart: new Date('2024-01-01T00:00:00Z'),
      reportPeriodEnd: new Date('2024-01-31T23:59:59Z'),
      totalAppointments: 145,
      totalContracts: 38,
      totalRevenue: 2850000,
      customerBreakdown: [
        { customerId: 'cust-a001', appointmentCount: 52, contractCount: 14, revenueAmount: 1050000 },
        { customerId: 'cust-b001', appointmentCount: 48, contractCount: 12, revenueAmount: 900000 },
        { customerId: 'cust-c001', appointmentCount: 45, contractCount: 12, revenueAmount: 900000 }
      ],
      generatedTimestamp: finalApprovalDate,
      approvalStatus: 'final_approved'
    };

    const distributionRuleDefinition = {
      ruleId: distributionRuleId,
      templateId: reportTemplateId,
      triggerEvent: 'final_approval_completed',
      targetCustomerFilter: {
        contractStatusList: ['active'],
        serviceTypeList: ['all']
      },
      distributionChannels: ['email', 'portal'],
      retryPolicy: {
        maxRetries: 3,
        retryIntervalMinutes: 5
      },
      scheduleType: 'immediate',
      createdDate: new Date('2024-01-15T10:00:00Z')
    };

    const result = executeMonthlyReportDistribution({
      reportData: monthlyReportData,
      distributionRule: distributionRuleDefinition,
      targetCustomers: targetCustomerList,
      approvalCompletionTime: finalApprovalDate
    });

    expect(result.distributionExecuted).toBe(true);
    expect(result.totalTargetCustomerCount).toBe(3);
    expect(result.successfulDistributionCount).toBe(3);
    expect(result.failedDistributionCount).toBe(0);
    expect(result.distributionStartTimestamp).toEqual(finalApprovalDate);
    
    expect(result.distributionDetails).toHaveLength(3);
    expect(result.distributionDetails[0]).toEqual(
      expect.objectContaining({
        customerId: 'cust-a001',
        customerName: 'Customer A Inc.',
        recipientEmail: 'sales@customer-a.com',
        distributionChannel: 'email',
        deliveryStatus: 'success',
        deliveryTimestamp: expect.any(Date)
      })
    );
    expect(result.distributionDetails[1]).toEqual(
      expect.objectContaining({
        customerId: 'cust-b001',
        customerName: 'Customer B Corp.',
        recipientEmail: 'admin@customer-b.com',
        distributionChannel: 'email',
        deliveryStatus: 'success',
        deliveryTimestamp: expect.any(Date)
      })
    );
    expect(result.distributionDetails[2]).toEqual(
      expect.objectContaining({
        customerId: 'cust-c001',
        customerName: 'Customer C Ltd.',
        recipientEmail: 'finance@customer-c.com',
        distributionChannel: 'portal',
        deliveryStatus: 'success',
        deliveryTimestamp: expect.any(Date)
      })
    );

    expect(result.reportFormatValidation).toBe(true);
    expect(result.reportContentComplete).toBe(true);
    expect(result.reportTemplateId).toBe(reportTemplateId);
    expect(result.reportPeriodStart).toEqual(new Date('2024-01-01T00:00:00Z'));
    expect(result.reportPeriodEnd).toEqual(new Date('2024-01-31T23:59:59Z'));

    expect(result.allDistributionsSuccessful).toBe(true);
    expect(result.distributionCompletionStatus).toBe('completed');
    expect(result.systemLogEntry).toEqual(
      expect.objectContaining({
        eventType: 'monthly_report_distribution_initiated',
        eventTimestamp: finalApprovalDate,
        triggeredBy: 'final_approval_workflow',
        distributionRuleApplied: distributionRuleId
      })
    );
  });
});