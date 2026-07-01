import { describe, test, expect, beforeEach } from '@jest/globals';
import { notifyManagerOnValidationError } from '../../src/logic/it-1-br-1781935279444-1-2-1';

describe('月次サマリーテンプレート検証時の上位管理者自動通知', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // SCEN-880: [normal] 検証結果異常時の上位管理者自動通知
  test('検証結果が誤りありと判定された場合、検証担当者から上位管理者への自動通知が生成される', () => {
    const validationResultId = 'val_result_20240125_001';
    const validatorName = '田中太郎';
    const validatorUserId = 'user_validator_001';
    const managerUserId = 'user_manager_001';
    const managerEmail = 'manager@example.com';
    const targetDataId = 'sales_data_20240125_A';
    const targetDataInfo = {
      customerId: 'cust_001',
      customerName: '顧客A企業',
      serviceId: 'srv_001',
      serviceName: 'アポイント成約支援',
      dataType: 'monthly_summary',
      periodStart: '2024-01-01',
      periodEnd: '2024-01-31',
    };
    const validationErrors = [
      {
        field: 'contract_amount',
        expectedValue: 150000,
        actualValue: 100000,
        errorType: 'value_mismatch',
        errorDescription: '契約金額が請求ルールと不一致',
      },
      {
        field: 'appointment_count',
        expectedValue: 25,
        actualValue: 20,
        errorType: 'calculation_error',
        errorDescription: 'アポ数の集計ロジックエラー',
      },
    ];
    const validationCompletedAt = new Date('2024-01-25T14:30:00Z');
    const validationResult = 'error_found';

    const result = notifyManagerOnValidationError({
      validationResultId,
      validatorName,
      validatorUserId,
      managerUserId,
      managerEmail,
      targetDataId,
      targetDataInfo,
      validationErrors,
      validationCompletedAt,
      validationResult,
    });

    // 通知が生成されたことを確認
    expect(result.notificationGenerated).toBe(true);

    // 通知ID が生成されていることを確認
    expect(result.notificationId).toBeTruthy();
    expect(typeof result.notificationId).toBe('string');

    // 通知タイプが正しいことを確認
    expect(result.notificationType).toBe('validation_error_alert');

    // 通知の送信先が正しい上位管理者であることを確認
    expect(result.recipientUserId).toBe(managerUserId);
    expect(result.recipientEmail).toBe(managerEmail);

    // 通知メッセージに検証担当者情報が含まれていることを確認
    expect(result.notificationMessage).toContain(validatorName);
    expect(result.notificationMessage).toContain(validatorUserId);

    // 通知メッセージに検証結果の詳細が含まれていることを確認
    expect(result.notificationMessage).toContain('誤りあり');
    expect(result.notificationMessage).toContain('contract_amount');
    expect(result.notificationMessage).toContain('appointment_count');

    // 通知メッセージに対象データ情報が含まれていることを確認
    expect(result.notificationMessage).toContain(targetDataInfo.customerId);
    expect(result.notificationMessage).toContain(targetDataInfo.customerName);
    expect(result.notificationMessage).toContain(targetDataInfo.serviceName);
    expect(result.notificationMessage).toContain(targetDataInfo.periodStart);
    expect(result.notificationMessage).toContain(targetDataInfo.periodEnd);

    // 通知生成時刻が検証完了時刻と一致していることを確認
    expect(result.notificationGeneratedAt).toEqual(new Date('2024-01-25T14:30:00Z'));
    expect(result.notificationGeneratedAt.getTime()).toBe(validationCompletedAt.getTime());

    // 通知ステータスが送信待ちであることを確認
    expect(result.notificationStatus).toBe('pending');

    // 検証対象データのIDが正しく記録されていることを確認
    expect(result.targetValidationResultId).toBe(validationResultId);
    expect(result.targetDataId).toBe(targetDataId);

    // エラーカウントが正しいことを確認
    expect(result.errorCount).toBe(2);

    // エラー内容の詳細配列が正しく格納されていることを確認
    expect(result.errorDetails).toHaveLength(2);
    expect(result.errorDetails[0].field).toBe('contract_amount');
    expect(result.errorDetails[0].errorType).toBe('value_mismatch');
    expect(result.errorDetails[1].field).toBe('appointment_count');
    expect(result.errorDetails[1].errorType).toBe('calculation_error');

    // 通知優先度が高に設定されていることを確認
    expect(result.notificationPriority).toBe('high');

    // リトライ設定が適切に構成されていることを確認
    expect(result.retryConfig).toBeDefined();
    expect(result.retryConfig.maxRetries).toBe(3);
    expect(result.retryConfig.retryIntervalMinutes).toBe(5);
  });
});