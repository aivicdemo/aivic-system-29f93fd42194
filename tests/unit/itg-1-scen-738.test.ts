import { validateSalesDataQuality } from "../../src/logic/it-1781935279444-2-2-1";

describe("営業データ品質チェック・修正サイクル", () => {
  // SCEN-738: [normal] 営業データ品質チェック・修正サイクル - 品質基準を満たさないデータに対して修正指示が生成される
  test("品質基準を満たさないデータに対して具体的で実行可能な修正指示が自動生成される", () => {
    // 準備: 品質基準を満たさない営業データ（必須項目不足、形式エラー）
    const defectiveData = {
      customer_name: "", // 必須項目が空
      contact_date: "2024-13-45", // 無効な日付形式
      sales_amount: "12000yen", // 数値ではなく文字列
      appointment_status: "confirm", // 定義されていないステータス値
      service_type: "サービスA", // 許容範囲外
    };

    // データ品質チェック機能を実行
    const checkResult = validateSalesDataQuality(defectiveData);

    // チェック結果が不合格であることを確認
    expect(checkResult.is_valid).toBe(false);

    // 違反内容の詳細情報が配列で返されることを確認
    expect(Array.isArray(checkResult.violations)).toBe(true);
    expect(checkResult.violations.length).toBeGreaterThan(0);

    // 各違反にはフィールド名とエラー内容が含まれることを確認
    const violation_customer_name = checkResult.violations.find(
      (v) => v.field === "customer_name"
    );
    expect(violation_customer_name).toBeDefined();
    expect(violation_customer_name?.error_code).toBe("REQUIRED_FIELD_EMPTY");
    expect(violation_customer_name?.message).toMatch(/顧客名/);

    const violation_contact_date = checkResult.violations.find(
      (v) => v.field === "contact_date"
    );
    expect(violation_contact_date).toBeDefined();
    expect(violation_contact_date?.error_code).toBe("INVALID_DATE_FORMAT");
    expect(violation_contact_date?.message).toMatch(/日付/);

    const violation_sales_amount = checkResult.violations.find(
      (v) => v.field === "sales_amount"
    );
    expect(violation_sales_amount).toBeDefined();
    expect(violation_sales_amount?.error_code).toBe("INVALID_DATA_TYPE");
    expect(violation_sales_amount?.message).toMatch(/金額/);

    const violation_appointment_status = checkResult.violations.find(
      (v) => v.field === "appointment_status"
    );
    expect(violation_appointment_status).toBeDefined();
    expect(violation_appointment_status?.error_code).toBe("INVALID_ENUM_VALUE");
    expect(violation_appointment_status?.message).toMatch(/ステータス/);

    // 修正指示が自動生成されていることを確認
    expect(checkResult.correction_instructions).toBeDefined();
    expect(Array.isArray(checkResult.correction_instructions)).toBe(true);
    expect(checkResult.correction_instructions.length).toBeGreaterThan(0);

    // 修正指示に違反項目が含まれることを確認
    const instruction_customer_name = checkResult.correction_instructions.find(
      (inst) => inst.field === "customer_name"
    );
    expect(instruction_customer_name).toBeDefined();
    expect(instruction_customer_name?.recommended_fix).toMatch(/顧客名を入力/);

    const instruction_contact_date = checkResult.correction_instructions.find(
      (inst) => inst.field === "contact_date"
    );
    expect(instruction_contact_date).toBeDefined();
    expect(instruction_contact_date?.recommended_fix).toMatch(/YYYY-MM-DD/);

    const instruction_sales_amount = checkResult.correction_instructions.find(
      (inst) => inst.field === "sales_amount"
    );
    expect(instruction_sales_amount).toBeDefined();
    expect(instruction_sales_amount?.recommended_fix).toMatch(/数値のみ/);

    const instruction_appointment_status = checkResult.correction_instructions.find(
      (inst) => inst.field === "appointment_status"
    );
    expect(instruction_appointment_status).toBeDefined();
    expect(instruction_appointment_status?.recommended_fix).toMatch(
      /scheduled|confirmed|pending/
    );

    // 修正後のデータを準備
    const correctedData = {
      customer_name: "ABC株式会社",
      contact_date: "2024-01-15",
      sales_amount: 120000,
      appointment_status: "confirmed",
      service_type: "service_a",
    };

    // 修正後のデータで再度品質チェックを実行
    const recheckResult = validateSalesDataQuality(correctedData);

    // 修正後のデータが品質基準を満たすことを確認
    expect(recheckResult.is_valid).toBe(true);
    expect(recheckResult.violations.length).toBe(0);
    expect(recheckResult.correction_instructions.length).toBe(0);
  });
});