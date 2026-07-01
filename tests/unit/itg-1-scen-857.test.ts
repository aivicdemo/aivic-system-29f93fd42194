import { recordDocumentViewLog } from '../../src/logic/it-1781935279444-1-1-1';

describe('営業データ項目のメタデータ管理機能 - 操作ログ自動記録', () => {
  // SCEN-857: [normal] 操作ログ自動記録機能 - 文書閲覧アクション実行時に対象文書ID・閲覧者・実行日時が自動記録される
  test('文書閲覧アクション実行時に対象文書ID・閲覧者・実行日時が自動記録される', () => {
    // 前提: テストユーザーがシステムにログイン済みで、営業データ品質管理・請求自動化システムの文書管理機能にアクセス可能な状態
    // 発生条件: ユーザーが特定の文書を選択して開く（文書閲覧アクション実行）
    // 期待結果: 操作ログに対象文書ID・閲覧者・実行日時が自動的に記録される

    const userId = 'user-12345';
    const userName = 'taro_yamada';
    const documentId = 'doc-98765';
    const documentTitle = '契約書_顧客A_2024';
    const viewActionTimestamp = new Date('2024-01-15T14:30:00Z');

    // 文書閲覧アクション実行
    const logResult = recordDocumentViewLog({
      userId: userId,
      userName: userName,
      documentId: documentId,
      documentTitle: documentTitle,
      actionType: 'view',
      actionTimestamp: viewActionTimestamp,
    });

    // 操作ログに記録される情報の検証
    expect(logResult).toBeDefined();
    expect(logResult.logId).toBeDefined();
    expect(typeof logResult.logId).toBe('string');
    expect(logResult.logId.length).toBeGreaterThan(0);

    // 対象文書IDが正確に記録されていることを確認
    expect(logResult.documentId).toBe('doc-98765');

    // 閲覧者（ユーザーID）が正確に記録されていることを確認
    expect(logResult.userId).toBe('user-12345');

    // 閲覧者（ユーザー名）が正確に記録されていることを確認
    expect(logResult.userName).toBe('taro_yamada');

    // 実行日時が正確に記録されていることを確認（ISO 8601形式）
    expect(logResult.actionTimestamp).toBe('2024-01-15T14:30:00Z');

    // アクション種別が正確に記録されていることを確認
    expect(logResult.actionType).toBe('view');

    // 文書タイトルが正確に記録されていることを確認
    expect(logResult.documentTitle).toBe('契約書_顧客A_2024');

    // ログレコード全体の構造を検証
    expect(logResult).toEqual({
      logId: expect.any(String),
      userId: 'user-12345',
      userName: 'taro_yamada',
      documentId: 'doc-98765',
      documentTitle: '契約書_顧客A_2024',
      actionType: 'view',
      actionTimestamp: '2024-01-15T14:30:00Z',
      recordedAt: expect.any(String),
    });

    // 記録日時（システムで自動生成）が存在し、有効なタイムスタンプであることを確認
    expect(logResult.recordedAt).toBeDefined();
    expect(typeof logResult.recordedAt).toBe('string');
    const recordedAtDate = new Date(logResult.recordedAt);
    expect(recordedAtDate.getTime()).toBeGreaterThan(0);

    // 記録日時がアクション実行日時と同じか後ろの時刻であることを確認
    const actionDate = new Date('2024-01-15T14:30:00Z').getTime();
    const recordedDate = new Date(logResult.recordedAt).getTime();
    expect(recordedDate).toBeGreaterThanOrEqual(actionDate);
  });
});