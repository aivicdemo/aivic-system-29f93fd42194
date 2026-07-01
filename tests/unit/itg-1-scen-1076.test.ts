import { generateInvoiceStandardProcedure } from "../../src/logic/it-1-2-1";

describe("営業成果データから請求対象項目を自動抽出し、顧客ごと・サービスごとの請求額を集計する機能", () => {
  // SCEN-1076
  test("必須項目が不足している場合に手順書生成がエラーとなる", () => {
    const inputWithMissingCustomerName = {
      customerName: "",
      invoiceAmount: 100000,
      invoiceDate: "2024-01-15",
      serviceType: "営業代行",
      billingCycle: "月次",
      paymentTerms: 30,
    };

    expect(() =>
      generateInvoiceStandardProcedure(inputWithMissingCustomerName)
    ).toThrow(/顧客名/);
  });

  test("請求金額が不足している場合に手順書生成がエラーとなる", () => {
    const inputWithMissingInvoiceAmount = {
      customerName: "テスト顧客A",
      invoiceAmount: 0,
      invoiceDate: "2024-01-15",
      serviceType: "営業代行",
      billingCycle: "月次",
      paymentTerms: 30,
    };

    expect(() =>
      generateInvoiceStandardProcedure(inputWithMissingInvoiceAmount)
    ).toThrow(/請求金額/);
  });

  test("請求日が不足している場合に手順書生成がエラーとなる", () => {
    const inputWithMissingInvoiceDate = {
      customerName: "テスト顧客A",
      invoiceAmount: 100000,
      invoiceDate: "",
      serviceType: "営業代行",
      billingCycle: "月次",
      paymentTerms: 30,
    };

    expect(() =>
      generateInvoiceStandardProcedure(inputWithMissingInvoiceDate)
    ).toThrow(/請求日/);
  });

  test("サービス種別が不足している場合に手順書生成がエラーとなる", () => {
    const inputWithMissingServiceType = {
      customerName: "テスト顧客A",
      invoiceAmount: 100000,
      invoiceDate: "2024-01-15",
      serviceType: "",
      billingCycle: "月次",
      paymentTerms: 30,
    };

    expect(() =>
      generateInvoiceStandardProcedure(inputWithMissingServiceType)
    ).toThrow(/サービス/);
  });

  test("すべての必須項目が揃っている場合に手順書が正常に生成される", () => {
    const validInput = {
      customerName: "テスト顧客A",
      invoiceAmount: 100000,
      invoiceDate: "2024-01-15",
      serviceType: "営業代行",
      billingCycle: "月次",
      paymentTerms: 30,
    };

    const result = generateInvoiceStandardProcedure(validInput);

    expect(result).toHaveProperty("procedureId");
    expect(result).toHaveProperty("generatedAt");
    expect(result).toHaveProperty("checklist");
    expect(result.checklist).toBeInstanceOf(Array);
    expect(result.checklist.length).toBeGreaterThan(0);
    expect(result).toHaveProperty("template");
    expect(result.template).toHaveProperty("customerName", "テスト顧客A");
    expect(result.template).toHaveProperty("invoiceAmount", 100000);
    expect(result.template).toHaveProperty("invoiceDate", "2024-01-15");
    expect(result.template).toHaveProperty("serviceType", "営業代行");
  });

  test("請求金額が負数の場合にエラーとなる", () => {
    const inputWithNegativeAmount = {
      customerName: "テスト顧客A",
      invoiceAmount: -50000,
      invoiceDate: "2024-01-15",
      serviceType: "営業代行",
      billingCycle: "月次",
      paymentTerms: 30,
    };

    expect(() =>
      generateInvoiceStandardProcedure(inputWithNegativeAmount)
    ).toThrow(/請求金額/);
  });

  test("請求日の形式が不正な場合にエラーとなる", () => {
    const inputWithInvalidDateFormat = {
      customerName: "テスト顧客A",
      invoiceAmount: 100000,
      invoiceDate: "2024/01/15",
      serviceType: "営業代行",
      billingCycle: "月次",
      paymentTerms: 30,
    };

    expect(() =>
      generateInvoiceStandardProcedure(inputWithInvalidDateFormat)
    ).toThrow(/日付形式/);
  });

  test("支払い条件が不正な場合にエラーとなる", () => {
    const inputWithInvalidPaymentTerms = {
      customerName: "テスト顧客A",
      invoiceAmount: 100000,
      invoiceDate: "2024-01-15",
      serviceType: "営業代行",
      billingCycle: "月次",
      paymentTerms: -10,
    };

    expect(() =>
      generateInvoiceStandardProcedure(inputWithInvalidPaymentTerms)
    ).toThrow(/支払い条件/);
  });

  test("複数の必須項目が不足している場合に最初の不足項目がエラー報告される", () => {
    const inputWithMultipleMissingFields = {
      customerName: "",
      invoiceAmount: 0,
      invoiceDate: "",
      serviceType: "",
      billingCycle: "月次",
      paymentTerms: 30,
    };

    expect(() =>
      generateInvoiceStandardProcedure(inputWithMultipleMissingFields)
    ).toThrow(/顧客名/);
  });

  test("生成された手順書に標準チェックリスト項目が含まれている", () => {
    const validInput = {
      customerName: "テスト顧客B",
      invoiceAmount: 250000,
      invoiceDate: "2024-02-20",
      serviceType: "提案資料管理",
      billingCycle: "月次",
      paymentTerms: 45,
    };

    const result = generateInvoiceStandardProcedure(validInput);

    expect(result.checklist).toContainEqual(
      expect.objectContaining({
        item: expect.any(String),
        required: expect.any(Boolean),
      })
    );
    expect(
      result.checklist.some(
        (item: { item: string }) =>
          item.item.includes("顧客") || item.item.includes("確認")
      )
    ).toBe(true);
  });

  test("生成された手順書に判定基準が含まれている", () => {
    const validInput = {
      customerName: "テスト顧客C",
      invoiceAmount: 500000,
      invoiceDate: "2024-03-10",
      serviceType: "契約管理",
      billingCycle: "月次",
      paymentTerms: 60,
    };

    const result = generateInvoiceStandardProcedure(validInput);

    expect(result.template).toHaveProperty("judgmentCriteria");
    expect(typeof result.template.judgmentCriteria).toBe("string");
    expect(result.template.judgmentCriteria.length).toBeGreaterThan(0);
  });
});