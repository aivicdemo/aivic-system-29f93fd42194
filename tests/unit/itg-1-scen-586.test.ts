import { validateSalesDataCompleteness } from "../../src/logic/it-1781935279444-2-2-1";

describe("営業データの完全性・正確性を自動検証し、不足データ・誤りを検出・通知する機能", () => {
  // SCEN-586: [error] 営業データの品質検証実行 - 必須項目が不足している営業データが入力された場合、検証エラーが検出され詳細な指摘内容が表示される
  test("必須項目（顧客名、金額、日付など）の一部を意図的に空欄にしたデータを検証すると、不足項目の詳細な指摘内容が表示される", () => {
    // 必須項目不足データセット：顧客名と金額を欠落させたCSVレコード
    const incompleteDataSet = [
      {
        customer_name: "",
        contact_date: "2024-01-15",
        sales_amount: 50000,
        appointment_status: "confirmed",
        service_type: "TypeA",
      },
      {
        customer_name: "Customer B",
        contact_date: "2024-01-16",
        sales_amount: "",
        appointment_status: "pending",
        service_type: "TypeB",
      },
      {
        customer_name: "Customer C",
        contact_date: "",
        sales_amount: 30000,
        appointment_status: "confirmed",
        service_type: "TypeC",
      },
    ];

    const result = validateSalesDataCompleteness(incompleteDataSet);

    // ①不足している各必須項目名が明記されることを検証
    expect(result.validation_status).toBe("failed");
    expect(result.error_details).toBeDefined();
    expect(result.error_details.length).toBe(3);

    // 1行目：顧客名欠落
    expect(result.error_details[0]).toMatchObject({
      row_number: 1,
      column_name: "customer_name",
      error_type: "missing_required_field",
    });

    // 2行目：金額欠落
    expect(result.error_details[1]).toMatchObject({
      row_number: 2,
      column_name: "sales_amount",
      error_type: "missing_required_field",
    });

    // 3行目：日付欠落
    expect(result.error_details[2]).toMatchObject({
      row_number: 3,
      column_name: "contact_date",
      error_type: "missing_required_field",
    });

    // ②各項目の不足理由が具体的に説明されることを検証
    expect(result.error_details[0].error_message).toMatch(/顧客名/);
    expect(result.error_details[0].error_message).toMatch(/必須/);
    expect(result.error_details[1].error_message).toMatch(/金額/);
    expect(result.error_details[2].error_message).toMatch(/日付/);

    // ③エラーが発生した行番号と列情報が表示されることを検証
    expect(result.error_details[0].row_number).toBe(1);
    expect(result.error_details[0].column_name).toBe("customer_name");
    expect(result.error_details[1].row_number).toBe(2);
    expect(result.error_details[1].column_name).toBe("sales_amount");
    expect(result.error_details[2].row_number).toBe(3);
    expect(result.error_details[2].column_name).toBe("contact_date");

    // ④修正が必要なレコード件数が表示されることを検証
    expect(result.total_error_count).toBe(3);
    expect(result.affected_record_count).toBe(3);

    // ⑤ユーザーが修正すべき内容が明確に指摘されていることを検証
    expect(result.correction_summary).toBeDefined();
    expect(result.correction_summary).toMatch(/3件/);
    expect(result.correction_summary).toMatch(/修正/);

    // 追加検証：全体サマリーが正確に返される
    expect(result.total_records_checked).toBe(3);
    expect(result.passed_records_count).toBe(0);
    expect(result.failed_records_count).toBe(3);
  });

  // 追加テスト（ハッピーパス）：すべての必須項目が揃ったデータは検証パスする
  test("すべての必須項目が揃ったデータは検証をパスする", () => {
    const completeDataSet = [
      {
        customer_name: "Customer A",
        contact_date: "2024-01-15",
        sales_amount: 50000,
        appointment_status: "confirmed",
        service_type: "TypeA",
      },
      {
        customer_name: "Customer B",
        contact_date: "2024-01-16",
        sales_amount: 75000,
        appointment_status: "pending",
        service_type: "TypeB",
      },
    ];

    const result = validateSalesDataCompleteness(completeDataSet);

    expect(result.validation_status).toBe("passed");
    expect(result.total_records_checked).toBe(2);
    expect(result.passed_records_count).toBe(2);
    expect(result.failed_records_count).toBe(0);
    expect(result.error_details.length).toBe(0);
  });

  // 追加テスト（エラーケース）：必須項目が完全に欠落している場合
  test("必須項目が完全に欠落しているレコードを検証するとエラーが検出される", () => {
    const missingAllRequiredFields = [
      {
        customer_name: "",
        contact_date: "",
        sales_amount: "",
        appointment_status: "",
        service_type: "TypeA",
      },
    ];

    const result = validateSalesDataCompleteness(missingAllRequiredFields);

    expect(result.validation_status).toBe("failed");
    expect(result.error_details.length).toBe(4); // customer_name, contact_date, sales_amount, appointment_status
    expect(result.total_error_count).toBe(4);
    expect(result.failed_records_count).toBe(1);
  });

  // 追加テスト（境界値）：データセットが空の場合
  test("空のデータセットが入力された場合、検証は成功し記録数0として返される", () => {
    const emptyDataSet: any[] = [];

    const result = validateSalesDataCompleteness(emptyDataSet);

    expect(result.validation_status).toBe("passed");
    expect(result.total_records_checked).toBe(0);
    expect(result.passed_records_count).toBe(0);
    expect(result.failed_records_count).toBe(0);
    expect(result.error_details.length).toBe(0);
  });

  // 追加テスト（混合ケース）：正常レコードとエラーレコードが混在する場合
  test("正常レコードとエラーレコードが混在する場合、エラーレコードのみが検出される", () => {
    const mixedDataSet = [
      {
        customer_name: "Customer A",
        contact_date: "2024-01-15",
        sales_amount: 50000,
        appointment_status: "confirmed",
        service_type: "TypeA",
      },
      {
        customer_name: "",
        contact_date: "2024-01-16",
        sales_amount: 75000,
        appointment_status: "pending",
        service_type: "TypeB",
      },
      {
        customer_name: "Customer C",
        contact_date: "2024-01-17",
        sales_amount: "",
        appointment_status: "confirmed",
        service_type: "TypeC",
      },
    ];

    const result = validateSalesDataCompleteness(mixedDataSet);

    expect(result.validation_status).toBe("failed");
    expect(result.total_records_checked).toBe(3);
    expect(result.passed_records_count).toBe(1);
    expect(result.failed_records_count).toBe(2);
    expect(result.total_error_count).toBe(2);
    expect(result.error_details).toHaveLength(2);
    expect(result.error_details[0].row_number).toBe(2);
    expect(result.error_details[1].row_number).toBe(3);
  });
});