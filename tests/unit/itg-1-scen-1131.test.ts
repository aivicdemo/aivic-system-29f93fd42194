import { describe, test, expect } from "@jest/globals";
import { validateSalesData } from "../../src/logic/it-1781935279444-2-2-1";

describe("営業データの完全性・正確性を自動検証し、不足データ・誤りを検出・通知する機能", () => {
  // SCEN-1131: [error] 営業データ品質検証 - 必須項目が欠落している営業データが検証エラーとして検出される
  test("必須項目が欠落した営業データが検証エラーとして検出される", () => {
    // 必須項目: customerName, transactionAmount, transactionDate
    const invalidDataMissingCustomerName = {
      customerName: "",
      transactionAmount: 50000,
      transactionDate: "2024-01-15",
      serviceType: "standard"
    };

    expect(() => validateSalesData(invalidDataMissingCustomerName)).toThrow(
      /顧客名/
    );

    const invalidDataMissingAmount = {
      customerName: "Company A",
      transactionAmount: null,
      transactionDate: "2024-01-15",
      serviceType: "standard"
    };

    expect(() => validateSalesData(invalidDataMissingAmount)).toThrow(
      /取引金額/
    );

    const invalidDataMissingDate = {
      customerName: "Company A",
      transactionAmount: 50000,
      transactionDate: "",
      serviceType: "standard"
    };

    expect(() => validateSalesData(invalidDataMissingDate)).toThrow(
      /取引日付/
    );

    // 成功ケース: すべての必須項目が揃っている
    const validData = {
      customerName: "Company A",
      transactionAmount: 50000,
      transactionDate: "2024-01-15",
      serviceType: "standard"
    };

    const result = validateSalesData(validData);
    expect(result).toEqual({
      status: "合格",
      validationErrors: [],
      errorCount: 0
    });

    // 境界値テスト: 金額が 0 の場合は不合格
    const invalidDataZeroAmount = {
      customerName: "Company A",
      transactionAmount: 0,
      transactionDate: "2024-01-15",
      serviceType: "standard"
    };

    expect(() => validateSalesData(invalidDataZeroAmount)).toThrow(
      /取引金額/
    );

    // 境界値テスト: 日付形式が不正な場合
    const invalidDateFormat = {
      customerName: "Company A",
      transactionAmount: 50000,
      transactionDate: "2024/01/15",
      serviceType: "standard"
    };

    expect(() => validateSalesData(invalidDateFormat)).toThrow(/日付/);

    // 複数項目欠落時は最初に検出した項目でエラー
    const invalidDataMultipleMissing = {
      customerName: "",
      transactionAmount: null,
      transactionDate: "",
      serviceType: "standard"
    };

    expect(() => validateSalesData(invalidDataMultipleMissing)).toThrow(
      /顧客名/
    );
  });
});