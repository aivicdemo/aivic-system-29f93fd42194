import { validateAndApproveVerificationReport } from '../../src/logic/it-1781935279444-2-2-1';

describe('営業データ検証結果レポートの承認・差戻し判定', () => {
  // SCEN-1033
  test('検証結果レポートが存在しない状態でエラーが返却される', async () => {
    const reportId = 'report-nonexistent-001';
    const action = 'approve';
    const userId = 'user-rep-001';

    expect(() => {
      validateAndApproveVerificationReport({
        reportId,
        action,
        userId,
      });
    }).toThrow(/検証結果レポート/);
  });
});