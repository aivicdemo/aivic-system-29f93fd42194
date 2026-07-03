import { describe, test, expect, beforeEach } from "@jest/globals";
import {
  validateSalesDataCompleteness,
  SalesDataRecord,
  ValidationResult,
} from "../../src/logic/it-1781935279444-2-2-1";

describe("営業データの完全性・正確性検証", () => {
  // SCEN-642
  test("月次営業データの完全性・正確性検証機能 - 全営業データが必須項目・データ型・値の範囲について正確に検証される", () => {
    // テスト用の月次営業データサンプルを準備する（複数レコード含む）
    const testSalesData: SalesDataRecord[] = [
      {
        salesId: "SALES001",
        salesAmount: 150000,
        transactionDate: "2024-01-15",
        customerId: "CUST001",
        serviceType: "serviceA",
      },
      {
        salesId: "SALES002",
        salesAmount: 250000,
        transactionDate: "2024-01-20",
        customerId: "CUST002",
        serviceType: "serviceB",
      },
      {
        salesId: "SALES003",
        salesAmount: 100000,
        transactionDate: "2024-01-10",
        customerId: "CUST003",
        serviceType: "serviceA",
      },
    ];

    // 既知の顧客マスタ
    const knownCustomerIds = ["CUST001", "CUST002", "CUST003"];

    // システム運用期間
    const systemStartDate = new Date("2024-01-01");
    const systemEndDate = new Date("2024-12-31");

    // 各営業データレコードに対して必須項目の存在確認を実行する
    // 各必須項目のデータ型が正確に検証されることを確認する
    // 売上金額が正の数値範囲内であることを検証する
    // 取引日が有効な日付形式かつシステム運用期間内であることを検証する
    // 顧客IDが既知の顧客マスタと一致することを検証する
    const result: ValidationResult = validateSalesDataCompleteness(
      testSalesData,
      knownCustomerIds,
      systemStartDate,
      systemEndDate
    );

    // 全営業データレコードに対して上記の検証が完全に実行されたことを確認する
    expect(result.totalRecords).toBe(3);

    // すべての検証ルールが適用され、正常なデータは承認される
    expect(result.validRecords).toBe(3);
    expect(result.invalidRecords).toBe(0);

    // 検証結果には詳細なレポートが生成され、問題のあるレコードと正常なレコード数が正確に記録される
    expect(result.errors).toEqual([]);
    expect(result.successDetails).toHaveLength(3);

    // 正常なレコード詳細を確認
    expect(result.successDetails[0]).toEqual({
      salesId: "SALES001",
      salesAmount: 150000,
      transactionDate: "2024-01-15",
      customerId: "CUST001",
      serviceType: "serviceA",
      validationStatus: "PASSED",
    });

    expect(result.successDetails[1]).toEqual({
      salesId: "SALES002",
      salesAmount: 250000,
      transactionDate: "2024-01-20",
      customerId: "CUST002",
      serviceType: "serviceB",
      validationStatus: "PASSED",
    });

    expect(result.successDetails[2]).toEqual({
      salesId: "SALES003",
      salesAmount: 100000,
      transactionDate: "2024-01-10",
      customerId: "CUST003",
      serviceType: "serviceA",
      validationStatus: "PASSED",
    });
  });

  test("月次営業データの完全性・正確性検証機能 - 必須項目の欠落を検出する", () => {
    // 必須項目が欠落したデータ
    const testSalesDataWithMissing: Partial<SalesDataRecord>[] = [
      {
        salesId: "SALES001",
        salesAmount: 150000,
        transactionDate: "2024-01-15",
        customerId: "CUST001",
        // serviceTypeが欠落
      } as SalesDataRecord,
    ];

    const knownCustomerIds = ["CUST001"];
    const systemStartDate = new Date("2024-01-01");
    const systemEndDate = new Date("2024-12-31");

    const result: ValidationResult = validateSalesDataCompleteness(
      testSalesDataWithMissing as SalesDataRecord[],
      knownCustomerIds,
      systemStartDate,
      systemEndDate
    );

    // 不正データが検出される
    expect(result.validRecords).toBe(0);
    expect(result.invalidRecords).toBe(1);
    expect(result.errors.length).toBeGreaterThan(0);
    expect(result.errors[0]).toMatch(/serviceType/);
  });

  test("月次営業データの完全性・正確性検証機能 - データ型の不整合を検出する", () => {
    // データ型が不正なデータ
    const testSalesDataWithWrongType: any[] = [
      {
        salesId: "SALES001",
        salesAmount: "invalid_number", // 数値ではなく文字列
        transactionDate: "2024-01-15",
        customerId: "CUST001",
        serviceType: "serviceA",
      },
    ];

    const knownCustomerIds = ["CUST001"];
    const systemStartDate = new Date("2024-01-01");
    const systemEndDate = new Date("2024-12-31");

    const result: ValidationResult = validateSalesDataCompleteness(
      testSalesDataWithWrongType,
      knownCustomerIds,
      systemStartDate,
      systemEndDate
    );

    // データ型の不整合が検出される
    expect(result.validRecords).toBe(0);
    expect(result.invalidRecords).toBe(1);
    expect(result.errors.length).toBeGreaterThan(0);
    expect(result.errors[0]).toMatch(/salesAmount|データ型/);
  });

  test("月次営業データの完全性・正確性検証機能 - 売上金額の範囲外を検出する", () => {
    // 売上金額が負数のデータ
    const testSalesDataWithNegativeAmount: SalesDataRecord[] = [
      {
        salesId: "SALES001",
        salesAmount: -50000, // 負数は許容範囲外
        transactionDate: "2024-01-15",
        customerId: "CUST001",
        serviceType: "serviceA",
      },
    ];

    const knownCustomerIds = ["CUST001"];
    const systemStartDate = new Date("2024-01-01");
    const systemEndDate = new Date("2024-12-31");

    const result: ValidationResult = validateSalesDataCompleteness(
      testSalesDataWithNegativeAmount,
      knownCustomerIds,
      systemStartDate,
      systemEndDate
    );

    // 範囲外のデータが検出される
    expect(result.validRecords).toBe(0);
    expect(result.invalidRecords).toBe(1);
    expect(result.errors.length).toBeGreaterThan(0);
    expect(result.errors[0]).toMatch(/salesAmount|範囲/);
  });

  test("月次営業データの完全性・正確性検証機能 - 無効な日付形式を検出する", () => {
    // 無効な日付形式のデータ
    const testSalesDataWithInvalidDate: SalesDataRecord[] = [
      {
        salesId: "SALES001",
        salesAmount: 150000,
        transactionDate: "2024-13-45", // 無効な日付
        customerId: "CUST001",
        serviceType: "serviceA",
      },
    ];

    const knownCustomerIds = ["CUST001"];
    const systemStartDate = new Date("2024-01-01");
    const systemEndDate = new Date("2024-12-31");

    const result: ValidationResult = validateSalesDataCompleteness(
      testSalesDataWithInvalidDate,
      knownCustomerIds,
      systemStartDate,
      systemEndDate
    );

    // 無効な日付が検出される
    expect(result.validRecords).toBe(0);
    expect(result.invalidRecords).toBe(1);
    expect(result.errors.length).toBeGreaterThan(0);
    expect(result.errors[0]).toMatch(/transactionDate|日付/);
  });

  test("月次営業データの完全性・正確性検証機能 - システム運用期間外の日付を検出する", () => {
    // システム運用期間外の日付
    const testSalesDataOutOfRange: SalesDataRecord[] = [
      {
        salesId: "SALES001",
        salesAmount: 150000,
        transactionDate: "2023-12-31", // システム開始日より前
        customerId: "CUST001",
        serviceType: "serviceA",
      },
    ];

    const knownCustomerIds = ["CUST001"];
    const systemStartDate = new Date("2024-01-01");
    const systemEndDate = new Date("2024-12-31");

    const result: ValidationResult = validateSalesDataCompleteness(
      testSalesDataOutOfRange,
      knownCustomerIds,
      systemStartDate,
      systemEndDate
    );

    // 運用期間外の日付が検出される
    expect(result.validRecords).toBe(0);
    expect(result.invalidRecords).toBe(1);
    expect(result.errors.length).toBeGreaterThan(0);
    expect(result.errors[0]).toMatch(/transactionDate|期間/);
  });

  test("月次営業データの完全性・正確性検証機能 - 顧客IDの不正を検出する", () => {
    // 顧客マスタに存在しない顧客ID
    const testSalesDataWithUnknownCustomer: SalesDataRecord[] = [
      {
        salesId: "SALES001",
        salesAmount: 150000,
        transactionDate: "2024-01-15",
        customerId: "CUST999", // 存在しない顧客ID
        serviceType: "serviceA",
      },
    ];

    const knownCustomerIds = ["CUST001", "CUST002"];
    const systemStartDate = new Date("2024-01-01");
    const systemEndDate = new Date("2024-12-31");

    const result: ValidationResult = validateSalesDataCompleteness(
      testSalesDataWithUnknownCustomer,
      knownCustomerIds,
      systemStartDate,
      systemEndDate
    );

    // 不正な顧客IDが検出される
    expect(result.validRecords).toBe(0);
    expect(result.invalidRecords).toBe(1);
    expect(result.errors.length).toBeGreaterThan(0);
    expect(result.errors[0]).toMatch(/customerId|顧客/);
  });

  test("月次営業データの完全性・正確性検証機能 - 複数の誤りを同時に検出する", () => {
    // 複数の誤りを含むデータセット
    const testSalesDataWithMultipleErrors: SalesDataRecord[] = [
      {
        salesId: "SALES001",
        salesAmount: 150000,
        transactionDate: "2024-01-15",
        customerId: "CUST001",
        serviceType: "serviceA",
      },
      {
        salesId: "SALES002",
        salesAmount: -50000, // 負数
        transactionDate: "2024-01-20",
        customerId: "CUST999", // 存在しない
        serviceType: "serviceB",
      },
      {
        salesId: "SALES003",
        salesAmount: 100000,
        transactionDate: "2023-12-31", // 期間外
        customerId: "CUST003",
        serviceType: "serviceA",
      },
    ];

    const knownCustomerIds = ["CUST001", "CUST003"];
    const systemStartDate = new Date("2024-01-01");
    const systemEndDate = new Date("2024-12-31");

    const result: ValidationResult = validateSalesDataCompleteness(
      testSalesDataWithMultipleErrors,
      knownCustomerIds,
      systemStartDate,
      systemEndDate
    );

    // 複数のエラーが検出される
    expect(result.totalRecords).toBe(3);
    expect(result.validRecords).toBe(1);
    expect(result.invalidRecords).toBe(2);
    expect(result.errors.length).toBeGreaterThanOrEqual(2);

    // 正常なレコードは1件のみ
    expect(result.successDetails).toHaveLength(1);
    expect(result.successDetails[0].salesId).toBe("SALES001");
  });

  test("月次営業データの完全性・正確性検証機能 - 検証ログが正確に記録される", () => {
    const testSalesData: SalesDataRecord[] = [
      {
        salesId: "SALES001",
        salesAmount: 150000,
        transactionDate: "2024-01-15",
        customerId: "CUST001",
        serviceType: "serviceA",
      },
      {
        salesId: "SALES002",
        salesAmount: 200000,
        transactionDate: "2024-01-20",
        customerId: "CUST002",
        serviceType: "serviceB",
      },
    ];

    const knownCustomerIds = ["CUST001", "CUST002"];
    const systemStartDate = new Date("2024-01-01");
    const systemEndDate = new Date("2024-12-31");

    const result: ValidationResult = validateSalesDataCompleteness(
      testSalesData,
      knownCustomerIds,
      systemStartDate,
      systemEndDate
    );

    // 検証ログが記録される
    expect(result.validationLog).toBeDefined();
    expect(result.validationLog).toContain("検証開始");
    expect(result.validationLog).toContain("検証完了");
    expect(result.validationLog).toContain("総件数: 2");
    expect(result.validationLog).toContain("正常件数: 2");
    expect(result.validationLog).toContain("エラー件数: 0");
  });
});