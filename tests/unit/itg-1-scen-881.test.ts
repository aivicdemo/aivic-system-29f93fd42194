import { notifyManagerOnAnomalousValidationResult } from '../../src/logic/it-1-br-1781935279444-1-2-1';

const fetchMock = require('jest-fetch-mock');

describe('月次サマリーテンプレートの定義・管理機能', () => {
  test('SCEN-881: 検証結果異常時の上位管理者自動通知', async () => {
    fetchMock.resetMocks();

    // 検証結果が『不正の可能性あり』と判定される入力データセット
    const validationResult = {
      validationId: 'val-20240125-001',
      status: 'anomalous',
      verdict: '不正の可能性あり',
      verificationCompleteTime: '2024-01-25T10:30:00Z',
      verificationStaffId: 'staff-001',
      verificationStaffName: '検証担当者太郎',
      targetDataSet: {
        contractId: 'contract-2024-001',
        customerId: 'cust-001',
        serviceType: 'appoint_count',
        recordedValue: 150,
        expectedRange: { min: 0, max: 100 },
        anomalyReason: '記録値が期待範囲を大きく超過',
      },
      detectionDetails: {
        anomalyType: '異常値検出',
        severity: 'high',
        comparisonWithPrevious: '前月比 250% 超過',
        contractTermVerification: '契約条件不整合',
      },
    };

    // 上位管理者の一覧（複数）
    const managers = [
      {
        managerId: 'mgr-001',
        managerName: '営業部長山田',
        email: 'yamada@company.com',
      },
      {
        managerId: 'mgr-002',
        managerName: '経営管理責任者鈴木',
        email: 'suzuki@company.com',
      },
    ];

    // API: 上位管理者リスト取得
    fetchMock.mockResponseOnce(JSON.stringify(managers), { status: 200 });

    // API: 通知送信（1人目）
    fetchMock.mockResponseOnce(
      JSON.stringify({
        notificationId: 'notif-20240125-mgr001',
        recipientId: 'mgr-001',
        sentTime: '2024-01-25T10:30:15Z',
        status: 'sent',
      }),
      { status: 201 }
    );

    // API: 通知送信（2人目）
    fetchMock.mockResponseOnce(
      JSON.stringify({
        notificationId: 'notif-20240125-mgr002',
        recipientId: 'mgr-002',
        sentTime: '2024-01-25T10:30:15Z',
        status: 'sent',
      }),
      { status: 201 }
    );

    // 関数実行
    const result = await notifyManagerOnAnomalousValidationResult(
      validationResult
    );

    // assertion: 返り値の構造と内容を検証
    expect(result.notificationCampaignId).toBeDefined();
    expect(result.campaignStartTime).toBe('2024-01-25T10:30:15Z');
    expect(result.targetManagers.length).toBe(2);

    // assertion: 各マネージャーへの通知生成を検証
    expect(result.targetManagers[0]).toEqual({
      managerId: 'mgr-001',
      managerName: '営業部長山田',
      notificationId: 'notif-20240125-mgr001',
      sentTime: '2024-01-25T10:30:15Z',
      messagePreview:
        '【警告】検証結果異常: 不正の可能性あり - contract-2024-001',
    });

    expect(result.targetManagers[1]).toEqual({
      managerId: 'mgr-002',
      managerName: '経営管理責任者鈴木',
      notificationId: 'notif-20240125-mgr002',
      sentTime: '2024-01-25T10:30:15Z',
      messagePreview:
        '【警告】検証結果異常: 不正の可能性あり - contract-2024-001',
    });

    // assertion: 通知に含まれるメタデータ
    expect(result.notificationMetadata).toEqual({
      validationId: 'val-20240125-001',
      verificationStaffId: 'staff-001',
      verificationStaffName: '検証担当者太郎',
      verificationCompleteTime: '2024-01-25T10:30:00Z',
      verdict: '不正の可能性あり',
      anomalyType: '異常値検出',
      severity: 'high',
      affectedContractId: 'contract-2024-001',
      affectedCustomerId: 'cust-001',
      recordedValue: 150,
      expectedMin: 0,
      expectedMax: 100,
      anomalyReason: '記録値が期待範囲を大きく超過',
      comparisonWithPrevious: '前月比 250% 超過',
    });

    // assertion: 送信日時が検証完了日時から遅延していないことを確認
    expect(result.campaignStartTime).toBeDefined();
    const campaignTime = new Date(result.campaignStartTime).getTime();
    const verificationTime = new Date(
      validationResult.verificationCompleteTime
    ).getTime();
    expect(campaignTime - verificationTime).toBeLessThan(60000); // 1分以内

    // assertion: 複数マネージャーへの配信確認
    expect(result.deliveryStats).toEqual({
      totalManagerCount: 2,
      successCount: 2,
      failureCount: 0,
      allDelivered: true,
    });

    // assertion: API 呼び出し回数を検証（管理者取得1回 + 通知送信2回）
    expect(fetchMock.mock.calls.length).toBe(3);

    // assertion: エラーシナリオ - 管理者リスト取得失敗時
    fetchMock.resetMocks();
    fetchMock.mockResponseOnce(JSON.stringify({ error: 'Not Found' }), {
      status: 404,
    });

    await expect(
      notifyManagerOnAnomalousValidationResult(validationResult)
    ).rejects.toThrow(/上位管理者/);

    // assertion: エラーシナリオ - 判定が「不正の可能性あり」ではない場合は通知を送らない
    fetchMock.resetMocks();
    const safeValidationResult = { ...validationResult, verdict: '合格' };
    const safeResult = await notifyManagerOnAnomalousValidationResult(
      safeValidationResult
    );
    expect(safeResult.targetManagers.length).toBe(0);
    expect(safeResult.deliveryStats.totalManagerCount).toBe(0);
  });
});