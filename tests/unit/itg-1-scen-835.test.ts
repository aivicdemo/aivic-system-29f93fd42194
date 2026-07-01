import { recordCorrespondenceLog } from "../../src/logic/it-1781935279444-2-2-1";

describe("対応内容のシステムログ記録・監査証跡機能", () => {
  // SCEN-835: [error] 送信者情報が不正または欠落している場合、エラーが返却される
  test("送信者情報が不正または欠落している場合、適切なエラーコードとエラーメッセージが返却され、処理失敗がシステムログに記録される", () => {
    // テストケース1: 送信者ID が欠落している場合
    const logWithMissingSenderId = {
      sender_id: "",
      sender_name: "営業責任者A",
      correspondence_content: "契約変更について確認します",
      correspondence_date: new Date("2024-01-15T09:00:00Z"),
      recipient_id: "customer_001",
      response_status: "pending",
    };

    const resultMissingSenderId = recordCorrespondenceLog(logWithMissingSenderId);
    expect(resultMissingSenderId.success).toBe(false);
    expect(resultMissingSenderId.error_code).toBe("SENDER_ID_MISSING");
    expect(resultMissingSenderId.error_message).toMatch(/送信者ID/);
    expect(resultMissingSenderId.system_log_recorded).toBe(true);
    expect(resultMissingSenderId.log_entry).toBeDefined();
    expect(resultMissingSenderId.log_entry?.event_type).toBe("VALIDATION_FAILURE");
    expect(resultMissingSenderId.log_entry?.reason).toMatch(/送信者ID/);

    // テストケース2: 送信者名が欠落している場合
    const logWithMissingSenderName = {
      sender_id: "user_001",
      sender_name: "",
      correspondence_content: "納期延長についてご相談があります",
      correspondence_date: new Date("2024-01-15T10:30:00Z"),
      recipient_id: "customer_002",
      response_status: "pending",
    };

    const resultMissingSenderName = recordCorrespondenceLog(logWithMissingSenderName);
    expect(resultMissingSenderName.success).toBe(false);
    expect(resultMissingSenderName.error_code).toBe("SENDER_NAME_MISSING");
    expect(resultMissingSenderName.error_message).toMatch(/送信者名/);
    expect(resultMissingSenderName.system_log_recorded).toBe(true);
    expect(resultMissingSenderName.log_entry?.event_type).toBe("VALIDATION_FAILURE");

    // テストケース3: 送信者ID が不正な形式の場合
    const logWithInvalidSenderId = {
      sender_id: "invalid@#$%",
      sender_name: "営業責任者B",
      correspondence_content: "請求内容の確認",
      correspondence_date: new Date("2024-01-15T11:00:00Z"),
      recipient_id: "customer_003",
      response_status: "pending",
    };

    const resultInvalidSenderId = recordCorrespondenceLog(logWithInvalidSenderId);
    expect(resultInvalidSenderId.success).toBe(false);
    expect(resultInvalidSenderId.error_code).toBe("SENDER_ID_INVALID_FORMAT");
    expect(resultInvalidSenderId.error_message).toMatch(/送信者ID/);
    expect(resultInvalidSenderId.system_log_recorded).toBe(true);

    // テストケース4: 送信者情報がすべて欠落している場合
    const logWithAllMissing = {
      sender_id: "",
      sender_name: "",
      correspondence_content: "確認です",
      correspondence_date: new Date("2024-01-15T12:00:00Z"),
      recipient_id: "customer_004",
      response_status: "pending",
    };

    const resultAllMissing = recordCorrespondenceLog(logWithAllMissing);
    expect(resultAllMissing.success).toBe(false);
    expect(resultAllMissing.error_code).toBe("SENDER_ID_MISSING");
    expect(resultAllMissing.error_message).toMatch(/送信者ID/);
    expect(resultAllMissing.system_log_recorded).toBe(true);
    expect(resultAllMissing.log_entry?.timestamp).toBeDefined();
    expect(resultAllMissing.log_entry?.error_details).toContain("送信者情報");

    // テストケース5: 正常な送信者情報を含む場合（成功パス）
    const logWithValidSender = {
      sender_id: "user_valid_001",
      sender_name: "代表兼営業オペレーター",
      correspondence_content: "月次請求書を確認いたしました",
      correspondence_date: new Date("2024-01-15T13:00:00Z"),
      recipient_id: "customer_005",
      response_status: "confirmed",
    };

    const resultValidSender = recordCorrespondenceLog(logWithValidSender);
    expect(resultValidSender.success).toBe(true);
    expect(resultValidSender.error_code).toBeNull();
    expect(resultValidSender.system_log_recorded).toBe(true);
    expect(resultValidSender.log_entry?.event_type).toBe("CORRESPONDENCE_RECORDED");
    expect(resultValidSender.log_entry?.sender_id).toBe("user_valid_001");
    expect(resultValidSender.log_entry?.sender_name).toBe("代表兼営業オペレーター");
  });
});