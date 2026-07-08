import { recordManualRevisionHistory } from '../../src/logic/it-6-3-1';

describe('マニュアル改版精度追跡機能', () => {
  // SCEN-1590
  test('3ヶ月ごとの定期改版タイミングで改版履歴記録トリガーが発火し、改版履歴が正確に記録される', () => {
    // 準備: 3ヶ月前に作成されたマニュアルデータ
    const threeMonthsAgo = new Date('2024-11-15T10:00:00Z');
    const currentTime = new Date('2025-02-15T14:30:00Z');

    const manualData = {
      manualId: 'MAN-001',
      manualTitle: '運用ガイドライン初版',
      createdAt: threeMonthsAgo.toISOString(),
      lastRevisionAt: threeMonthsAgo.toISOString(),
      currentVersion: 1,
      status: 'active',
      revisionIntervalDays: 90,
    };

    const revisionHistoryBefore = [
      {
        revisionId: 'REV-001',
        manualId: 'MAN-001',
        revisionDate: threeMonthsAgo.toISOString(),
        versionBefore: 0,
        versionAfter: 1,
        revisionStatus: '初版作成',
        notificationLog: 'Initial version created',
      },
    ];

    // 実行: 自動改版チェック処理
    const result = recordManualRevisionHistory(
      manualData,
      revisionHistoryBefore,
      currentTime
    );

    // 検証1: 改版履歴テーブルに新しいレコードが追加されたことを確認
    expect(result.revisionHistoryAfter.length).toBe(2);

    // 検証2: 新規追加された改版履歴レコードの内容を確認
    const newRevisionRecord = result.revisionHistoryAfter[1];
    expect(newRevisionRecord.manualId).toBe('MAN-001');
    expect(newRevisionRecord.revisionStatus).toBe('自動改版実行');

    // 検証3: 改版日時が現在時刻と一致することを検証
    expect(newRevisionRecord.revisionDate).toBe(currentTime.toISOString());

    // 検証4: バージョン番号が正しくインクリメントされていることを検証
    expect(newRevisionRecord.versionBefore).toBe(1);
    expect(newRevisionRecord.versionAfter).toBe(2);

    // 検証5: 改版通知ログが生成されていることを確認
    expect(newRevisionRecord.notificationLog).toBeTruthy();
    expect(newRevisionRecord.notificationLog).toMatch(/自動改版/);

    // 検証6: マニュアルメタデータが更新されていることを確認
    expect(result.updatedManualData.currentVersion).toBe(2);
    expect(result.updatedManualData.lastRevisionAt).toBe(
      currentTime.toISOString()
    );
    expect(result.updatedManualData.status).toBe('active');

    // 検証7: 改版トリガーが発火したフラグを確認
    expect(result.revisionTriggered).toBe(true);

    // 検証8: 改版前後のバージョン番号が連続していることを検証
    const previousRevision = result.revisionHistoryAfter[0];
    expect(newRevisionRecord.versionBefore).toBe(previousRevision.versionAfter);
  });
});