import { validateSalesData } from "../../src/logic/it-1781935279444-2-2-1";

describe("営業データの完全性・正確性を自動検証し、不足データ・誤りを検出・通知する機能", () => {
  // SCEN-758: [error] 営業データ完全性・正確性の自動検証 - 営業データのアポ数が負の数で入力されている場合、データ正確性エラーとして検出される
  test("アポ数が負の数の場合、データ正確性エラーとして検出される", () => {
    const salesData = {
      sales_rep_name: "山田太郎",
      customer_name: "ABC株式会社",
      contact_date: "2024-01-15",
      service_type: "standard",
      appointment_count: -5,
      contract_count: 2,
      customer_response: "positive",
    };

    expect(() => validateSalesData(salesData)).toThrow(/アポ数/);
  });

  test("アポ数が0の場合、検証成功", () => {
    const salesData = {
      sales_rep_name: "山田太郎",
      customer_name: "ABC株式会社",
      contact_date: "2024-01-15",
      service_type: "standard",
      appointment_count: 0,
      contract_count: 0,
      customer_response: "neutral",
    };

    const result = validateSalesData(salesData);
    expect(result.is_valid).toBe(true);
    expect(result.error_messages).toEqual([]);
  });

  test("アポ数が正の数の場合、検証成功", () => {
    const salesData = {
      sales_rep_name: "田中花子",
      customer_name: "XYZ株式会社",
      contact_date: "2024-01-16",
      service_type: "premium",
      appointment_count: 5,
      contract_count: 2,
      customer_response: "positive",
    };

    const result = validateSalesData(salesData);
    expect(result.is_valid).toBe(true);
    expect(result.error_messages).toEqual([]);
  });

  test("営業担当者名が空の場合、必須項目エラーとして検出される", () => {
    const salesData = {
      sales_rep_name: "",
      customer_name: "ABC株式会社",
      contact_date: "2024-01-15",
      service_type: "standard",
      appointment_count: 3,
      contract_count: 1,
      customer_response: "positive",
    };

    expect(() => validateSalesData(salesData)).toThrow(/営業担当者名/);
  });

  test("顧客名が空の場合、必須項目エラーとして検出される", () => {
    const salesData = {
      sales_rep_name: "山田太郎",
      customer_name: "",
      contact_date: "2024-01-15",
      service_type: "standard",
      appointment_count: 2,
      contract_count: 1,
      customer_response: "positive",
    };

    expect(() => validateSalesData(salesData)).toThrow(/顧客名/);
  });

  test("複数の検証エラーが発生した場合、すべてのエラーが記録される", () => {
    const salesData = {
      sales_rep_name: "山田太郎",
      customer_name: "ABC株式会社",
      contact_date: "2024-01-15",
      service_type: "standard",
      appointment_count: -3,
      contract_count: -1,
      customer_response: "positive",
    };

    expect(() => validateSalesData(salesData)).toThrow(/アポ数|成約数/);
  });

  test("成約数が負の数の場合、データ正確性エラーとして検出される", () => {
    const salesData = {
      sales_rep_name: "田中花子",
      customer_name: "XYZ株式会社",
      contact_date: "2024-01-16",
      service_type: "premium",
      appointment_count: 5,
      contract_count: -2,
      customer_response: "positive",
    };

    expect(() => validateSalesData(salesData)).toThrow(/成約数/);
  });

  test("接触日が日付形式でない場合、データ型エラーとして検出される", () => {
    const salesData = {
      sales_rep_name: "山田太郎",
      customer_name: "ABC株式会社",
      contact_date: "invalid-date",
      service_type: "standard",
      appointment_count: 2,
      contract_count: 1,
      customer_response: "positive",
    };

    expect(() => validateSalesData(salesData)).toThrow(/接触日/);
  });

  test("すべての必須項目が正常で、アポ数・成約数がともに0の場合、検証成功", () => {
    const salesData = {
      sales_rep_name: "鈴木次郎",
      customer_name: "DEF株式会社",
      contact_date: "2024-01-20",
      service_type: "standard",
      appointment_count: 0,
      contract_count: 0,
      customer_response: "neutral",
    };

    const result = validateSalesData(salesData);
    expect(result.is_valid).toBe(true);
    expect(result.error_messages).toEqual([]);
  });

  test("アポ数が整数でない場合、データ型エラーとして検出される", () => {
    const salesData = {
      sales_rep_name: "山田太郎",
      customer_name: "ABC株式会社",
      contact_date: "2024-01-15",
      service_type: "standard",
      appointment_count: 3.5,
      contract_count: 1,
      customer_response: "positive",
    };

    expect(() => validateSalesData(salesData)).toThrow(/アポ数/);
  });
});