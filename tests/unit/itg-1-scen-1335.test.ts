import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { validateSystemIntegrationCompatibility } from '../../src/logic/it-1-2-1';

const fetchMock = require('jest-fetch-mock');

describe('営業システム・バックオフィスシステム連携仕様検証', () => {
  beforeEach(() => {
    fetchMock.enableMocks();
    fetchMock.resetMocks();
  });

  afterEach(() => {
    fetchMock.disableMocks();
  });

  // SCEN-1335: [edge] 営業システム・バックオフィスシステム連携仕様検証 - データ更新頻度の非互換性検出
  test('営業システム日次更新とバックオフィスシステム時間単位更新の非互換性を検出し、アラート記録と通知メール送信を実行', async () => {
    // 前提条件: 営業システムのデータ更新頻度を「日次」に設定
    const salesSystemConfig = {
      systemId: 'SALES_SYSTEM_001',
      dataUpdateFrequency: 'daily',
      updateScheduleHourUtc: 3,
      lastUpdateTimestamp: new Date('2024-01-15T03:00:00Z').toISOString(),
    };

    // 前提条件: バックオフィスシステムのデータ更新頻度を「時間単位」に設定
    const backofficeSystemConfig = {
      systemId: 'BACKOFFICE_SYSTEM_001',
      dataUpdateFrequency: 'hourly',
      syncIntervalMinutes: 60,
      lastSyncTimestamp: new Date('2024-01-15T12:00:00Z').toISOString(),
    };

    // 両システムの連携設定を初期化
    const integrationConfig = {
      integrationId: 'INTEGRATION_SALES_TO_BACKOFFICE_001',
      sourceSystem: salesSystemConfig.systemId,
      targetSystem: backofficeSystemConfig.systemId,
      sourceUpdateFrequency: salesSystemConfig.dataUpdateFrequency,
      targetUpdateFrequency: backofficeSystemConfig.dataUpdateFrequency,
      enableErrorNotification: true,
      adminEmailAddress: 'admin@example.com',
      retryStrategy: 'exponential_backoff',
      maxRetryAttempts: 3,
    };

    // 営業システムから送信されるマスターデータ（顧客データ、売上データ）
    const masterDataFromSalesSystem = {
      dataType: 'customer_and_sales_master',
      customers: [
        {
          customerId: 'CUST_001',
          customerName: 'Test Company A',
          contractServiceType: 'service_A',
        },
        {
          customerId: 'CUST_002',
          customerName: 'Test Company B',
          contractServiceType: 'service_B',
        },
      ],
      salesData: [
        {
          recordId: 'SALES_REC_001',
          customerId: 'CUST_001',
          appointmentCount: 5,
          dealCount: 2,
          amount: 100000,
          recordDate: '2024-01-15',
        },
        {
          recordId: 'SALES_REC_002',
          customerId: 'CUST_002',
          appointmentCount: 3,
          dealCount: 1,
          amount: 50000,
          recordDate: '2024-01-15',
        },
      ],
      transmissionTimestamp: new Date('2024-01-15T03:15:00Z').toISOString(),
    };

    // バックオフィスシステムがデータ受信後、1時間以内にデータ同期処理を実行するシミュレーション
    const dataReceiptTimestamp = new Date('2024-01-15T03:16:00Z').toISOString();
    const expectedSyncExecutionTimestamp = new Date('2024-01-15T04:16:00Z').toISOString();

    // 営業システムが日次更新スケジュール（午前3時）でデータを送信する
    const nextSalesSystemUpdateTimestamp = new Date('2024-01-16T03:00:00Z').toISOString();

    // バックオフィスシステムの時間単位更新タイミングをシミュレート
    const backofficeUpdateTimestamps = [
      new Date('2024-01-15T04:00:00Z').toISOString(),
      new Date('2024-01-15T05:00:00Z').toISOString(),
      new Date('2024-01-15T06:00:00Z').toISOString(),
    ];

    // 連携ログに期待されるアラートレコード
    const expectedIntegrationLog = {
      logId: 'LOG_001',
      integrationId: integrationConfig.integrationId,
      timestamp: new Date('2024-01-15T04:16:00Z').toISOString(),
      severity: 'WARNING',
      eventType: 'FREQUENCY_MISMATCH_DETECTED',
      message: '更新頻度の不整合を検出',
      sourceSystem: salesSystemConfig.systemId,
      sourceFrequency: 'daily',
      targetSystem: backofficeSystemConfig.systemId,
      targetFrequency: 'hourly',
      incompatibilityDescription:
        '営業システムの日次更新とバックオフィスシステムの時間単位更新が競合する可能性あり',
      detectedConflictTimestamps: [
        new Date('2024-01-15T04:16:00Z').toISOString(),
        new Date('2024-01-15T05:16:00Z').toISOString(),
      ],
      systemStatus: 'OPERATIONAL_WITH_WARNING',
      retryStatus: 'PENDING',
    };

    // 管理者への通知メール期待内容
    const expectedAdminNotification = {
      notificationId: 'NOTIFY_001',
      recipientEmail: integrationConfig.adminEmailAddress,
      subject:
        '【警告】営業システムとバックオフィスシステム間でデータ更新頻度の不整合を検出しました',
      body: {
        alertType: '更新頻度非互換',
        sourceSystemFrequency: 'daily (毎日 03:00 UTC)',
        targetSystemFrequency: 'hourly (毎時間)',
        detectionTimestamp: new Date('2024-01-15T04:16:00Z').toISOString(),
        impactSummary:
          'データ同期タイミングの競合リスク、意図しない重複同期またはデータ漏れの可能性',
        recommendedAction:
          'バックオフィスシステムの更新頻度を日次に統一するか、営業システムの更新頻度を時間単位に統一してください',
        currentSystemStatus: 'OPERATIONAL_WITH_WARNING',
      },
      sentTimestamp: new Date('2024-01-15T04:20:00Z').toISOString(),
    };

    // エラーハンドリング機能のテスト用シミュレーション
    const simulatedSyncErrorScenario = {
      syncAttemptTimestamp: new Date('2024-01-15T04:16:00Z').toISOString(),
      errorType: 'SYNC_TIMING_CONFLICT',
      errorMessage: '営業システムからのデータ更新とバックオフィスシステムの同期処理が重複',
      retryAttempt: 1,
      retryDelay: 1000,
      nextRetryTimestamp: new Date('2024-01-15T04:17:00Z').toISOString(),
    };

    // Mock: 管理者への通知メール送信
    fetchMock.mockResponseOnce(
      JSON.stringify({
        notificationId: expectedAdminNotification.notificationId,
        status: 'sent',
        timestamp: expectedAdminNotification.sentTimestamp,
      }),
      { status: 200 }
    );

    // Mock: 連携ログへのアラート記録
    fetchMock.mockResponseOnce(
      JSON.stringify({
        logId: expectedIntegrationLog.logId,
        status: 'recorded',
        timestamp: expectedIntegrationLog.timestamp,
      }),
      { status: 200 }
    );

    // Mock: リトライ処理の成功
    fetchMock.mockResponseOnce(
      JSON.stringify({
        retryAttempt: simulatedSyncErrorScenario.retryAttempt,
        status: 'queued_for_retry',
        nextRetryTimestamp: simulatedSyncErrorScenario.nextRetryTimestamp,
      }),
      { status: 200 }
    );

    // 関数を呼び出し: validateSystemIntegrationCompatibility
    const result = await validateSystemIntegrationCompatibility({
      sourceSystemConfig: salesSystemConfig,
      targetSystemConfig: backofficeSystemConfig,
      integrationConfig: integrationConfig,
      masterDataPayload: masterDataFromSalesSystem,
      dataReceiptTimestamp: dataReceiptTimestamp,
      nextSourceUpdateSchedule: nextSalesSystemUpdateTimestamp,
      targetUpdateTimestamps: backofficeUpdateTimestamps,
      adminEmailAddress: integrationConfig.adminEmailAddress,
      enableErrorHandling: true,
      enableNotification: integrationConfig.enableErrorNotification,
    });

    // Assertion 1: システムが非互換性を検出したことを確認
    expect(result).toEqual(
      expect.objectContaining({
        compatibilityStatus: 'INCOMPATIBLE',
        incompatibilityType: 'FREQUENCY_MISMATCH',
        sourceFrequency: 'daily',
        targetFrequency: 'hourly',
        isConflictDetected: true,
      })
    );

    // Assertion 2: 連携ログに『更新頻度の不整合を検出』というアラートが記録されたことを確認
    expect(result).toEqual(
      expect.objectContaining({
        integrationLogRecords: expect.arrayContaining([
          expect.objectContaining({
            severity: 'WARNING',
            eventType: 'FREQUENCY_MISMATCH_DETECTED',
            message: expect.stringMatching(/更新頻度の不整合を検出/),
            sourceFrequency: 'daily',
            targetFrequency: 'hourly',
          }),
        ]),
      })
    );

    // Assertion 3: 管理者への通知メールが送信されたことを確認
    expect(result).toEqual(
      expect.objectContaining({
        adminNotificationSent: true,
        adminNotificationRecipient: integrationConfig.adminEmailAddress,
        notificationTimestamp: expect.any(String),
      })
    );

    // Assertion 4: システム監視機能で非互換性が記録されたことを確認
    expect(result).toEqual(
      expect.objectContaining({
        systemMonitoringStatus: 'OPERATIONAL_WITH_WARNING',
        warningRecordedInMonitoring: true,
        monitoringAlertTimestamp: expect.any(String),
      })
    );

    // Assertion 5: データ同期エラーが発生した場合の回復手段（リトライ、キューイング）が機能していることを確認
    expect(result).toEqual(
      expect.objectContaining({
        errorHandlingApplied: true,
        retryStrategyEnabled: true,
        retryStrategy: 'exponential_backoff',
        maxRetryAttempts: 3,
        currentRetryAttempt: expect.any(Number),
        dataQueuedForRetry: true,
      })
    );

    // Assertion 6: システムの安定性を保ちながら警告状態で連携が継続されていることを確認
    expect(result).toEqual(
      expect.objectContaining({
        integrationContinued: true,
        integrationStatus: 'ACTIVE',
        operationalMode: 'DEGRADED_SAFE',
        dataIntegrityMaintained: true,
        dataLossRiskMitigated: true,
      })
    );

    // Assertion 7: データ受信から同期処理実行までの時間が期待値以内であることを確認
    const receivedTimestamp = new Date(dataReceiptTimestamp).getTime();
    const syncExecutionTimestamp = new Date(
      result.actualSyncExecutionTimestamp
    ).getTime();
    const syncDelayMilliseconds = syncExecutionTimestamp - receivedTimestamp;
    expect(syncDelayMilliseconds).toBeLessThanOrEqual(3600000); // 1時間以内

    // Assertion 8: 複数の更新タイミング競合が検出されたことを確認
    expect(result.detectedConflictCount).toBeGreaterThanOrEqual(1);
    expect(result.conflictTimestamps).toEqual(
      expect.arrayContaining([expect.any(String)])
    );

    // Assertion 9: 連携ログに十分な情報が記録されているか検証
    expect(result.integrationLogRecords).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          logId: expect.any(String),
          timestamp: expect.any(String),
          severity: 'WARNING',
          message: expect.stringMatching(/更新頻度の不整合を検出/),
          sourceSystem: salesSystemConfig.systemId,
          targetSystem: backofficeSystemConfig.systemId,
        }),
      ])
    );

    // Assertion 10: 管理者への通知メール内容に推奨アクションが含まれているか確認
    expect(result.adminNotificationContent).toEqual(
      expect.objectContaining({
        alertType: 'FREQUENCY_MISMATCH',
        sourceFrequency: 'daily',
        targetFrequency: 'hourly',
        recommendedActions: expect.arrayContaining([expect.any(String)]),
      })
    );
  });
});