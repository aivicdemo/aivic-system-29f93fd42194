import { validateSalesDataCompleteness } from "../../src/logic/it-1781935279444-2-2-1";

describe("営業データ完全性・正確性自動検証", () => {
  // SCEN-1125
  test("異常値・欠落・矛盾が複数件検出された場合、すべてが一覧で返却される", () => {
    const input_data = [
      {
        row_number: 1,
        customer_id: "C001",
        appointment_date: "2024-01-15",
        appointment_count: "invalid_number",
        contract_amount: 100000,
        service_type: "TypeA",
      },
      {
        row_number: 2,
        customer_id: "C002",
        appointment_date: "",
        appointment_count: 5,
        contract_amount: -50000,
        service_type: "TypeB",
      },
      {
        row_number: 3,
        customer_id: "",
        appointment_date: "2024-01-16",
        appointment_count: 3,
        contract_amount: 200000,
        service_type: "TypeC",
      },
      {
        row_number: 4,
        customer_id: "C004",
        appointment_date: "2024-01-17",
        appointment_count: 2,
        contract_amount: 150000,
        service_type: "",
      },
      {
        row_number: 5,
        customer_id: "C005",
        appointment_date: "2024-01-18",
        appointment_count: null,
        contract_amount: 300000,
        service_type: "TypeA",
      },
      {
        row_number: 6,
        customer_id: "C006",
        appointment_date: "2024-02-01",
        appointment_count: 1,
        contract_amount: 999999999999,
        service_type: "TypeD",
      },
      {
        row_number: 7,
        customer_id: "C007",
        appointment_date: "2024-01-19",
        appointment_count: 0,
        contract_amount: 50000,
        service_type: "TypeE",
      },
    ];

    const result = validateSalesDataCompleteness(input_data);

    expect(result.total_errors).toBe(7);
    expect(Array.isArray(result.errors)).toBe(true);
    expect(result.errors.length).toBe(7);

    const error_codes = result.errors.map(
      (e: { error_code: string }) => e.error_code
    );
    expect(error_codes).toContain("INVALID_VALUE");
    expect(error_codes).toContain("MISSING_VALUE");
    expect(error_codes).toContain("RANGE_EXCEEDED");

    const row_numbers = result.errors.map((e: { row_number: number }) => e.row_number);
    expect(row_numbers).toEqual(
      expect.arrayContaining([1, 2, 3, 4, 5, 6, 7])
    );

    result.errors.forEach(
      (error: {
        error_code: string;
        error_message: string;
        field_name: string;
        row_number: number;
      }) => {
        expect(error).toHaveProperty("error_code");
        expect(error).toHaveProperty("error_message");
        expect(error).toHaveProperty("field_name");
        expect(error).toHaveProperty("row_number");
        expect(typeof error.error_code).toBe("string");
        expect(typeof error.error_message).toBe("string");
        expect(typeof error.field_name).toBe("string");
        expect(typeof error.row_number).toBe("number");
      }
    );

    const error_ids = result.errors.map(
      (e: { error_code: string; field_name: string; row_number: number }) =>
        `${e.error_code}_${e.field_name}_${e.row_number}`
    );
    const unique_error_ids = new Set(error_ids);
    expect(unique_error_ids.size).toBe(error_ids.length);

    const anomaly_error = result.errors.find(
      (e: { row_number: number; field_name: string }) =>
        e.row_number === 1 && e.field_name === "appointment_count"
    );
    expect(anomaly_error).toBeDefined();
    expect(anomaly_error.error_code).toBe("INVALID_VALUE");

    const missing_error_1 = result.errors.find(
      (e: { row_number: number; field_name: string }) =>
        e.row_number === 2 && e.field_name === "appointment_date"
    );
    expect(missing_error_1).toBeDefined();
    expect(missing_error_1.error_code).toBe("MISSING_VALUE");

    const missing_error_2 = result.errors.find(
      (e: { row_number: number; field_name: string }) =>
        e.row_number === 3 && e.field_name === "customer_id"
    );
    expect(missing_error_2).toBeDefined();
    expect(missing_error_2.error_code).toBe("MISSING_VALUE");

    const contradiction_error_1 = result.errors.find(
      (e: { row_number: number; field_name: string }) =>
        e.row_number === 2 && e.field_name === "contract_amount"
    );
    expect(contradiction_error_1).toBeDefined();
    expect(contradiction_error_1.error_code).toBe("RANGE_EXCEEDED");

    const contradiction_error_2 = result.errors.find(
      (e: { row_number: number; field_name: string }) =>
        e.row_number === 6 && e.field_name === "contract_amount"
    );
    expect(contradiction_error_2).toBeDefined();
    expect(contradiction_error_2.error_code).toBe("RANGE_EXCEEDED");

    expect(result.validation_status).toBe("FAILED");
  });
});