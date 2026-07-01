import { validateSalesDataAfterCorrection } from "../../src/logic/it-1781935279444-2-2-1";

describe("営業データの完全性・正確性を自動検証し、不足データ・誤りを検出・通知する機能", () => {
  // SCEN-724: [error] 修正後データ再検証 - 修正後の必須項目が再度空欄で不合格判定となる
  test("修正後のデータ再検証で必須項目が空欄の場合、検証失敗で不合格判定となること", () => {
    const corrected_record_id = "REC_001";
    const corrected_customer_name = "テスト顧客";
    const corrected_amount = 50000;
    const corrected_billing_date = "2024-01-15";
    const corrected_contact_date = "2024-01-10";
    const corrected_status = "成約";

    // 修正後のレコード：すべての必須項目が入力されている
    const corrected_data = {
      record_id: corrected_record_id,
      customer_name: corrected_customer_name,
      amount: corrected_amount,
      billing_date: corrected_billing_date,
      contact_date: corrected_contact_date,
      status: corrected_status,
    };

    // 検証ルール：必須項目リスト
    const required_fields = [
      "customer_name",
      "amount",
      "billing_date",
      "contact_date",
      "status",
    ];

    // ケース 1: 修正後、必須項目（顧客名）が空欄に戻された場合
    const corrupted_data_1 = {
      record_id: corrected_record_id,
      customer_name: "",
      amount: corrected_amount,
      billing_date: corrected_billing_date,
      contact_date: corrected_contact_date,
      status: corrected_status,
    };

    const result_1 = validateSalesDataAfterCorrection(
      corrupted_data_1,
      required_fields
    );

    expect(result_1).toEqual({
      is_valid: false,
      validation_status: "検証失敗",
      judgment: "不合格",
      missing_fields: ["customer_name"],
      error_details: [
        {
          field_name: "customer_name",
          error_message: "顧客名が空欄です",
        },
      ],
    });

    // ケース 2: 修正後、必須項目（金額）が空欄に戻された場合
    const corrupted_data_2 = {
      record_id: corrected_record_id,
      customer_name: corrected_customer_name,
      amount: null,
      billing_date: corrected_billing_date,
      contact_date: corrected_contact_date,
      status: corrected_status,
    };

    const result_2 = validateSalesDataAfterCorrection(
      corrupted_data_2,
      required_fields
    );

    expect(result_2).toEqual({
      is_valid: false,
      validation_status: "検証失敗",
      judgment: "不合格",
      missing_fields: ["amount"],
      error_details: [
        {
          field_name: "amount",
          error_message: "金額が空欄です",
        },
      ],
    });

    // ケース 3: 修正後、複数の必須項目（請求日・ステータス）が空欄に戻された場合
    const corrupted_data_3 = {
      record_id: corrected_record_id,
      customer_name: corrected_customer_name,
      amount: corrected_amount,
      billing_date: "",
      contact_date: corrected_contact_date,
      status: "",
    };

    const result_3 = validateSalesDataAfterCorrection(
      corrupted_data_3,
      required_fields
    );

    expect(result_3).toEqual({
      is_valid: false,
      validation_status: "検証失敗",
      judgment: "不合格",
      missing_fields: ["billing_date", "status"],
      error_details: [
        {
          field_name: "billing_date",
          error_message: "請求日が空欄です",
        },
        {
          field_name: "status",
          error_message: "ステータスが空欄です",
        },
      ],
    });

    // ケース 4: 修正後、すべての必須項目が入力されている場合（成功ケース）
    const valid_data = {
      record_id: corrected_record_id,
      customer_name: corrected_customer_name,
      amount: corrected_amount,
      billing_date: corrected_billing_date,
      contact_date: corrected_contact_date,
      status: corrected_status,
    };

    const result_4 = validateSalesDataAfterCorrection(
      valid_data,
      required_fields
    );

    expect(result_4).toEqual({
      is_valid: true,
      validation_status: "検証成功",
      judgment: "合格",
      missing_fields: [],
      error_details: [],
    });
  });
});