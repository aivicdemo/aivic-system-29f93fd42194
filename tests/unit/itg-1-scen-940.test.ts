import {
  validateSalesDataQuality,
  detectDataAnomalies,
  notifyRepresentativeOfIssues,
} from "../../src/logic/it-1781935279444-2-2-1";

describe("営業データの完全性・正確性を自動検証し、不足データ・誤りを検出・通知する機能", () => {
  test("SCEN-940: [normal] 営業データ品質検証・異常検出機能 - 必須項目が欠落したデータが不合格と判定され、修正指示が代表に通知される", () => {
    // 前提: テストデータとして必須項目が一部欠落した営業データを準備
    const defectiveSalesData = {
      customer_name: "", // 必須項目が欠落
      contact_date: "2024-01-15",
      transaction_amount: 50000,
      service_type: "consulting",
      appointment_status: "confirmed",
      sales_person_id: "SP001",
      representative_id: "REP001",
    };

    // Step 1: データ品質検証を実行
    const validation_result = validateSalesDataQuality(defectiveSalesData);

    // 期待: 必須項目が欠落しているため不合格と判定される
    expect(validation_result.is_valid).toBe(false);
    expect(validation_result.validation_status).toBe("failed");
    expect(validation_result.missing_required_fields).toContain("customer_name");

    // Step 2: 異常検出機能を実行
    const anomaly_detection_result = detectDataAnomalies(defectiveSalesData);

    // 期待: 欠落項目の詳細情報が返される
    expect(anomaly_detection_result.anomalies_found).toBe(true);
    expect(anomaly_detection_result.anomaly_count).toBe(1);
    expect(anomaly_detection_result.anomaly_details).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          field_name: "customer_name",
          issue_type: "missing_required_field",
          severity_level: "critical",
        }),
      ])
    );

    // Step 3: 代表ユーザーへの通知を生成
    const notification_params = {
      representative_id: "REP001",
      sales_data_id: "SD20240115001",
      validation_status: "failed",
      missing_fields: ["customer_name"],
      anomalies: anomaly_detection_result.anomaly_details,
      correction_deadline: "2024-01-16T17:00:00Z",
    };

    const notification_result = notifyRepresentativeOfIssues(
      notification_params
    );

    // 期待: 通知が代表に送信される
    expect(notification_result.notification_sent).toBe(true);
    expect(notification_result.notification_id).toBeDefined();
    expect(notification_result.recipient_id).toBe("REP001");
    expect(notification_result.notification_type).toBe("data_quality_alert");
    expect(notification_result.message).toMatch(/顧客名/);
    expect(notification_result.message).toMatch(/必須項目/);
    expect(notification_result.correction_instructions).toContain(
      "顧客名を入力してください"
    );

    // Step 4: 通知履歴の検証
    expect(notification_result.timestamp).toBeDefined();
    expect(new Date(notification_result.timestamp).getTime()).toBeGreaterThan(
      0
    );

    // 期待: 異常検出結果と通知内容に整合性がある
    expect(notification_result.correction_instructions.length).toBeGreaterThan(
      0
    );
    expect(notification_result.anomaly_summary.critical_count).toBe(1);
  });
});