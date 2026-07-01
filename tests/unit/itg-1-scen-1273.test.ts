import { validateSalesDataQuality } from "../../src/logic/it-1781935279444-2-2-1";

describe("営業データ品質チェック・異常値検出・通知", () => {
  // SCEN-1273
  test("should pass validation and proceed to next process when all required fields are present and valid", () => {
    // Arrange: テスト用の営業データを準備（すべての必須項目が正常値）
    const salesData = {
      customer_name: "株式会社テスト",
      amount: 150000,
      transaction_date: "2024-01-15",
      product_code: "PRD-001",
      contact_person: "田中太郎",
      contact_date: "2024-01-14",
      outcome_content: "初回打ち合わせ実施",
      appointment_status: "confirmed",
      service_type: "consulting",
      quantity: 10,
      unit_price: 15000,
      status: "pending_review",
    };

    // Act: 営業データ品質チェックを実行
    const result = validateSalesDataQuality(salesData);

    // Assert: 異常値検出ルール適用・すべてのチェック項目で「合格」を確認
    expect(result).toEqual({
      is_valid: true,
      status: "pass",
      validation_items: [
        {
          item_name: "customer_name",
          check_result: "pass",
          error_message: null,
        },
        {
          item_name: "amount",
          check_result: "pass",
          error_message: null,
        },
        {
          item_name: "transaction_date",
          check_result: "pass",
          error_message: null,
        },
        {
          item_name: "product_code",
          check_result: "pass",
          error_message: null,
        },
        {
          item_name: "contact_person",
          check_result: "pass",
          error_message: null,
        },
        {
          item_name: "contact_date",
          check_result: "pass",
          error_message: null,
        },
        {
          item_name: "outcome_content",
          check_result: "pass",
          error_message: null,
        },
        {
          item_name: "appointment_status",
          check_result: "pass",
          error_message: null,
        },
        {
          item_name: "service_type",
          check_result: "pass",
          error_message: null,
        },
        {
          item_name: "quantity",
          check_result: "pass",
          error_message: null,
        },
        {
          item_name: "unit_price",
          check_result: "pass",
          error_message: null,
        },
      ],
      error_count: 0,
      warning_count: 0,
      next_process_eligible: true,
      overall_message: "検証をパスしました。次工程へ進行できます。",
    });

    // Assert: エラーメッセージや警告が表示されていないことを確認
    expect(result.error_count).toBe(0);
    expect(result.warning_count).toBe(0);
    expect(
      result.validation_items.every((item) => item.error_message === null)
    ).toBe(true);

    // Assert: 検証完了後、ステータスが「パス」に更新されたことを確認
    expect(result.status).toBe("pass");

    // Assert: 次工程へのデータが正常に遷移していることを確認
    expect(result.next_process_eligible).toBe(true);
  });
});