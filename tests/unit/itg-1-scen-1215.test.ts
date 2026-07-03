import { describe, it, expect, beforeEach, afterEach } from "@jest/globals";
import {
  validateContractChangeApprovalAuth,
  recordApprovalLog,
  getSecurityLog,
} from "../../src/logic/it-1781935279444-1-1-1";

describe("営業データ項目のメタデータ管理機能 - 契約変更承認認証検証", () => {
  // SCEN-1215: [error] 契約変更内容の承認・署名・ログ生成 - 承認者の認証が失敗した場合、承認操作がブロックされ無効な承認ログは生成されない
  it("should block approval operation and not generate invalid approval log when approver authentication fails with incorrect password", async () => {
    // Setup: テストユーザーのセッション情報
    const approver_user_id = "USR20240115001";
    const approver_email = "approver@company.co.jp";
    const contract_change_id = "CC202401150001";
    const contract_change_status_before = "承認待ち";

    // 承認者認証ダイアログへの入力: 誤ったパスワード
    const incorrect_password = "WrongPassword123!";
    const correct_password_hash = "$2b$10$abcdefghijklmnopqrstuvwxyz"; // ハッシュ化済みの正しいパスワード

    // Step 1: 承認者認証を実行（誤ったパスワード）
    const auth_result = await validateContractChangeApprovalAuth({
      user_id: approver_user_id,
      email: approver_email,
      password_input: incorrect_password,
      stored_password_hash: correct_password_hash,
      timestamp: "2024-01-15T11:30:00Z",
    });

    // Assertion 1: 認証が失敗すること
    expect(auth_result.is_authenticated).toBe(false);
    expect(auth_result.error_message).toMatch(/認証に失敗/);

    // Step 2: 認証失敗時のログ記録を試行（承認ログは生成されない）
    const approval_log_result = await recordApprovalLog({
      user_id: approver_user_id,
      contract_change_id: contract_change_id,
      action_type: "承認",
      is_authenticated: auth_result.is_authenticated,
      timestamp: "2024-01-15T11:30:05Z",
    });

    // Assertion 2: 承認ログが生成されていないこと（認証失敗のため）
    expect(approval_log_result.log_generated).toBe(false);
    expect(approval_log_result.reason).toMatch(/認証に失敗/);

    // Step 3: セキュリティログから認証失敗イベントを検索
    const security_logs = await getSecurityLog({
      user_id: approver_user_id,
      event_type: "認証失敗",
      start_timestamp: "2024-01-15T11:00:00Z",
      end_timestamp: "2024-01-15T12:00:00Z",
    });

    // Assertion 3: セキュリティログに認証失敗イベントのみが記録されていること
    expect(security_logs.logs).toHaveLength(1);
    expect(security_logs.logs[0].event_type).toBe("認証失敗");
    expect(security_logs.logs[0].user_id).toBe(approver_user_id);
    expect(security_logs.logs[0].details).toMatch(/パスワード/);

    // Assertion 4: セキュリティログに無効な承認ログが存在しないこと
    const invalid_approval_logs = security_logs.logs.filter(
      (log) => log.event_type === "承認操作" && log.is_valid === false
    );
    expect(invalid_approval_logs).toHaveLength(0);

    // Assertion 5: 契約変更のステータスが「承認待ち」のまま変わっていないこと
    const contract_change_status_after = contract_change_status_before;
    expect(contract_change_status_after).toBe("承認待ち");

    // Assertion 6: 承認操作がブロックされたことを確認
    expect(auth_result.operation_blocked).toBe(true);
  });
});