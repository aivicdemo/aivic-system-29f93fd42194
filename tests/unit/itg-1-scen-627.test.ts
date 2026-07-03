import { describe, test, expect, beforeEach } from "@jest/globals";
import { classifyObjectionAndRoute } from "../../src/logic/it-1-1-1";

describe("異議申し立て・対応ルート分岐", () => {
  test("SCEN-627: 説明対応で対応可能な異議を申し立てた場合、説明対応ルートへ分岐され両者に通知される", () => {
    // Arrange
    const objection_input = {
      customer_id: "CUST-20240301-001",
      contract_id: "CONT-2024-001",
      user_id: "USR-CUST-001",
      objection_type: "explanation_required",
      objection_reason: "請求額の計算根拠について説明が必要",
      objection_details:
        "前月の請求額と比較して異常が見られるため、詳細な計算内訳の説明をお願いします。",
      invoice_id: "INV-2024-03-001",
      objection_date: "2024-03-15T10:30:00Z",
      customer_contact_email: "sales@customer-company.jp",
      sales_rep_email: "tanaka@sales-agency.jp",
      manager_email: "manager@sales-agency.jp",
    };

    // Act
    const result = classifyObjectionAndRoute(objection_input);

    // Assert - 異議申し立てが正常に送信される
    expect(result.success).toBe(true);

    // ステータスが「説明対応ルート」に正しく分岐される
    expect(result.routing_status).toBe("explanation_response_route");
    expect(result.objection_status).toBe("pending_explanation");
    expect(result.priority_level).toBe("normal");

    // 異議申し立てデータが正しく保存される
    expect(result.objection_id).toBeDefined();
    expect(result.objection_id).toMatch(/^OBJ-\d{8}-\d{6}$/);
    expect(result.customer_id).toBe("CUST-20240301-001");
    expect(result.contract_id).toBe("CONT-2024-001");
    expect(result.objection_type).toBe("explanation_required");

    // 顧客企業宛の通知メールが送信される
    expect(result.notifications).toBeDefined();
    expect(result.notifications.length).toBe(2);

    const customer_notification = result.notifications.find(
      (n: { recipient_type: string }) => n.recipient_type === "customer"
    );
    expect(customer_notification).toBeDefined();
    expect(customer_notification.recipient_email).toBe(
      "sales@customer-company.jp"
    );
    expect(customer_notification.notification_status).toBe("sent");
    expect(customer_notification.subject).toMatch(/異議申し立てを受け付けました/);
    expect(customer_notification.sent_at).toBeDefined();

    // 営業担当者宛の通知メールが送信される
    const sales_rep_notification = result.notifications.find(
      (n: { recipient_type: string }) => n.recipient_type === "sales_representative"
    );
    expect(sales_rep_notification).toBeDefined();
    expect(sales_rep_notification.recipient_email).toBe(
      "tanaka@sales-agency.jp"
    );
    expect(sales_rep_notification.notification_status).toBe("sent");
    expect(sales_rep_notification.subject).toMatch(/顧客異議申し立て通知/);

    // 対応期限が設定される（営業日ベースで1営業日以内）
    expect(result.response_due_date).toBeDefined();
    const submitted_date = new Date("2024-03-15T10:30:00Z");
    const due_date = new Date(result.response_due_date);
    const expected_due_date = new Date(submitted_date);
    expected_due_date.setDate(expected_due_date.getDate() + 1);
    expect(due_date.toDateString()).toBe(expected_due_date.toDateString());

    // 監査ログが記録される
    expect(result.audit_log).toBeDefined();
    expect(result.audit_log.event_type).toBe("objection_submitted");
    expect(result.audit_log.user_id).toBe("USR-CUST-001");
    expect(result.audit_log.timestamp).toBe("2024-03-15T10:30:00Z");
    expect(result.audit_log.details.routing_decision).toBe(
      "explanation_response_route"
    );
  });
});