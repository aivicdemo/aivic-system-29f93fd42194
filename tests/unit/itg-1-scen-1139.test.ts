import { describe, test, expect } from '@jest/globals';
import { determineReportDeliveryStatus } from '../../src/logic/it-1-1-1';

describe('営業成果データの自動検証ルール定義と異常検出機能', () => {
  // SCEN-1139: [error] レポート配信完了判定機能 - 配信失敗時に失敗ステータスと再試行フラグが正しく判定される
  test('配信失敗時にステータスが失敗と判定され、再試行フラグがtrueで設定される', () => {
    const deliveryAttemptData = {
      reportId: 'RPT-202501-001',
      recipientEmail: 'customer@example.com',
      templateId: 'TEMPLATE-MONTHLY-SUMMARY',
      reportContent: {
        period: '2025-01',
        totalSales: 1500000,
        appointmentCount: 45,
        conversionCount: 12,
        serviceBreakdown: [
          { serviceId: 'SVC-001', name: 'Aサービス', quantity: 30 },
          { serviceId: 'SVC-002', name: 'Bサービス', quantity: 15 }
        ]
      },
      attemptTimestamp: new Date('2025-01-25T10:00:00Z'),
      smtpServerError: {
        code: 'ECONNREFUSED',
        message: 'SMTP connection refused at server 25',
        statusCode: 502
      }
    };

    const result = determineReportDeliveryStatus(deliveryAttemptData);

    expect(result.deliveryStatus).toBe('FAILED');
    expect(result.shouldRetry).toBe(true);
    expect(result.retryCount).toBe(0);
    expect(result.errorCode).toBe('ECONNREFUSED');
    expect(result.errorDetails).toMatch(/SMTP/);
    expect(result.nextRetryTime).toBeDefined();
    expect(result.dbRecordId).toBeDefined();
  });
});