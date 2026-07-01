import { describe, test, expect } from "@jest/globals";
import { validateSalesDataAnomalies } from "../../src/logic/it-1781935279444-2-2-1";

describe("営業データ異常値の自動検出", () => {
  test("SCEN-892: 営業データの値がちょうど許容範囲の下限値である場合、チェック結果『正常』が返される", () => {
    // Arrange: テスト対象の営業データ異常値検出機能を初期化する
    const sales_data = {
      customer_id: "CUST_001",
      service_id: "SVC_SALES",
      sales_amount: 100000, // 許容範囲の下限値をちょうど設定
      appt_count: 5,
      deal_count: 3,
      customer_reaction: "positive",
      contact_date: new Date("2024-01-15T09:00:00Z"),
      reporting_period: "2024-01"
    };

    const validation_rules = {
      sales_amount: {
        min_value: 100000,
        max_value: 5000000,
        required: true,
        data_type: "number"
      },
      appt_count: {
        min_value: 0,
        max_value: 500,
        required: true,
        data_type: "number"
      },
      deal_count: {
        min_value: 0,
        max_value: 500,
        required: true,
        data_type: "number"
      },
      customer_reaction: {
        required: true,
        data_type: "string",
        allowed_values: ["positive", "neutral", "negative"]
      },
      contact_date: {
        required: true,
        data_type: "date"
      }
    };

    // Act: データ品質チェック関数を実行する
    const check_result = validateSalesDataAnomalies(
      sales_data,
      validation_rules
    );

    // Assert: チェック結果を取得する
    expect(check_result.is_valid).toBe(true);
    expect(check_result.has_anomaly).toBe(false);
    expect(check_result.error_messages).toEqual([]);
    expect(check_result.status).toBe("success");

    // 売上金額が下限値であることを確認
    expect(sales_data.sales_amount).toBe(100000);

    // チェック結果が『正常』であることを確認
    expect(check_result.validation_items).toContainEqual(
      expect.objectContaining({
        field_name: "sales_amount",
        is_valid: true,
        error_detail: null
      })
    );
  });
});