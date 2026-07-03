import { validateSalesDataQuality } from "../../src/logic/it-1781935279444-2-2-1";

describe("営業データ品質管理・修正データ自動再検証", () => {
  // SCEN-717
  test("修正されたデータが品質基準を満たす場合、合格判定が正確に行われる", () => {
    // 初回検証: 品質基準を満たさないデータ
    const initial_sales_record = {
      sales_id: "SALE-001",
      customer_name: "", // 必須項目が空（不合格要因）
      contact_date: "2024-01-15",
      service_type: "service_A",
      appointment_confirmed: true,
      sales_amount: 100000,
    };

    // 初回検証実行
    const initial_validation_result = validateSalesDataQuality(
      initial_sales_record
    );

    // 初回検証で不合格
    expect(initial_validation_result.status).toBe("不合格");
    expect(initial_validation_result.errors).toContain(
      expect.objectContaining({
        field: "customer_name",
        reason: "必須項目が空",
      })
    );
    expect(initial_validation_result.record_id).toBe("SALE-001");
    expect(typeof initial_validation_result.validation_timestamp).toBe(
      "string"
    );

    // 修正されたデータ（品質基準を満たす）
    const corrected_sales_record = {
      sales_id: "SALE-001",
      customer_name: "株式会社ABC", // 必須項目を修正
      contact_date: "2024-01-15",
      service_type: "service_A",
      appointment_confirmed: true,
      sales_amount: 100000,
      correction_reason: "顧客名を補正",
      correction_timestamp: "2024-01-15T10:30:00Z",
    };

    // 再検証実行
    const revalidation_result = validateSalesDataQuality(
      corrected_sales_record
    );

    // 再検証で合格
    expect(revalidation_result.status).toBe("合格");
    expect(revalidation_result.errors.length).toBe(0);
    expect(revalidation_result.record_id).toBe("SALE-001");

    // 修正履歴が記録されていることを確認
    expect(revalidation_result.correction_history).toBeDefined();
    expect(revalidation_result.correction_history.reason).toBe("顧客名を補正");
    expect(revalidation_result.correction_history.previous_value).toBe("");
    expect(revalidation_result.correction_history.corrected_value).toBe(
      "株式会社ABC"
    );
    expect(revalidation_result.correction_history.corrected_at).toBe(
      "2024-01-15T10:30:00Z"
    );

    // 再検証タイムスタンプ
    expect(typeof revalidation_result.revalidation_timestamp).toBe("string");

    // 合格判定ステータスの更新
    expect(revalidation_result.record_status).toBe("承認済み");

    // 複数の検証ルール（データ型・範囲・形式）すべてをチェック
    const multi_field_test_record = {
      sales_id: "SALE-002",
      customer_name: "株式会社XYZ",
      contact_date: "2024-01-20", // 正しい日付形式
      service_type: "service_B", // 有効なサービスタイプ
      appointment_confirmed: false,
      sales_amount: 250000, // 正しい金額範囲
    };

    const multi_field_validation = validateSalesDataQuality(
      multi_field_test_record
    );

    expect(multi_field_validation.status).toBe("合格");
    expect(multi_field_validation.errors.length).toBe(0);
    expect(multi_field_validation.violations).toBeDefined();
    expect(multi_field_validation.violations.length).toBe(0);
  });
});