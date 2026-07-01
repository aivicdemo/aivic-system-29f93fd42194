import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { broadcastLatestVersionReleaseNotification } from '../../src/logic/it-1-br-1781935279444-1-2-1';

const fetchMock = require('jest-fetch-mock');
fetchMock.enableMocks();

describe('月次サマリーテンプレート定義・管理機能 - 最新版リリース通知自動配信', () => {
  beforeEach(() => {
    fetchMock.resetMocks();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // SCEN-776: [edge] 最新版リリース通知自動配信機能 - 通知対象が 0 名の場合
  test('should successfully broadcast notification with zero target users', async () => {
    const releaseNotificationPayload = {
      templateId: 'tpl_monthly_summary_001',
      templateVersionId: 'ver_20250115_001',
      templateName: '月次サマリーテンプレート v2.0',
      releaseNotes: '新機能: グラフ表示、パフォーマンス改善',
      releasedAt: '2025-01-15T09:00:00Z',
      targetUserIds: [], // 通知対象が0名
      deliveryMethod: 'email',
      requiredConfirmationBy: '2025-01-20T23:59:59Z',
    };

    const mockResponse = {
      statusCode: 200,
      success: true,
      message: 'Release notification broadcast completed',
      data: {
        totalTargetCount: 0,
        successfulDeliveries: 0,
        failedDeliveries: 0,
        skippedCount: 0,
        processingStatus: 'completed',
        timestamp: '2025-01-15T09:05:00Z',
        notificationLogId: 'log_20250115_00001',
      },
      errors: [],
      warnings: [],
    };

    fetchMock.mockResponseOnce(JSON.stringify(mockResponse), { status: 200 });

    const result = await broadcastLatestVersionReleaseNotification(releaseNotificationPayload);

    expect(result).toBeDefined();
    expect(result.statusCode).toBe(200);
    expect(result.success).toBe(true);
    expect(result.data.totalTargetCount).toBe(0);
    expect(result.data.successfulDeliveries).toBe(0);
    expect(result.data.failedDeliveries).toBe(0);
    expect(result.data.skippedCount).toBe(0);
    expect(result.data.processingStatus).toBe('completed');
    expect(result.errors).toEqual([]);
    expect(result.warnings).toEqual([]);
    expect(result.data.notificationLogId).toBeDefined();
    expect(result.data.notificationLogId).toMatch(/^log_/);

    const callArgs = fetchMock.mock.calls[0];
    expect(callArgs[0]).toContain('/api/v1/notifications/broadcast');
    expect(callArgs[1].method).toBe('POST');
  });

  test('should handle zero target users and record delivery status correctly', async () => {
    const releaseNotificationPayload = {
      templateId: 'tpl_monthly_summary_002',
      templateVersionId: 'ver_20250116_001',
      templateName: '月次サマリーテンプレート v2.1',
      releaseNotes: 'バグ修正',
      releasedAt: '2025-01-16T10:00:00Z',
      targetUserIds: [],
      deliveryMethod: 'portal',
      requiredConfirmationBy: '2025-01-21T23:59:59Z',
    };

    const mockResponse = {
      statusCode: 200,
      success: true,
      message: 'Release notification broadcast completed',
      data: {
        totalTargetCount: 0,
        successfulDeliveries: 0,
        failedDeliveries: 0,
        skippedCount: 0,
        processingStatus: 'completed',
        timestamp: '2025-01-16T10:05:00Z',
        notificationLogId: 'log_20250116_00001',
        deliveryStatus: 'no_targets',
        notificationHistoryRecords: [],
      },
      errors: [],
      warnings: [],
    };

    fetchMock.mockResponseOnce(JSON.stringify(mockResponse), { status: 200 });

    const result = await broadcastLatestVersionReleaseNotification(releaseNotificationPayload);

    expect(result.statusCode).toBe(200);
    expect(result.success).toBe(true);
    expect(result.data.deliveryStatus).toBe('no_targets');
    expect(result.data.notificationHistoryRecords).toEqual([]);
    expect(Array.isArray(result.data.notificationHistoryRecords)).toBe(true);
    expect(result.errors.length).toBe(0);
  });

  test('should maintain data integrity when processing zero target users', async () => {
    const releaseNotificationPayload = {
      templateId: 'tpl_monthly_summary_003',
      templateVersionId: 'ver_20250117_001',
      templateName: '月次サマリーテンプレート v2.2',
      releaseNotes: 'セキュリティ更新',
      releasedAt: '2025-01-17T08:30:00Z',
      targetUserIds: [],
      deliveryMethod: 'email',
      requiredConfirmationBy: '2025-01-22T23:59:59Z',
    };

    const mockResponse = {
      statusCode: 200,
      success: true,
      message: 'Release notification broadcast completed',
      data: {
        totalTargetCount: 0,
        successfulDeliveries: 0,
        failedDeliveries: 0,
        skippedCount: 0,
        processingStatus: 'completed',
        timestamp: '2025-01-17T08:35:00Z',
        notificationLogId: 'log_20250117_00001',
        databaseRecordsCreated: 0,
        dataIntegrityCheck: {
          orphanRecordsFound: 0,
          duplicateRecordsFound: 0,
          integrityStatus: 'valid',
        },
      },
      errors: [],
      warnings: [],
    };

    fetchMock.mockResponseOnce(JSON.stringify(mockResponse), { status: 200 });

    const result = await broadcastLatestVersionReleaseNotification(releaseNotificationPayload);

    expect(result.statusCode).toBe(200);
    expect(result.success).toBe(true);
    expect(result.data.databaseRecordsCreated).toBe(0);
    expect(result.data.dataIntegrityCheck.orphanRecordsFound).toBe(0);
    expect(result.data.dataIntegrityCheck.duplicateRecordsFound).toBe(0);
    expect(result.data.dataIntegrityCheck.integrityStatus).toBe('valid');
    expect(result.errors.length).toBe(0);
  });

  test('should log broadcast activity correctly even with zero targets', async () => {
    const releaseNotificationPayload = {
      templateId: 'tpl_monthly_summary_004',
      templateVersionId: 'ver_20250118_001',
      templateName: '月次サマリーテンプレート v2.3',
      releaseNotes: '新しいレイアウト',
      releasedAt: '2025-01-18T14:00:00Z',
      targetUserIds: [],
      deliveryMethod: 'email',
      requiredConfirmationBy: '2025-01-23T23:59:59Z',
    };

    const mockResponse = {
      statusCode: 200,
      success: true,
      message: 'Release notification broadcast completed',
      data: {
        totalTargetCount: 0,
        successfulDeliveries: 0,
        failedDeliveries: 0,
        skippedCount: 0,
        processingStatus: 'completed',
        timestamp: '2025-01-18T14:05:00Z',
        notificationLogId: 'log_20250118_00001',
        logRecord: {
          logId: 'log_20250118_00001',
          eventType: 'BROADCAST_ZERO_TARGETS',
          templateId: 'tpl_monthly_summary_004',
          templateVersionId: 'ver_20250118_001',
          executedAt: '2025-01-18T14:05:00Z',
          executedBy: 'system',
          status: 'completed',
          details: {
            targetCount: 0,
            deliveryCount: 0,
            result: 'no_action_required',
          },
        },
      },
      errors: [],
      warnings: [],
    };

    fetchMock.mockResponseOnce(JSON.stringify(mockResponse), { status: 200 });

    const result = await broadcastLatestVersionReleaseNotification(releaseNotificationPayload);

    expect(result.statusCode).toBe(200);
    expect(result.success).toBe(true);
    expect(result.data.logRecord).toBeDefined();
    expect(result.data.logRecord.logId).toBe('log_20250118_00001');
    expect(result.data.logRecord.status).toBe('completed');
    expect(result.data.logRecord.details.targetCount).toBe(0);
    expect(result.data.logRecord.details.deliveryCount).toBe(0);
    expect(result.data.logRecord.details.result).toBe('no_action_required');
  });

  test('should not create spurious notification history records for zero targets', async () => {
    const releaseNotificationPayload = {
      templateId: 'tpl_monthly_summary_005',
      templateVersionId: 'ver_20250119_001',
      templateName: '月次サマリーテンプレート v2.4',
      releaseNotes: 'パフォーマンス最適化',
      releasedAt: '2025-01-19T11:00:00Z',
      targetUserIds: [],
      deliveryMethod: 'email',
      requiredConfirmationBy: '2025-01-24T23:59:59Z',
    };

    const mockResponse = {
      statusCode: 200,
      success: true,
      message: 'Release notification broadcast completed',
      data: {
        totalTargetCount: 0,
        successfulDeliveries: 0,
        failedDeliveries: 0,
        skippedCount: 0,
        processingStatus: 'completed',
        timestamp: '2025-01-19T11:05:00Z',
        notificationLogId: 'log_20250119_00001',
        notificationHistoryStatus: {
          recordsToCreate: 0,
          recordsCreated: 0,
          validationPassed: true,
        },
      },
      errors: [],
      warnings: [],
    };

    fetchMock.mockResponseOnce(JSON.stringify(mockResponse), { status: 200 });

    const result = await broadcastLatestVersionReleaseNotification(releaseNotificationPayload);

    expect(result.statusCode).toBe(200);
    expect(result.success).toBe(true);
    expect(result.data.notificationHistoryStatus.recordsToCreate).toBe(0);
    expect(result.data.notificationHistoryStatus.recordsCreated).toBe(0);
    expect(result.data.notificationHistoryStatus.validationPassed).toBe(true);
  });

  test('should return consistent message for zero-target notification broadcasts', async () => {
    const releaseNotificationPayload = {
      templateId: 'tpl_monthly_summary_006',
      templateVersionId: 'ver_20250120_001',
      templateName: '月次サマリーテンプレート v2.5',
      releaseNotes: 'UI改善',
      releasedAt: '2025-01-20T09:30:00Z',
      targetUserIds: [],
      deliveryMethod: 'email',
      requiredConfirmationBy: '2025-01-25T23:59:59Z',
    };

    const mockResponse = {
      statusCode: 200,
      success: true,
      message: 'Release notification broadcast completed',
      data: {
        totalTargetCount: 0,
        successfulDeliveries: 0,
        failedDeliveries: 0,
        skippedCount: 0,
        processingStatus: 'completed',
        timestamp: '2025-01-20T09:35:00Z',
        notificationLogId: 'log_20250120_00001',
        resultSummary: 'Broadcast processed successfully with no targets identified. No notifications were sent.',
      },
      errors: [],
      warnings: [],
    };

    fetchMock.mockResponseOnce(JSON.stringify(mockResponse), { status: 200 });

    const result = await broadcastLatestVersionReleaseNotification(releaseNotificationPayload);

    expect(result.statusCode).toBe(200);
    expect(result.success).toBe(true);
    expect(result.message).toBe('Release notification broadcast completed');
    expect(result.data.resultSummary).toContain('no targets');
    expect(result.data.resultSummary).toContain('successfully');
  });
});