import { validateAndSendMonthlyReport } from "../../src/logic/it-1-br-1781935279444-1-2-1";

describe("月次サマリーテンプレートの定義・管理機能", () => {
  test("SCEN-1310: 配信先メールアドレスが無効な場合、配信失敗として記録され配信エラー通知が発行される", () => {
    const invalid_email_list = [
      "invalid-email",
      "test@",
      "@example.com",
      "test@@example.com",
      "test example@example.com"
    ];

    invalid_email_list.forEach((invalid_email) => {
      const report_config = {
        report_id: "RPT-2024-001",
        report_name: "月次営業成果レポート",
        template_id: "TMPL-001",
        delivery_addresses: [invalid_email],
        scheduled_delivery_at: new Date("2024-01-15T09:00:00Z"),
        retry_count: 0
      };

      const result = validateAndSendMonthlyReport(report_config);

      expect(result.success).toBe(false);
      expect(result.delivery_status).toBe("FAILED");
      expect(result.failed_addresses).toContain(invalid_email);
      expect(result.error_message).toMatch(/メール/);
      expect(result.admin_notification_issued).toBe(true);
      expect(result.admin_notification_content).toMatch(/無効/);
      expect(result.delivery_log).toEqual(
        expect.objectContaining({
          report_id: "RPT-2024-001",
          status: "FAILED",
          error_detail: expect.stringContaining(invalid_email)
        })
      );
    });

    const valid_config = {
      report_id: "RPT-2024-002",
      report_name: "月次営業成果レポート",
      template_id: "TMPL-001",
      delivery_addresses: ["valid@example.com"],
      scheduled_delivery_at: new Date("2024-01-15T09:00:00Z"),
      retry_count: 0
    };

    const valid_result = validateAndSendMonthlyReport(valid_config);

    expect(valid_result.success).toBe(true);
    expect(valid_result.delivery_status).toBe("SENT");
    expect(valid_result.admin_notification_issued).toBe(false);
  });
});