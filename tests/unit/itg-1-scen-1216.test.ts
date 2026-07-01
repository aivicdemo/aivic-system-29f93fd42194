import { detectDataMismatchCategory } from '../../src/logic/it-1781935279444-2-1-1';

describe('営業データ入力時の品質検証ルール定義・実行機能', () => {
  test('SCEN-1216: データ不一致自動判定機能 - 既知カテゴリーに該当しない場合は「その他」に分類', () => {
    // 不一致データ: 3つの既知カテゴリー（データ入力誤り、システム連携エラー、マスタ不整合）に該当しないケース
    const mismatchData = {
      recordId: 'REC-20240115-001',
      expectedValue: 1500,
      actualValue: 1600,
      fieldName: 'sales_amount',
      mismatchPattern: 'unknown_sync_timing_issue',
      timestamp: '2024-01-15T10:30:00Z',
    };

    const result = detectDataMismatchCategory(mismatchData);

    // 期待値1: 不一致原因カテゴリーが「その他」に分類される
    expect(result.category).toBe('その他');

    // 期待値2: 手動対応フラグが true に設定される
    expect(result.requiresManualReview).toBe(true);

    // 期待値3: システムログに「その他」として分類されたことが記録される
    expect(result.systemLog).toMatch(/その他/);

    // 期待値4: 手動対応が必要である旨がシステムログに記録される
    expect(result.systemLog).toMatch(/手動対応/);

    // 期待値5: 記録タイムスタンプが正確に保存される
    expect(result.loggedAt).toBe('2024-01-15T10:30:00Z');

    // 期待値6: 元のレコード情報が結果に含まれる
    expect(result.recordId).toBe('REC-20240115-001');

    // 期待値7: システムログにレコード ID が含まれる
    expect(result.systemLog).toMatch(/REC-20240115-001/);
  });
});