import { validateBillingDataAnomalies } from "../../src/logic/it-1781935279444-2-1-1";

describe("営業データ入力時の品質検証ルール定義・実行機能", () => {
  // SCEN-1289: [error] 請求データ妥当性自動検証 - 請求データが過去パターンと大きく乖離する場合、検証エラーが検出され経理部門に通知される
  test("過去パターンから大きく乖離した請求データで検証エラーが発生し、乖離理由を含む通知が経理部門に生成されること", () => {
    // 過去12ヶ月の請求データパターン（平均請求額、件数、顧客別パターン等）
    const historical_billing_data = [
      { year_month: "2023-01", total_amount: 1000000, invoice_count: 10, customer_id: "C001" },
      { year_month: "2023-02", total_amount: 1050000, invoice_count: 11, customer_id: "C001" },
      { year_month: "2023-03", total_amount: 980000, invoice_count: 9, customer_id: "C001" },
      { year_month: "2023-04", total_amount: 1020000, invoice_count: 10, customer_id: "C001" },
      { year_month: "2023-05", total_amount: 1100000, invoice_count: 11, customer_id: "C001" },
      { year_month: "2023-06", total_amount: 990000, invoice_count: 10, customer_id: "C001" },
      { year_month: "2023-07", total_amount: 1030000, invoice_count: 10, customer_id: "C001" },
      { year_month: "2023-08", total_amount: 1080000, invoice_count: 11, customer_id: "C001" },
      { year_month: "2023-09", total_amount: 1010000, invoice_count: 10, customer_id: "C001" },
      { year_month: "2023-10", total_amount: 1040000, invoice_count: 10, customer_id: "C001" },
      { year_month: "2023-11", total_amount: 1070000, invoice_count: 11, customer_id: "C001" },
      { year_month: "2023-12", total_amount: 1060000, invoice_count: 10, customer_id: "C001" },
    ];

    // 過去パターンから大きく乖離した請求データ（通常の3倍の金額、異常な件数増加）
    const anomalous_billing_data = {
      year_month: "2024-01",
      total_amount: 3200000, // 平均1035833円 × 3 ≈ 3107500円
      invoice_count: 35, // 平均10.25件 × 3 ≈ 30.75件
      customer_id: "C001",
    };

    const threshold_deviation_percent = 100; // 100%以上の乖離を閾値とする
    const threshold_count_deviation_percent = 100;

    const result = validateBillingDataAnomalies({
      historical_data: historical_billing_data,
      current_billing_data: anomalous_billing_data,
      threshold_deviation_percent,
      threshold_count_deviation_percent,
    });

    // 検証エラーが発生したことを確認
    expect(result.is_valid).toBe(false);
    expect(result.has_error).toBe(true);

    // 金額乖離度の計算: (3200000 - 1035833) / 1035833 * 100 = 208.9%
    expect(result.amount_deviation_percent).toBeGreaterThan(200);
    expect(result.amount_deviation_percent).toBeLessThan(215);

    // 件数乖離度の計算: (35 - 10.25) / 10.25 * 100 = 241.5%
    expect(result.count_deviation_percent).toBeGreaterThan(235);
    expect(result.count_deviation_percent).toBeLessThan(250);

    // エラー内容が構造化されて存在すること
    expect(result.error_details).toBeDefined();
    expect(result.error_details.length).toBeGreaterThan(0);

    // 金額乖离エラー詳細
    const amount_error = result.error_details.find((e) => e.error_type === "amount_deviation");
    expect(amount_error).toBeDefined();
    expect(amount_error?.error_message).toMatch(/3200000/);
    expect(amount_error?.error_message).toMatch(/1035833/); // 平均値
    expect(amount_error?.deviation_percent).toBeGreaterThan(200);

    // 件数乖离エラー詳細
    const count_error = result.error_details.find((e) => e.error_type === "count_deviation");
    expect(count_error).toBeDefined();
    expect(count_error?.error_message).toMatch(/35/);
    expect(count_error?.error_message).toMatch(/10/); // 平均値を含む
    expect(count_error?.deviation_percent).toBeGreaterThan(235);

    // 経理部門への通知データが生成されたこと
    expect(result.notification_data).toBeDefined();
    expect(result.notification_data.recipient_type).toBe("accounting_department");
    expect(result.notification_data.customer_id).toBe("C001");
    expect(result.notification_data.billing_year_month).toBe("2024-01");

    // 通知メッセージに乖離理由（具体的な数値差分、検出項目等）が含まれていることを検証
    expect(result.notification_data.notification_message).toMatch(/請求額/);
    expect(result.notification_data.notification_message).toMatch(/3200000/);
    expect(result.notification_data.notification_message).toMatch(/208/); // 乖離度パーセント
    expect(result.notification_data.notification_message).toMatch(/請求件数/);
    expect(result.notification_data.notification_message).toMatch(/35/);
    expect(result.notification_data.notification_message).toMatch(/241/); // 件数乖離度パーセント

    // 通知が発送キューに登録されたことを確認
    expect(result.notification_data.is_queued_for_sending).toBe(true);
    expect(result.notification_data.queued_at).toBeDefined();

    // システムログに検証失敗の理由が記録されていること
    expect(result.audit_log).toBeDefined();
    expect(result.audit_log.event_type).toBe("billing_validation_failed");
    expect(result.audit_log.event_timestamp).toBeDefined();
    expect(result.audit_log.validation_failure_reason).toMatch(/乖離/);
    expect(result.audit_log.validation_failure_reason).toMatch(/金額/);
    expect(result.audit_log.customer_id).toBe("C001");
    expect(result.audit_log.billing_year_month).toBe("2024-01");

    // 再検査やデータ修正の追跡が可能な状態
    expect(result.audit_log.requires_manual_review).toBe(true);
    expect(result.audit_log.review_priority).toBe("high");
  });
});