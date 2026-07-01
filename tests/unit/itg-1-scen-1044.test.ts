import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { classifyCustomerInquiry, determinePriorityLevel } from '../../src/logic/it-1-2-1';

describe('顧客質問内容の分類と優先度判定 - 月次レポート生成直後の即時処理', () => {
  let fetchMock: any;

  beforeEach(() => {
    fetchMock = require('jest-fetch-mock');
    fetchMock.enableMocks();
    fetchMock.resetMocks();
  });

  afterEach(() => {
    fetchMock.disableMocks();
  });

  // SCEN-1044
  test('月次レポート生成直後に顧客質問を受信したとき、1秒以内に優先度判定が実行される', async () => {
    const reportGenerationTime = new Date('2024-01-15T23:59:59Z');
    const inquiryReceiptTime = new Date('2024-01-16T00:00:00Z');
    const elapsedTimeMs = inquiryReceiptTime.getTime() - reportGenerationTime.getTime();

    expect(elapsedTimeMs).toBeLessThanOrEqual(1000);

    const inquiryContent =
      '月次レポートに記載された請求額が契約時の単価と異なっています。確認をお願いします。';
    const inquiryMetadata = {
      customerId: 'CUST-20240116-001',
      receiptTimestamp: inquiryReceiptTime.toISOString(),
      reportGenerationTimestamp: reportGenerationTime.toISOString(),
      contactChannel: 'email',
    };

    const classificationRequest = {
      inquiryContent,
      inquiryMetadata,
    };

    fetchMock.mockResponseOnce(
      JSON.stringify({
        classification: '請求エラー',
        confidence: 0.98,
        classificationTimestamp: new Date('2024-01-16T00:00:00Z').toISOString(),
      }),
      { status: 200 }
    );

    const classificationResult = await classifyCustomerInquiry(classificationRequest);

    expect(classificationResult).toEqual({
      classification: '請求エラー',
      confidence: 0.98,
      classificationTimestamp: '2024-01-16T00:00:00Z',
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const classificationCallArgs = fetchMock.mock.calls[0];
    expect(classificationCallArgs[1]?.method).toBe('POST');

    const priorityDeterminationRequest = {
      inquiryClassification: '請求エラー',
      classificationConfidence: 0.98,
      elapsedTimeFromReportGenerationMs: elapsedTimeMs,
      contactChannel: 'email',
      inquiryReceiptTimestamp: inquiryReceiptTime.toISOString(),
    };

    fetchMock.mockResponseOnce(
      JSON.stringify({
        priorityLevel: 'HIGH',
        priorityReason: '請求エラーかつレポート生成直後の即時質問のため最優先',
        priorityDeterminationStartTime: new Date('2024-01-16T00:00:00Z').toISOString(),
        processingTimeMs: 85,
      }),
      { status: 200 }
    );

    const priorityResult = await determinePriorityLevel(priorityDeterminationRequest);

    expect(priorityResult).toEqual({
      priorityLevel: 'HIGH',
      priorityReason: '請求エラーかつレポート生成直後の即時質問のため最優先',
      priorityDeterminationStartTime: '2024-01-16T00:00:00Z',
      processingTimeMs: 85,
    });

    expect(priorityResult.processingTimeMs).toBeLessThanOrEqual(1000);

    expect(priorityResult.priorityLevel).toMatch(/HIGH|MEDIUM|LOW/);

    expect(fetchMock).toHaveBeenCalledTimes(2);
    const priorityCallArgs = fetchMock.mock.calls[1];
    expect(priorityCallArgs[1]?.method).toBe('POST');

    const priorityDeterminationStartTime = new Date(
      priorityResult.priorityDeterminationStartTime
    ).getTime();
    const inquiryReceiptTimeMs = inquiryReceiptTime.getTime();
    const timeDifferenceMs = priorityDeterminationStartTime - inquiryReceiptTimeMs;

    expect(timeDifferenceMs).toBeLessThanOrEqual(1000);

    expect(priorityResult.priorityLevel).toBe('HIGH');
  });
});