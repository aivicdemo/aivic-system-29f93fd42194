import { describe, it, expect, beforeEach, afterEach } from "@jest/globals";
import { detectSalesDataMismatch } from "../../src/logic/it-1781935279444-2-2-1";

describe("営業活動データ品質自動検出・通知機能", () => {
  // SCEN-734
  it("営業活動データの商談内容と実績が矛盾し、不整合として修正通知が発行される", () => {
    // 商談内容データ
    const dealData = {
      deal_id: "DEAL20240115001",
      planned_contract_date: "2024-01-15",
      planned_contract_amount: 5000000,
      sales_rep_id: "SR001",
      sales_rep_email: "sales@example.com",
    };

    // 実績データ
    const performanceData = {
      deal_id: "DEAL20240115001",
      actual_contract_date: "2024-02-20",
      actual_contract_amount: 3000000,
    };

    // データ品質自動検出機能を実行
    const result = detectSalesDataMismatch({
      deal: dealData,
      performance: performanceData,
      detection_timestamp: "2024-02-21T10:30:00Z",
    });

    // 不整合が検出されたことを確認
    expect(result.mismatch_detected).toBe(true);

    // 不整合の種別を確認
    expect(result.mismatch_types).toContain("契約日ズレ");
    expect(result.mismatch_types).toContain("金額ズレ");

    // 対象商談IDを確認
    expect(result.deal_id).toBe("DEAL20240115001");

    // 詳細な不整合内容を検証
    expect(result.mismatch_details).toMatchObject({
      date_difference_days: 36,
      amount_difference: 2000000,
      planned_contract_date: "2024-01-15",
      actual_contract_date: "2024-02-20",
      planned_contract_amount: 5000000,
      actual_contract_amount: 3000000,
    });

    // 修正通知が生成されたことを確認
    expect(result.correction_notification).toBeDefined();

    // 修正通知の内容を検証
    const notification = result.correction_notification;
    expect(notification.notification_id).toBeDefined();
    expect(notification.deal_id).toBe("DEAL20240115001");
    expect(notification.sales_rep_id).toBe("SR001");
    expect(notification.sales_rep_email).toBe("sales@example.com");

    // 修正通知に不整合の具体的な差分情報が含まれていることを確認
    expect(notification.content).toContain("契約日ズレ: 36日");
    expect(notification.content).toContain("金額ズレ: 200万円");

    // 修正ステータスが「未対応」で初期化されていることを確認
    expect(notification.status).toBe("未対応");

    // 修正通知発行日時がシステム実行時刻と一致していることを確認
    expect(notification.issued_at).toBe("2024-02-21T10:30:00Z");

    // 修正通知が営業担当者に送信済みであることを確認
    expect(notification.sent_to_sales_rep).toBe(true);
    expect(notification.sent_timestamp).toBe("2024-02-21T10:30:00Z");

    // 通知の優先度を確認
    expect(notification.priority).toBe("high");
  });
});