import { describe, test, expect, beforeEach } from "@jest/globals";
import {
  notifyContractChangeToCustomer,
  ContractChangeNotificationInput,
  ContractChangeNotificationOutput,
} from "../../src/logic/it-1-1-1";

describe("営業成果データの自動検証ルール定義と異常検出機能", () => {
  // SCEN-631: [normal] 契約変更内容の自動通知機能 - 成果物納期が変更された際に顧客企業の営業責任者へメール通知が送信される
  test("成果物納期が変更された際に顧客企業の営業責任者へメール通知が送信される", () => {
    const contractChangeInput: ContractChangeNotificationInput = {
      contract_id: "C-20240115-001",
      customer_id: "CUST-A001",
      customer_name: "顧客企業A",
      customer_representative_email: "tanaka@customer-a.com",
      customer_representative_name: "田中太郎",
      change_type: "deliverable_deadline",
      previous_deadline: "2024-03-31",
      new_deadline: "2024-04-30",
      change_date: "2024-01-15T09:30:00Z",
      change_reason: "納期調整による顧客要望対応",
      changed_by_user_id: "USR-OP001",
      changed_by_user_name: "営業オペレーター太郎",
    };

    const result: ContractChangeNotificationOutput =
      notifyContractChangeToCustomer(contractChangeInput);

    // 通知送信成功
    expect(result.notification_sent).toBe(true);

    // 通知タイプが正確
    expect(result.notification_type).toBe("deliverable_deadline_change");

    // 送信対象メールアドレスが正確
    expect(result.recipient_email).toBe("tanaka@customer-a.com");

    // メール本文に変更前の納期が含まれる
    expect(result.email_body).toContain("2024-03-31");

    // メール本文に変更後の納期が含まれる
    expect(result.email_body).toContain("2024-04-30");

    // メール本文に変更日時が含まれる
    expect(result.email_body).toContain("2024-01-15");

    // メール本文に変更者の情報が含まれる
    expect(result.email_body).toContain("営業オペレーター太郎");

    // メール本文に顧客企業名が含まれる
    expect(result.email_body).toContain("顧客企業A");

    // メール本文に営業責任者名が含まれる
    expect(result.email_body).toContain("田中太郎");

    // メール送信タイムスタンプが記録される
    expect(result.notification_timestamp).toBeDefined();
    expect(typeof result.notification_timestamp).toBe("string");

    // 通知ID（追跡用）が生成される
    expect(result.notification_id).toBeDefined();
    expect(result.notification_id.length).toBeGreaterThan(0);

    // 契約IDが通知に紐付けられる
    expect(result.contract_id).toBe("C-20240115-001");

    // 顧客IDが通知に紐付けられる
    expect(result.customer_id).toBe("CUST-A001");

    // メール送信ステータスが「送信済み」である
    expect(result.email_status).toBe("sent");

    // 再試行回数が0である（初回送信成功）
    expect(result.retry_count).toBe(0);

    // 通知記録が監査ログに記録可能な形式である
    expect(result.audit_log_entry).toBeDefined();
    expect(result.audit_log_entry.action).toBe("notify_contract_change");
    expect(result.audit_log_entry.user_id).toBe("USR-OP001");
  });
});