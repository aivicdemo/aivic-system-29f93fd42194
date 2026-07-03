import { describe, test, expect, beforeEach } from '@jest/globals';
import { generateMonthlySummaryReport } from '../../src/logic/it-1-br-1781935279444-1-2-1';

describe('Monthly Summary Report Generation - Quality Validation Check', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // SCEN-1280
  test('should interrupt report generation and notify error when unvalidated sales data exists', () => {
    // Prepare sales data records: mix of validated and unvalidated
    const salesDataRecords = [
      {
        id: 'sales_001',
        customerId: 'cust_A',
        serviceId: 'svc_standard',
        appointmentCount: 5,
        contractCount: 2,
        validationStatus: 'completed',
        validationCompletedAt: '2024-01-15T10:30:00Z',
      },
      {
        id: 'sales_002',
        customerId: 'cust_B',
        serviceId: 'svc_premium',
        appointmentCount: 8,
        contractCount: 3,
        validationStatus: 'pending', // unvalidated
        validationCompletedAt: null,
      },
      {
        id: 'sales_003',
        customerId: 'cust_A',
        serviceId: 'svc_standard',
        appointmentCount: 3,
        contractCount: 1,
        validationStatus: 'completed',
        validationCompletedAt: '2024-01-15T11:00:00Z',
      },
    ];

    const reportGenerationRequest = {
      reportPeriodStart: '2024-01-01',
      reportPeriodEnd: '2024-01-31',
      salesDataRecords: salesDataRecords,
      templateId: 'template_monthly_summary_001',
    };

    // Execute report generation
    const result = generateMonthlySummaryReport(reportGenerationRequest);

    // Verify: report generation is interrupted
    expect(result.status).toBe('interrupted');

    // Verify: error notification is sent
    expect(result.errorNotification).toBeDefined();
    expect(result.errorNotification.message).toMatch(/品質検証未完了/);
    expect(result.errorNotification.message).toMatch(/レポート生成を中断/);

    // Verify: unvalidated data count is reported
    expect(result.unvalidatedRecordCount).toBe(1);
    expect(result.unvalidatedRecordIds).toContain('sales_002');

    // Verify: report output is null or incomplete
    expect(result.generatedReportContent).toBeNull();
    expect(result.reportFileUri).toBeNull();

    // Verify: error log contains validation status details
    expect(result.errorLog).toBeDefined();
    expect(result.errorLog).toMatch(/validationStatus/);
    expect(result.errorLog).toMatch(/sales_002/);

    // Verify: notification includes user-facing message
    expect(result.notificationMessage).toMatch(/品質検証未完了のデータが存在するため/);
    expect(result.notificationMessage).toMatch(/レポート生成を中断しました/);

    // Verify: no partial report is generated
    expect(result.isReportGenerated).toBe(false);

    // Verify: timestamp of interruption is recorded
    expect(result.interruptedAt).toBeDefined();
    expect(result.interruptedAt).toMatch(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z/);
  });
});