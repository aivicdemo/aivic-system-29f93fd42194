import { sendPromptNotificationForContractChangeApproval } from '../../src/logic/it-1781935279444-2-2-1';

describe('契約変更確認催促通知機能', () => {
  // SCEN-1249
  test('営業責任者の承認状態が不正な場合にエラーとなる', () => {
    // 無効な承認状態: null
    expect(() =>
      sendPromptNotificationForContractChangeApproval({
        contractChangeId: 'CHANGE-001',
        businessPartnerId: 'BP-123',
        businessPartnerEmail: 'contact@example.com',
        approvalStatus: null as any,
        notificationSentAt: new Date('2024-12-20T10:00:00Z'),
        reminderThresholdDays: 3,
      })
    ).toThrow(/承認状態/);

    // 無効な承認状態: undefined
    expect(() =>
      sendPromptNotificationForContractChangeApproval({
        contractChangeId: 'CHANGE-002',
        businessPartnerId: 'BP-456',
        businessPartnerEmail: 'contact2@example.com',
        approvalStatus: undefined as any,
        notificationSentAt: new Date('2024-12-20T10:00:00Z'),
        reminderThresholdDays: 3,
      })
    ).toThrow(/承認状態/);

    // 無効な承認状態: 無効な文字列
    expect(() =>
      sendPromptNotificationForContractChangeApproval({
        contractChangeId: 'CHANGE-003',
        businessPartnerId: 'BP-789',
        businessPartnerEmail: 'contact3@example.com',
        approvalStatus: 'INVALID_STATUS' as any,
        notificationSentAt: new Date('2024-12-20T10:00:00Z'),
        reminderThresholdDays: 3,
      })
    ).toThrow(/承認状態/);

    // 無効な承認状態: 空文字列
    expect(() =>
      sendPromptNotificationForContractChangeApproval({
        contractChangeId: 'CHANGE-004',
        businessPartnerId: 'BP-012',
        businessPartnerEmail: 'contact4@example.com',
        approvalStatus: '',
        notificationSentAt: new Date('2024-12-20T10:00:00Z'),
        reminderThresholdDays: 3,
      })
    ).toThrow(/承認状態/);

    // 無効なメールアドレス
    expect(() =>
      sendPromptNotificationForContractChangeApproval({
        contractChangeId: 'CHANGE-005',
        businessPartnerId: 'BP-345',
        businessPartnerEmail: 'invalid-email',
        approvalStatus: 'PENDING',
        notificationSentAt: new Date('2024-12-20T10:00:00Z'),
        reminderThresholdDays: 3,
      })
    ).toThrow(/メールアドレス/);

    // 無効なcontractChangeId
    expect(() =>
      sendPromptNotificationForContractChangeApproval({
        contractChangeId: '',
        businessPartnerId: 'BP-678',
        businessPartnerEmail: 'contact5@example.com',
        approvalStatus: 'PENDING',
        notificationSentAt: new Date('2024-12-20T10:00:00Z'),
        reminderThresholdDays: 3,
      })
    ).toThrow(/契約変更ID/);

    // 無効なbusinessPartnerId
    expect(() =>
      sendPromptNotificationForContractChangeApproval({
        contractChangeId: 'CHANGE-006',
        businessPartnerId: null as any,
        businessPartnerEmail: 'contact6@example.com',
        approvalStatus: 'PENDING',
        notificationSentAt: new Date('2024-12-20T10:00:00Z'),
        reminderThresholdDays: 3,
      })
    ).toThrow(/パートナーID/);

    // notificationSentAtが未来の日時
    expect(() =>
      sendPromptNotificationForContractChangeApproval({
        contractChangeId: 'CHANGE-007',
        businessPartnerId: 'BP-901',
        businessPartnerEmail: 'contact7@example.com',
        approvalStatus: 'PENDING',
        notificationSentAt: new Date('2099-12-31T23:59:59Z'),
        reminderThresholdDays: 3,
      })
    ).toThrow(/通知日時/);

    // reminderThresholdDaysが負の値
    expect(() =>
      sendPromptNotificationForContractChangeApproval({
        contractChangeId: 'CHANGE-008',
        businessPartnerId: 'BP-234',
        businessPartnerEmail: 'contact8@example.com',
        approvalStatus: 'PENDING',
        notificationSentAt: new Date('2024-12-20T10:00:00Z'),
        reminderThresholdDays: -1,
      })
    ).toThrow(/閾値/);
  });
});