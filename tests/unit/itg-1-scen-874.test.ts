import { validateSalesData } from "../../src/logic/it-1781935279444-2-2-1";

describe("営業データの完全性・正確性を自動検証", () => {
  // SCEN-874
  test("営業データの必須項目が未入力の場合に修正を促すメッセージが返される", () => {
    // 必須項目（顧客名、取引金額、取引日）のいずれかが空白
    const invalid_data_1 = {
      customer_name: "",
      transaction_amount: 50000,
      transaction_date: "2024-01-15",
    };

    const result_1 = validateSalesData(invalid_data_1);
    expect(result_1.is_valid).toBe(false);
    expect(result_1.error_message).toMatch(/顧客名/);
    expect(result_1.error_message).toMatch(/未入力|必須/);

    // 取引金額が空白
    const invalid_data_2 = {
      customer_name: "A社",
      transaction_amount: null,
      transaction_date: "2024-01-15",
    };

    const result_2 = validateSalesData(invalid_data_2);
    expect(result_2.is_valid).toBe(false);
    expect(result_2.error_message).toMatch(/取引金額/);

    // 取引日が空白
    const invalid_data_3 = {
      customer_name: "B社",
      transaction_amount: 75000,
      transaction_date: "",
    };

    const result_3 = validateSalesData(invalid_data_3);
    expect(result_3.is_valid).toBe(false);
    expect(result_3.error_message).toMatch(/取引日/);

    // すべての必須項目が入力されている場合は検証合格
    const valid_data = {
      customer_name: "C社",
      transaction_amount: 100000,
      transaction_date: "2024-01-20",
    };

    const result_valid = validateSalesData(valid_data);
    expect(result_valid.is_valid).toBe(true);
    expect(result_valid.error_message).toBe("");
  });
});