import { validateInventoryApprovalAuthority } from "../../src/logic/it-1-br-1780551301636-2-2-1";

describe("製造ライン別の進捗状況を週次で自動集計し遅延リスクを判定してアラート通知する機能", () => {
  test("権限レベルが境界値の担当者の承認処理を正しく判定する", () => {
    // SCEN-461

    // 権限レベルが境界値（レベル3）の担当者の権限チェック
    const approverUserId = "user123";
    const inventoryReconciliationId = "inv_20240115_001";
    const userRole = "supervisor";

    // 境界値テスト: レベル3の権限で承認処理
    const result = validateInventoryApprovalAuthority(
      approverUserId,
      inventoryReconciliationId,
      userRole
    );

    // 権限レベル3（supervisor）の場合、承認権限があることを確認
    expect(result.isAuthorized).toBe(true);
    expect(result.errorMessage).toBeUndefined();
  });
});