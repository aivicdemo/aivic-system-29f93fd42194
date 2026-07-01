import { notifyContractChanges } from '../../src/logic/it-1-1-1';

describe('営業成果データの自動検証ルール定義と異常検出機能', () => {
  // SCEN-1073: [normal] 契約・成果物変更通知機能 - 複数の変更内容が同時に発生した場合、全ての変更内容と影響範囲が正確に通知メールに含まれる
  test('複数の変更内容が同時に発生した場合、全ての変更項目と影響範囲が通知メール本文に正確に含まれ、全ての受取人に配信されること', async () => {
    const contractId = 'CONTRACT-001';
    const contractName = 'ABC社 営業支援契約';
    const customerId = 'CUST-001';
    const changedByUserId = 'USER-123';
    const changedByUserName = '営業オペレーター 太郎';
    const changeTimestamp = new Date('2024-06-15T14:30:00Z');

    const changeDetails = {
      contractAmount: {
        oldValue: 500000,
        newValue: 600000,
        unit: '円',
        impactFields: ['請求予定日', '割引計算対象額']
      },
      contractPeriod: {
        oldValue: '2024-01-01～2024-12-31',
        newValue: '2024-01-01～2025-12-31',
        unit: '日付範囲',
        impactFields: ['請求期間', '成果物納期スケジュール']
      },
      deliverableDeadline: {
        oldValue: '2024-12-31',
        newValue: '2025-06-30',
        unit: '日付',
        impactFields: ['納期実績確認タイミング', '請求内容確認期限']
      },
      customerName: {
        oldValue: 'ABC社',
        newValue: 'ABC社（子会社統合後）',
        unit: '文字列',
        impactFields: ['請求書送付先', 'レポート配信先']
      }
    };

    const recipientEmails = [
      { email: 'contract-owner@customer.com', role: '契約者' },
      { email: 'sales-rep@agency.com', role: '営業担当者' },
      { email: 'admin@agency.com', role: '事務担当者' }
    ];

    const result = await notifyContractChanges({
      contractId,
      contractName,
      customerId,
      changeDetails,
      changedByUserId,
      changedByUserName,
      changeTimestamp,
      recipientEmails
    });

    // (1) 全ての変更項目が通知メール本文に明記されていること
    expect(result.emailBody).toContain('契約金額');
    expect(result.emailBody).toContain('契約期間');
    expect(result.emailBody).toContain('成果物納期');
    expect(result.emailBody).toContain('顧客名');

    // (2) 各項目の変更前後の値が正確に記載されていること
    expect(result.emailBody).toContain('500000');
    expect(result.emailBody).toContain('600000');
    expect(result.emailBody).toContain('2024-01-01～2024-12-31');
    expect(result.emailBody).toContain('2024-01-01～2025-12-31');
    expect(result.emailBody).toContain('2024-12-31');
    expect(result.emailBody).toContain('2025-06-30');
    expect(result.emailBody).toContain('ABC社');
    expect(result.emailBody).toContain('ABC社（子会社統合後）');

    // (3) 変更による影響範囲が詳細に記載されていること
    expect(result.emailBody).toContain('請求予定日');
    expect(result.emailBody).toContain('割引計算対象額');
    expect(result.emailBody).toContain('請求期間');
    expect(result.emailBody).toContain('成果物納期スケジュール');
    expect(result.emailBody).toContain('納期実績確認タイミング');
    expect(result.emailBody).toContain('請求内容確認期限');
    expect(result.emailBody).toContain('請求書送付先');
    expect(result.emailBody).toContain('レポート配信先');

    // (4) メールが指定された全ての受取人に正常に配信されていること
    expect(result.sentTo).toHaveLength(3);
    expect(result.sentTo).toContain('contract-owner@customer.com');
    expect(result.sentTo).toContain('sales-rep@agency.com');
    expect(result.sentTo).toContain('admin@agency.com');

    // (5) メール送信の失敗やタイムアウトが発生しないこと
    expect(result.status).toBe('success');
    expect(result.deliveryStatus).toEqual({
      'contract-owner@customer.com': 'delivered',
      'sales-rep@agency.com': 'delivered',
      'admin@agency.com': 'delivered'
    });

    // 追加: メールヘッダに変更者情報と変更日時が含まれていること
    expect(result.emailSubject).toContain(contractName);
    expect(result.emailBody).toContain(changedByUserName);
    expect(result.emailBody).toContain('2024-06-15');

    // 追加: 変更の影響範囲の警告が独立したセクションとして含まれていること
    expect(result.impactSummarySection).toBeDefined();
    expect(result.impactSummarySection).toContain('影響範囲');
    expect(result.impactSummarySection).toContain('注意');

    // 追加: 各受取人に対して正しいロール別情報が送信されていること
    expect(result.recipientDetails).toHaveLength(3);
    const contractOwnerNotification = result.recipientDetails.find(
      (r: any) => r.email === 'contract-owner@customer.com'
    );
    expect(contractOwnerNotification?.role).toBe('契約者');
    expect(contractOwnerNotification?.status).toBe('delivered');
  });
});