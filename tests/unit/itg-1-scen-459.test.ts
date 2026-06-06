import { validateInventoryApprovalAuthority } from '../../src/logic/it-1-br-1780551301636-2-2-1';

describe('製造ライン別の進捗状況を週次で自動集計し遅延リスクを判定してアラート通知する機能', () => {
  test('SCEN-459: [normal] 棚卸承認権限チェック機能 - 承認権限を持つ担当者が棚卸結果を正常に承認できる', () => {
    // 承認権限を持つ担当者の情報とデータを設定
    const approverUserId = "user123";
    const inventoryReconciliationId = "inv_recon_001";
    const userRole = "production_manager";
    
    // テスト実行
    const result = validateInventoryApprovalAuthority(approverUserId, inventoryReconciliationId, userRole);
    
    // 期待結果の検証
    expect(result.isAuthorized).toBe(true);
    expect(result.errorMessage).toBeUndefined();
    
    // supervisorでも承認権限があることを確認
    const supervisorResult = validateInventoryApprovalAuthority("user456", "inv_recon_002", "supervisor");
    expect(supervisorResult.isAuthorized).toBe(true);
    expect(supervisorResult.errorMessage).toBeUndefined();
    
    // adminでも承認権限があることを確認
    const adminResult = validateInventoryApprovalAuthority("user789", "inv_recon_003", "admin");
    expect(adminResult.isAuthorized).toBe(true);
    expect(adminResult.errorMessage).toBeUndefined();
    
    // 承認権限のない一般ユーザーのテスト
    const generalUserResult = validateInventoryApprovalAuthority("user999", "inv_recon_004", "general_user");
    expect(generalUserResult.isAuthorized).toBe(false);
    expect(generalUserResult.errorMessage).toBe("棚卸結果の承認権限がありません。生産管理担当者または管理職にお問い合わせください。");
    
    // エラーケースのテスト
    expect(() => validateInventoryApprovalAuthority("", "inv_recon_005", "production_manager")).toThrow(/承認者/);
    expect(() => validateInventoryApprovalAuthority("user123", "", "production_manager")).toThrow(/棚卸結果/);
  });
});