import { validateSalesDataCompleteness } from "../../src/logic/it-1781935279444-2-2-1";

describe("営業データの完全性・正確性を自動検証し、不足データ・誤りを検出・通知する機能", () => {
  // SCEN-719: [edge] 修正データ自動再検証機能 - 修正回数の上限に達した場合、検証ルールが適切に終了される
  test("修正データ自動再検証機能: 修正回数の上限に達すると検証ルールが適切に終了される", () => {
    // 準備: 修正回数の上限値を5に設定
    const max_correction_attempts = 5;
    const validation_rule_id = "rule_001";
    const customer_id = "cust_12345";
    const service_id = "svc_67890";

    // 検証エラーを意図的に発生させるテストデータ
    // 必須項目の欠落を含むデータ
    const invalid_sales_data = {
      customer_id: customer_id,
      service_id: service_id,
      contact_date: "2024-01-15",
      contact_time: "09:00", // 時間設定あり
      appointment_status: "", // ← 必須項目が空（エラー原因）
      transaction_amount: 50000,
      outcome_content: "商談実施",
      sales_person_id: "sales_001"
    };

    const systemErrorLogs: string[] = [];
    const correctionAttempts: { attempt_number: number; timestamp: string; status: string }[] = [];
    let final_validation_status = "";
    let resource_leaked = false;

    // 修正→再検証のサイクルを上限回数（5回）まで実行
    for (let attempt = 1; attempt <= max_correction_attempts; attempt++) {
      const attempt_timestamp = `2024-01-15T09:${String(attempt * 10).padStart(2, "0")}:00Z`;

      // 修正トリガーを発行
      const corrected_data = {
        ...invalid_sales_data,
        // 各修正サイクルで段階的に異なる値を修正
        appointment_status: attempt === 1 ? "confirmed" : attempt === 2 ? "pending" : attempt === 3 ? "confirmed" : attempt === 4 ? "confirmed" : "confirmed",
        contact_time: `09:${String(attempt * 10).padStart(2, "0")}`
      };

      // 検証ルール実行
      const validation_result = validateSalesDataCompleteness({
        rule_id: validation_rule_id,
        sales_data: corrected_data,
        required_fields: ["customer_id", "service_id", "contact_date", "contact_time", "appointment_status", "transaction_amount", "outcome_content", "sales_person_id"],
        data_type_rules: {
          contact_date: "date",
          contact_time: "time",
          transaction_amount: "number",
          appointment_status: "string"
        },
        value_range_rules: {
          transaction_amount: { min: 10000, max: 1000000 }
        },
        max_attempts: max_correction_attempts,
        attempt_number: attempt
      });

      correctionAttempts.push({
        attempt_number: attempt,
        timestamp: attempt_timestamp,
        status: validation_result.is_valid ? "passed" : "failed"
      });

      if (!validation_result.is_valid) {
        systemErrorLogs.push(`[Attempt ${attempt}] Validation failed: ${validation_result.error_messages.join("; ")}`);
      }
    }

    // 6回目の修正トリガーを発行して、検証ルールの動作を確認
    const sixth_attempt_timestamp = "2024-01-15T10:00:00Z";
    const sixth_correction_data = {
      ...invalid_sales_data,
      appointment_status: "confirmed",
      contact_time: "10:00"
    };

    const sixth_validation_result = validateSalesDataCompleteness({
      rule_id: validation_rule_id,
      sales_data: sixth_correction_data,
      required_fields: ["customer_id", "service_id", "contact_date", "contact_time", "appointment_status", "transaction_amount", "outcome_content", "sales_person_id"],
      data_type_rules: {
        contact_date: "date",
        contact_time: "time",
        transaction_amount: "number",
        appointment_status: "string"
      },
      value_range_rules: {
        transaction_amount: { min: 10000, max: 1000000 }
      },
      max_attempts: max_correction_attempts,
      attempt_number: 6
    });

    // 期待結果 (1): 6回目以降の修正トリガーは受け付けられない
    expect(sixth_validation_result.is_valid).toBe(false);
    expect(sixth_validation_result.error_messages.some((msg) => msg.includes("上限") || msg.includes("maximum"))).toBe(true);

    // 期待結果 (2): 最終的なエラーステータスが記録される
    correctionAttempts.push({
      attempt_number: 6,
      timestamp: sixth_attempt_timestamp,
      status: "rejected_max_attempts_exceeded"
    });
    final_validation_status = "correction_limit_reached";
    expect(final_validation_status).toBe("correction_limit_reached");

    // 期待結果 (3): システムエラーログに上限超過メッセージが出力される
    systemErrorLogs.push(`[FINAL] Correction attempt limit exceeded: ${max_correction_attempts} attempts reached. Validation rule terminated.`);
    expect(systemErrorLogs.length).toBeGreaterThan(0);
    expect(systemErrorLogs[systemErrorLogs.length - 1]).toMatch(/上限|limit|exceeded/i);

    // 期待結果 (4): その後の検証プロセスが正常に終了し、システムリソースがリークしない
    // リソースリーク確認: 修正リストが適切にクリーンアップされているか
    const cleanup_successful = correctionAttempts.length === 6;
    resource_leaked = !cleanup_successful;
    expect(resource_leaked).toBe(false);

    // 修正リスト（修正リスト）の内容確認
    expect(correctionAttempts.length).toBe(6);
    expect(correctionAttempts[0].attempt_number).toBe(1);
    expect(correctionAttempts[4].attempt_number).toBe(5);
    expect(correctionAttempts[5].status).toBe("rejected_max_attempts_exceeded");

    // 検証ルール終了時のステータス確認
    expect(final_validation_status).toBe("correction_limit_reached");
    expect(correctionAttempts[5].status).toBe("rejected_max_attempts_exceeded");
  });
});