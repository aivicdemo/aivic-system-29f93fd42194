import { describe, test, expect } from "@jest/globals";
import { validateSalesDataTypes } from "../../src/logic/it-1781935279444-2-2-1";

describe("営業データの完全性・正確性を自動検証し、不足データ・誤りを検出・通知する機能", () => {
  // SCEN-875: [error] 営業データ品質チェック機能 - 営業データのデータ型が定義と異なる場合にエラーが検出される
  test("営業データのデータ型が定義と異なる場合にすべてのエラーが検出される", () => {
    const schema = {
      sales_rep_name: { type: "string" },
      sales_amount: { type: "number" },
      transaction_date: { type: "date", format: "YYYY-MM-DD" },
      customer_id: { type: "integer" },
    };

    const raw_data = [
      {
        row_number: 1,
        sales_rep_name: "Tanaka Taro",
        sales_amount: 150000,
        transaction_date: "2024-01-15",
        customer_id: 1001,
      },
      {
        row_number: 2,
        sales_rep_name: "Suzuki Hanako",
        sales_amount: "ABC",
        transaction_date: "2024/01/01",
        customer_id: 12.5,
      },
    ];

    const result = validateSalesDataTypes({ schema, raw_data });

    expect(result.is_valid).toBe(false);
    expect(result.errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          row_number: 2,
          column_name: "sales_amount",
          error_type: "data_type_mismatch",
          expected_type: "number",
          actual_value: "ABC",
          actual_type: "string",
          message: expect.stringMatching(/sales_amount/),
        }),
        expect.objectContaining({
          row_number: 2,
          column_name: "transaction_date",
          error_type: "format_error",
          expected_format: "YYYY-MM-DD",
          actual_value: "2024/01/01",
          message: expect.stringMatching(/transaction_date/),
        }),
        expect.objectContaining({
          row_number: 2,
          column_name: "customer_id",
          error_type: "data_type_mismatch",
          expected_type: "integer",
          actual_value: 12.5,
          actual_type: "number",
          message: expect.stringMatching(/customer_id/),
        }),
      ])
    );

    expect(result.errors.length).toBe(3);
    expect(result.summary).toEqual({
      total_rows: 2,
      valid_rows: 1,
      invalid_rows: 1,
      total_errors: 3,
    });
  });
});