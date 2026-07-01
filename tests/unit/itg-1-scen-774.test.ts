import { validateLatestVersionNotificationConfig } from '../../src/logic/it-1781935279444-2-2-1';

describe('営業データの完全性・正確性を自動検証し、不足データ・誤りを検出・通知する機能', () => {
  // SCEN-774: [error] 最新版リリース通知自動配信機能 - 通知対象営業担当者が定義されていない場合にエラーとして検出される
  test('通知対象営業担当者が未定義の場合、エラーとして適切に検出される', () => {
    const configWithoutSalesStaff = {
      notificationId: 'notif-001',
      documentType: '契約書',
      documentVersion: 'v2.1',
      targetSalesStaffIds: [],
      notificationDateTime: new Date('2024-01-15T09:00:00Z'),
      messageTemplate: '最新版をリリースしました',
      isEnabled: true,
    };

    expect(() =>
      validateLatestVersionNotificationConfig(configWithoutSalesStaff)
    ).toThrow(/通知対象営業担当者/);
  });

  test('通知対象営業担当者が null の場合、エラーとして適切に検出される', () => {
    const configWithNullSalesStaff = {
      notificationId: 'notif-002',
      documentType: '提案資料',
      documentVersion: 'v1.5',
      targetSalesStaffIds: null,
      notificationDateTime: new Date('2024-01-15T10:00:00Z'),
      messageTemplate: '提案資料の最新版が利用可能です',
      isEnabled: true,
    };

    expect(() =>
      validateLatestVersionNotificationConfig(configWithNullSalesStaff)
    ).toThrow(/通知対象営業担当者/);
  });

  test('通知対象営業担当者が undefined の場合、エラーとして適切に検出される', () => {
    const configWithUndefinedSalesStaff = {
      notificationId: 'notif-003',
      documentType: '契約書',
      documentVersion: 'v3.0',
      targetSalesStaffIds: undefined,
      notificationDateTime: new Date('2024-01-15T11:00:00Z'),
      messageTemplate: '新しい契約書テンプレートをリリースしました',
      isEnabled: true,
    };

    expect(() =>
      validateLatestVersionNotificationConfig(configWithUndefinedSalesStaff)
    ).toThrow(/通知対象営業担当者/);
  });

  test('通知対象営業担当者が定義されている場合、バリデーション成功し設定が確定される', () => {
    const validConfig = {
      notificationId: 'notif-004',
      documentType: '契約書',
      documentVersion: 'v2.1',
      targetSalesStaffIds: ['staff-001', 'staff-002', 'staff-003'],
      notificationDateTime: new Date('2024-01-15T09:00:00Z'),
      messageTemplate: '最新版をリリースしました',
      isEnabled: true,
    };

    const result = validateLatestVersionNotificationConfig(validConfig);

    expect(result).toEqual({
      isValid: true,
      notificationId: 'notif-004',
      documentType: '契約書',
      documentVersion: 'v2.1',
      targetSalesStaffCount: 3,
      notificationDateTime: new Date('2024-01-15T09:00:00Z'),
      messageTemplate: '最新版をリリースしました',
      isEnabled: true,
      validationMessage: '通知設定は正常です。配信準備完了。',
    });
  });

  test('通知対象営業担当者が 1 名のみの場合、バリデーション成功し設定が確定される', () => {
    const configWithSingleStaff = {
      notificationId: 'notif-005',
      documentType: '提案資料',
      documentVersion: 'v1.0',
      targetSalesStaffIds: ['staff-100'],
      notificationDateTime: new Date('2024-01-16T14:30:00Z'),
      messageTemplate: '提案資料の新版が利用可能です',
      isEnabled: true,
    };

    const result = validateLatestVersionNotificationConfig(configWithSingleStaff);

    expect(result).toEqual({
      isValid: true,
      notificationId: 'notif-005',
      documentType: '提案資料',
      documentVersion: 'v1.0',
      targetSalesStaffCount: 1,
      notificationDateTime: new Date('2024-01-16T14:30:00Z'),
      messageTemplate: '提案資料の新版が利用可能です',
      isEnabled: true,
      validationMessage: '通知設定は正常です。配信準備完了。',
    });
  });
});