import { validateSalesData } from "../../src/logic/it-1781935279444-2-2-1";

describe("営業データの完全性・正確性を自動検証", () => {
  // SCEN-713
  test("必須項目の顧客名が空欄で検証NG判定となる", () => {
    const salesData = {
      customerName: "",
      transactionDate: "2024-01-15",
      amount: 100000,
      status: "completed",
    };

    expect(() => validateSalesData(salesData)).toThrow(/顧客名/);
  });
});