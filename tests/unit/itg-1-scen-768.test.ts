import { sendLatestVersionNotification } from '../../src/logic/it-1-br-1781935279444-1-2-1';

describe('月次サマリーテンプレートの定義・管理機能', () => {
  test('SCEN-768: [error] 最新版リリース通知の自動配信 - 通知内容に必須項目が不足している場合に配信が失敗する', () => {
    // ケース1: タイトルが空の場合、エラー送出
    expect(() =>
      sendLatestVersionNotification({
        title: '',
        body: '新しいバージョンがリリースされました',
        distributionTargets: ['user001@example.com'],
        releaseVersion: '2.1.0',
        releaseDate: '2024-01-15',
        changeLog: '- 新機能追加\n- バグ修正'
      })
    ).toThrow(/タイトル/);

    // ケース2: 本文が空の場合、エラー送出
    expect(() =>
      sendLatestVersionNotification({
        title: '最新版リリースのお知らせ',
        body: '',
        distributionTargets: ['user001@example.com'],
        releaseVersion: '2.1.0',
        releaseDate: '2024-01-15',
        changeLog: '- 新機能追加\n- バグ修正'
      })
    ).toThrow(/本文/);

    // ケース3: 配信対象が空配列の場合、エラー送出
    expect(() =>
      sendLatestVersionNotification({
        title: '最新版リリースのお知らせ',
        body: '新しいバージョンがリリースされました',
        distributionTargets: [],
        releaseVersion: '2.1.0',
        releaseDate: '2024-01-15',
        changeLog: '- 新機能追加\n- バグ修正'
      })
    ).toThrow(/配信対象/);

    // ケース4: リリースバージョンが空の場合、エラー送出
    expect(() =>
      sendLatestVersionNotification({
        title: '最新版リリースのお知らせ',
        body: '新しいバージョンがリリースされました',
        distributionTargets: ['user001@example.com'],
        releaseVersion: '',
        releaseDate: '2024-01-15',
        changeLog: '- 新機能追加\n- バグ修正'
      })
    ).toThrow(/リリースバージョン/);

    // ケース5: すべての必須項目が揃っている場合、成功
    const result = sendLatestVersionNotification({
      title: '最新版リリースのお知らせ',
      body: '新しいバージョンがリリースされました',
      distributionTargets: ['user001@example.com', 'user002@example.com'],
      releaseVersion: '2.1.0',
      releaseDate: '2024-01-15',
      changeLog: '- 新機能追加\n- バグ修正'
    });

    expect(result).toEqual({
      success: true,
      notificationId: expect.any(String),
      distributionCount: 2,
      failureCount: 0,
      sentAt: expect.any(String),
      auditLog: expect.objectContaining({
        action: 'NOTIFICATION_DISTRIBUTED',
        timestamp: expect.any(String),
        operator: expect.any(String),
        details: expect.objectContaining({
          version: '2.1.0',
          recipientCount: 2,
          status: 'COMPLETED'
        })
      })
    });

    // ケース6: 複数の必須項目が同時に不足している場合、最初に検出された項目を指摘
    expect(() =>
      sendLatestVersionNotification({
        title: '',
        body: '',
        distributionTargets: [],
        releaseVersion: '',
        releaseDate: '2024-01-15',
        changeLog: '- 新機能追加'
      })
    ).toThrow(/タイトル/);

    // ケース7: 配信対象のメールアドレスが不正な場合、エラー送出
    expect(() =>
      sendLatestVersionNotification({
        title: '最新版リリースのお知らせ',
        body: '新しいバージョンがリリースされました',
        distributionTargets: ['invalid-email-format'],
        releaseVersion: '2.1.0',
        releaseDate: '2024-01-15',
        changeLog: '- 新機能追加'
      })
    ).toThrow(/メールアドレス/);

    // ケース8: 配信対象に有効なメールアドレスが含まれている場合、成功
    const result_with_multiple_targets = sendLatestVersionNotification({
      title: '最新版リリースのお知らせ',
      body: '新しいバージョンがリリースされました',
      distributionTargets: ['user001@example.com', 'user002@example.com', 'user003@example.com'],
      releaseVersion: '2.1.0',
      releaseDate: '2024-01-15',
      changeLog: '- 新機能追加\n- バグ修正\n- パフォーマンス改善'
    });

    expect(result_with_multiple_targets).toEqual({
      success: true,
      notificationId: expect.any(String),
      distributionCount: 3,
      failureCount: 0,
      sentAt: expect.any(String),
      auditLog: expect.objectContaining({
        action: 'NOTIFICATION_DISTRIBUTED',
        timestamp: expect.any(String),
        operator: expect.any(String),
        details: expect.objectContaining({
          version: '2.1.0',
          recipientCount: 3,
          status: 'COMPLETED'
        })
      })
    });
  });
});