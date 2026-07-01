import { validateSalesDataTypes } from "../../src/logic/it-1781935279444-2-2-1";

describe("営業データの完全性・正確性の自動検証", () => {
  test("SCEN-888: 営業データ異常値の自動検出 - 型不正の場合、エラーと詳細な不正項目情報が返される", () => {
    // 入力: 数値型が要求される項目に文字列値、日付型に不正な形式、メールアドレス型に不正な形式を含むデータ
    const input_sales_data = {
      appointment_count: "abc", // 数値型のはずが文字列
      contract_date: "2024/13/45", // 日付型のはずが不正な形式（月=13, 日=45）
      customer_email: "invalid-email", // メールアドレス型のはずが不正な形式
    };

    // 実行: validateSalesDataTypes を呼び出し
    const result = validateSalesDataTypes(input_sales_data);

    // 検証1: チェック結果がエラーステータスで返される
    expect(result.status).toBe("error");

    // 検証2: 複数の不正項目がすべてリストアップされている
    expect(result.validation_errors).toBeDefined();
    expect(result.validation_errors.length).toBe(3);

    // 検証3: 不正な項目情報1（appointment_count）の詳細確認
    const appointment_error = result.validation_errors.find(
      (err: any) => err.field_name === "appointment_count"
    );
    expect(appointment_error).toBeDefined();
    expect(appointment_error.expected_type).toBe("number");
    expect(appointment_error.actual_value).toBe("abc");
    expect(appointment_error.error_message).toMatch(/型/);

    // 検証4: 不正な項目情報2（contract_date）の詳細確認
    const date_error = result.validation_errors.find(
      (err: any) => err.field_name === "contract_date"
    );
    expect(date_error).toBeDefined();
    expect(date_error.expected_type).toBe("date");
    expect(date_error.actual_value).toBe("2024/13/45");
    expect(date_error.error_message).toMatch(/日付/);

    // 検証5: 不正な項目情報3（customer_email）の詳細確認
    const email_error = result.validation_errors.find(
      (err: any) => err.field_name === "customer_email"
    );
    expect(email_error).toBeDefined();
    expect(email_error.expected_type).toBe("email");
    expect(email_error.actual_value).toBe("invalid-email");
    expect(email_error.error_message).toMatch(/メール/);

    // 検証6: 各エラーが正確な値を保持している
    expect(appointment_error.field_name).toBe("appointment_count");
    expect(date_error.field_name).toBe("contract_date");
    expect(email_error.field_name).toBe("customer_email");
  });
});