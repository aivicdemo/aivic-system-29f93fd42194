import { notifyContractChange } from "../../src/logic/it-1-1-1";

describe("営業成果データの自動検証ルール定義と異常検出機能", () => {
  // SCEN-633: [error] 契約変更内容の自動通知機能 - 契約が確定していない状態での変更通知は実行されない
  test("契約ステータスが未確定の場合、変更通知は実行されず、ログに理由が記録される", () => {
    const contract_id = "CNT-2024-001";
    const contract_status = "未確定";
    const change_content = {
      field_name: "金額",
      old_value: "100000",
      new_value: "120000",
    };
    const notification_email = "customer@example.com";

    const result = notifyContractChange({
      contract_id,
      contract_status,
      change_content,
      notification_email,
    });

    expect(result.notification_sent).toBe(false);
    expect(result.email_history_created).toBe(false);
    expect(result.system_log_message).toBe(
      "契約ステータスが未確定のため通知をスキップしました"
    );
    expect(result.skip_reason).toBe("contract_status_unconfirmed");
  });
});