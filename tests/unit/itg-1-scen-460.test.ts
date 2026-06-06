import { validateInventoryApprovalAuthority } from '../../src/logic/it-1-br-1780551301636-2-2-1';

describe('製造ライン別の進捗状況を週次で自動集計し遅延リスクを判定してアラート通知する機能', () => {
  test('SCEN-460: 権限のない担当者の承認処理でエラーメッセージを返す', () => {
    // SCEN-460
    expect(() => 
      validateInventoryApprovalAuthority("user123", "INV-2024-001", "一般職")
    ).toThrow(/権限/);
  });
});