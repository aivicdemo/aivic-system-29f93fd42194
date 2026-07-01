import { validateSalesDataCompleteness } from "../../src/logic/it-1781935279444-2-2-1";

describe("営業データの完全性・正確性の自動検証", () => {
  // SCEN-1271: [error] 月次営業データ完全性・正確性の自動検証 - 営業データの必須項目が欠落している場合、異常を検出し通知される
  test("必須項目が欠落したデータをアップロードすると、欠落項目を明記した通知が送信される", () => {
    // Arrange: 必須項目を欠落させたテストデータを構築
    const sales_data_with_missing_fields = [
      {
        customer_name: "顧客A",
        transaction_amount: 100000,
        transaction_date: "2024-01-15",
        service_type: "サービスX",
        // contact_person は必須項目だが欠落
      },
      {
        customer_name: "顧客B",
        transaction_amount: null, // 必須項目が null
        transaction_date: "2024-01-16",
        service_type: "サービスY",
        contact_person: "営業担当者B",
      },
      {
        customer_name: "", // 必須項目が空文字列
        transaction_amount: 150000,
        transaction_date: "2024-01-17",
        service_type: "サービスZ",
        contact_person: "営業担当者C",
      },
    ];

    // Act: 検証関数を実行
    const validation_result = validateSalesDataCompleteness(
      sales_data_with_missing_fields
    );

    // Assert: 異常フラグが立つ
    expect(validation_result.has_error).toBe(true);

    // Assert: 欠落した必須項目が検出される
    expect(validation_result.missing_fields).toContain("contact_person");
    expect(validation_result.missing_fields).toContain("transaction_amount");
    expect(validation_result.missing_fields).toContain("customer_name");

    // Assert: 欠落が検出されたレコード数が正確である
    expect(validation_result.error_count).toBe(3);

    // Assert: 通知内容に欠落項目の詳細が含まれている
    expect(validation_result.notification_message).toMatch(/contact_person/);
    expect(validation_result.notification_message).toMatch(/transaction_amount/);
    expect(validation_result.notification_message).toMatch(/customer_name/);

    // Assert: 通知種別が設定されている
    expect(validation_result.notification_type).toBe("email_and_alert");

    // Assert: システムが欠落を示す異常フラグを立てる
    expect(validation_result.anomaly_detected).toBe(true);

    // Assert: 各エラー項目に対する詳細な指摘を確認
    const error_details = validation_result.detailed_errors;
    expect(error_details.length).toBe(3);
    expect(error_details[0].row_index).toBe(0);
    expect(error_details[0].missing_field_list).toContain("contact_person");
    expect(error_details[1].row_index).toBe(1);
    expect(error_details[1].missing_field_list).toContain("transaction_amount");
    expect(error_details[2].row_index).toBe(2);
    expect(error_details[2].missing_field_list).toContain("customer_name");
  });
});