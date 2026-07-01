import { describe, test, expect } from "@jest/globals";
import { validateSalesDataQuality } from "../../src/logic/it-1781935279444-2-2-1";

describe("営業データ品質検証 - 数値項目の型チェック", () => {
  // SCEN-588: [error] 営業データの品質検証実行 - 営業データの数値項目がデータ型として想定される型以外の値を含む場合、検証エラーが検出される
  test("数値項目に非数値型の値を含むデータセットで検証エラーが検出される", () => {
    const invalidSalesData = [
      {
        row_number: 1,
        customer_id: "CUST001",
        appointment_count: "invalid_string",
        contract_count: 5,
        service_type: "TypeA",
        amount: 100000,
      },
      {
        row_number: 2,
        customer_id: "CUST002",
        appointment_count: 10,
        contract_count: "three",
        service_type: "TypeB",
        amount: 250000,
      },
      {
        row_number: 3,
        customer_id: "CUST003",
        appointment_count: 8,
        contract_count: 4,
        service_type: "TypeA",
        amount: "not_a_number",
      },
      {
        row_number: 4,
        customer_id: "CUST004",
        appointment_count: 12,
        contract_count: 6,
        service_type: "TypeB",
        amount: 180000,
      },
    ];

    const result = validateSalesDataQuality(invalidSalesData);

    expect(result.is_valid).toBe(false);
    expect(result.error_count).toBe(3);
    expect(result.errors).toHaveLength(3);

    expect(result.errors[0]).toEqual(
      expect.objectContaining({
        row_number: 1,
        column_name: "appointment_count",
        error_type: "データ型不一致",
        expected_type: "number",
        actual_value: "invalid_string",
      })
    );

    expect(result.errors[1]).toEqual(
      expect.objectContaining({
        row_number: 2,
        column_name: "contract_count",
        error_type: "データ型不一致",
        expected_type: "number",
        actual_value: "three",
      })
    );

    expect(result.errors[2]).toEqual(
      expect.objectContaining({
        row_number: 3,
        column_name: "amount",
        error_type: "データ型不一致",
        expected_type: "number",
        actual_value: "not_a_number",
      })
    );

    const normal_row = result.valid_rows.find(
      (row: { row_number: number }) => row.row_number === 4
    );
    expect(normal_row).toEqual(
      expect.objectContaining({
        row_number: 4,
        customer_id: "CUST004",
        appointment_count: 12,
        contract_count: 6,
        service_type: "TypeB",
        amount: 180000,
      })
    );

    expect(result.summary).toEqual({
      total_rows: 4,
      valid_rows_count: 1,
      invalid_rows_count: 3,
      validation_status: "不合格",
    });
  });
});