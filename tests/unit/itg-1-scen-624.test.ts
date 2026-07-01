import { notifyContractChangeToCustomer } from "../../src/logic/it-1-2-1";

describe("営業成果データから請求対象項目を自動抽出し、顧客ごと・サービスごとの請求額を集計する機能", () => {
  test("SCEN-624: 契約変更通知・メール自動送信機能 - 契約内容変更時に顧客企業の営業責任者へ変更内容のメールが正常に自動送信される", async () => {
    // ===== setup =====
    const existing_contract_id = "contract_001";
    const customer_id = "cust_abc123";
    const manager_email = "manager@customercorp.com";
    const manager_name = "田中太郎";
    const change_timestamp = new Date("2024-01-15T09:30:00Z");
    const system_email = "billing-system@ourcompany.com";

    const previous_contract = {
      contract_id: existing_contract_id,
      customer_id: customer_id,
      service_type: "basic_plan",
      monthly_fee: 100000,
      start_date: "2024-01-01",
      end_date: "2024-12-31",
    };

    const updated_contract = {
      contract_id: existing_contract_id,
      customer_id: customer_id,
      service_type: "premium_plan",
      monthly_fee: 150000,
      start_date: "2024-01-01",
      end_date: "2024-12-31",
    };

    const change_record = {
      contract_id: existing_contract_id,
      customer_id: customer_id,
      previous_state: previous_contract,
      current_state: updated_contract,
      changed_at: change_timestamp,
      change_reason: "顧客要望によるプラン変更",
    };

    const customer_manager = {
      customer_id: customer_id,
      manager_email: manager_email,
      manager_name: manager_name,
    };

    // ===== execution =====
    const email_result = await notifyContractChangeToCustomer({
      change_record: change_record,
      customer_manager: customer_manager,
      system_email_address: system_email,
    });

    // ===== assertions =====
    // メール送信が成功したことを確認
    expect(email_result.success).toBe(true);

    // 送信先メールアドレスが正確であることを確認
    expect(email_result.sent_to).toBe(manager_email);

    // メール件名が契約変更通知であることを確認
    expect(email_result.email_subject).toBe("【契約変更通知】契約内容が変更されました");

    // メール本文に変更前の契約内容が記載されていることを確認
    expect(email_result.email_body).toContain("basic_plan");
    expect(email_result.email_body).toContain("100000");

    // メール本文に変更後の契約内容が記載されていることを確認
    expect(email_result.email_body).toContain("premium_plan");
    expect(email_result.email_body).toContain("150000");

    // メール本文に変更日時が記載されていることを確認
    expect(email_result.email_body).toContain("2024-01-15T09:30:00Z");

    // メール本文に変更理由が記載されていることを確認
    expect(email_result.email_body).toContain("顧客要望によるプラン変更");

    // From欄がシステムの正式なアドレスであることを確認
    expect(email_result.email_from).toBe(system_email);

    // メール送信日時がシステム上の変更確定時刻と一致することを確認
    expect(email_result.sent_at).toEqual(change_timestamp);

    // メール送信キューに正しく追加されたことを確認
    expect(email_result.queued_for_delivery).toBe(true);

    // 送信ステータスが 'pending' または 'sent' であることを確認
    expect(["pending", "sent"]).toContain(email_result.delivery_status);
  });
});