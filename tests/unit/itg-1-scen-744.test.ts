import { validateSalesDataQuality } from "../../src/logic/it-1781935279444-2-1-1";

describe("営業データ入力時の品質検証ルール定義・実行機能", () => {
  test("SCEN-744: 営業データ品質確認と修正サイクル - 複数回の修正を経て最終的にすべての検証ルールを満たすデータは品質確認を完了する", () => {
    // 初回検証：複数のルール違反を含むデータ
    const initial_invalid_data = {
      customer_name: "",
      contact_date: "2024-13-45",
      business_content: "テスト商談",
      appointment_status: "invalid_status",
      amount: -5000,
      service_type: null,
    };

    const initial_validation_result = validateSalesDataQuality(
      initial_invalid_data
    );
    expect(initial_validation_result.is_valid).toBe(false);
    expect(initial_validation_result.errors.length).toBeGreaterThan(0);
    expect(
      initial_validation_result.errors.some((err: any) =>
        err.message.includes("顧客名")
      )
    ).toBe(true);
    expect(
      initial_validation_result.errors.some((err: any) =>
        err.message.includes("日付形式")
      )
    ).toBe(true);
    expect(
      initial_validation_result.errors.some((err: any) =>
        err.message.includes("ステータス")
      )
    ).toBe(true);
    expect(
      initial_validation_result.errors.some((err: any) =>
        err.message.includes("金額")
      )
    ).toBe(true);

    // 第1段階：必須項目と日付形式を修正
    const first_correction = {
      customer_name: "株式会社ABC",
      contact_date: "2024-01-15",
      business_content: "テスト商談",
      appointment_status: "invalid_status",
      amount: -5000,
      service_type: null,
    };

    const first_validation_result = validateSalesDataQuality(
      first_correction
    );
    expect(first_validation_result.is_valid).toBe(false);
    expect(first_validation_result.errors.length).toBeLessThan(
      initial_validation_result.errors.length
    );
    expect(
      first_validation_result.errors.some((err: any) =>
        err.message.includes("ステータス")
      )
    ).toBe(true);
    expect(
      first_validation_result.errors.some((err: any) =>
        err.message.includes("金額")
      )
    ).toBe(true);

    // 第2段階：ステータスと金額を修正
    const second_correction = {
      customer_name: "株式会社ABC",
      contact_date: "2024-01-15",
      business_content: "テスト商談",
      appointment_status: "confirmed",
      amount: 50000,
      service_type: null,
    };

    const second_validation_result = validateSalesDataQuality(
      second_correction
    );
    expect(second_validation_result.is_valid).toBe(false);
    expect(
      second_validation_result.errors.some((err: any) =>
        err.message.includes("サービス種別")
      )
    ).toBe(true);

    // 最終段階：すべての必須項目と形式を修正
    const final_valid_data = {
      customer_name: "株式会社ABC",
      contact_date: "2024-01-15",
      business_content: "テスト商談：営業自動化システムの提案",
      appointment_status: "confirmed",
      amount: 50000,
      service_type: "システム導入",
    };

    const final_validation_result = validateSalesDataQuality(final_valid_data);
    expect(final_validation_result.is_valid).toBe(true);
    expect(final_validation_result.errors.length).toBe(0);
    expect(final_validation_result.status).toBe("approved");

    // 品質確認完了ステータスが記録されたことを確認
    expect(final_validation_result.completion_timestamp).toBeDefined();
    expect(final_validation_result.ready_for_billing_process).toBe(true);
  });
});