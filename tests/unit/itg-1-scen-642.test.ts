import { validateSalesDataQuality } from "../../src/logic/it-1781935279444-2-2-1";

describe("営業データの完全性・正確性を自動検証し、不足データ・誤りを検出・通知する機能", () => {
  // SCEN-642: [edge] 営業データ異常値・漏れ検出機能 - 売上金額が 0 円の場合に異常判定の境界値として正しく処理される
  test("売上金額が0円の場合、異常判定フラグが正しく設定され、請求自動化処理が対象外となり、警告が生成される", () => {
    const salesData = {
      sales_id: "SALES-20240115-001",
      employee_id: "EMP-00001",
      customer_name: "テスト顧客A",
      transaction_date: "2024-01-15",
      sales_amount: 0,
      service_type: "サービスA",
      ap_count: 5,
      contract_count: 1,
      contact_response: "肯定的",
      created_at: "2024-01-15T09:30:00Z",
      status: "入力済み",
    };

    const result = validateSalesDataQuality(salesData);

    // (1) 異常値として正しく検出され異常判定フラグが設定される
    expect(result.is_anomaly).toBe(true);

    // (2) 異常判定ログに「金額異常」として記録される
    expect(result.anomaly_type).toBe("金額異常");
    expect(result.anomaly_details).toMatch(/売上金額/);

    // (3) 請求自動化処理の対象外となり、自動請求が実行されない
    expect(result.billing_eligible).toBe(false);

    // (4) ユーザーへの警告・通知が生成される
    expect(result.warning_message).toBeTruthy();
    expect(result.warning_message).toMatch(/0円/);
    expect(result.notification_required).toBe(true);

    // (5) 境界値としてのエッジケース処理が完了する
    expect(result.validation_status).toBe("異常");
    expect(result.requires_manual_review).toBe(true);
    expect(result.processed_at).toBeTruthy();
  });
});