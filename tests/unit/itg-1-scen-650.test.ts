import {
  validateSalesDataCompleteness,
} from "../../src/logic/it-1781935279444-2-2-1";

describe("営業データ品質検証 - 必須項目不足検出", () => {
  // SCEN-650: [normal] 営業データ異常値・漏れデータ自動検出機能 - 必須項目の不足データが正確に検出され、補正対象として通知される
  test("必須項目の不足データが正確に検出され、補正対象として通知される", () => {
    // 必須項目: customerName, amount, invoiceDate, partnerClassification
    const incompleteRecord = {
      recordId: "REC-001",
      customerName: "", // 欠落: 空文字列
      amount: 50000,
      invoiceDate: "2024-01-15",
      partnerClassification: "agency",
      salesRepresentative: "田中太郎",
      transactionDate: "2024-01-10",
    };

    const result = validateSalesDataCompleteness(incompleteRecord);

    // 検出結果の構造を検証
    expect(result).toEqual({
      recordId: "REC-001",
      isValid: false,
      status: "hold",
      missingFields: ["customerName"],
      detectionTimestamp: expect.any(String),
      notificationMessage:
        "補正対象: 欠落している必須項目: customerName。該当レコード(REC-001)は保留状態となり、手動補正が必要です。",
      shouldExcludeFromBilling: true,
    });

    // 個別検証
    expect(result.isValid).toBe(false);
    expect(result.status).toBe("hold");
    expect(result.missingFields).toContain("customerName");
    expect(result.missingFields.length).toBe(1);
    expect(result.shouldExcludeFromBilling).toBe(true);
    expect(result.notificationMessage).toMatch(/補正対象/);
    expect(result.notificationMessage).toMatch(/customerName/);
    expect(result.notificationMessage).toMatch(/REC-001/);
  });

  test("複数の必須項目が欠落している場合、すべて検出される", () => {
    const multipleIncompleteRecord = {
      recordId: "REC-002",
      customerName: "",
      amount: null,
      invoiceDate: "", // 欠落
      partnerClassification: "", // 欠落
      salesRepresentative: "鈴木次郎",
      transactionDate: "2024-01-10",
    };

    const result = validateSalesDataCompleteness(multipleIncompleteRecord);

    expect(result.isValid).toBe(false);
    expect(result.status).toBe("hold");
    expect(result.missingFields.length).toBe(4);
    expect(result.missingFields).toEqual(
      expect.arrayContaining([
        "customerName",
        "amount",
        "invoiceDate",
        "partnerClassification",
      ])
    );
    expect(result.shouldExcludeFromBilling).toBe(true);
    expect(result.notificationMessage).toMatch(/customerName/);
    expect(result.notificationMessage).toMatch(/amount/);
    expect(result.notificationMessage).toMatch(/invoiceDate/);
    expect(result.notificationMessage).toMatch(/partnerClassification/);
  });

  test("すべての必須項目が完全に入力されている場合、検証が合格する", () => {
    const completeRecord = {
      recordId: "REC-003",
      customerName: "テスト顧客株式会社",
      amount: 100000,
      invoiceDate: "2024-01-15",
      partnerClassification: "direct_client",
      salesRepresentative: "佐藤三郎",
      transactionDate: "2024-01-10",
    };

    const result = validateSalesDataCompleteness(completeRecord);

    expect(result.isValid).toBe(true);
    expect(result.status).toBe("approved");
    expect(result.missingFields).toEqual([]);
    expect(result.shouldExcludeFromBilling).toBe(false);
    expect(result.notificationMessage).toMatch(/合格/);
  });

  test("金額がゼロの場合、欠落として検出される", () => {
    const zeroAmountRecord = {
      recordId: "REC-004",
      customerName: "顧客A",
      amount: 0,
      invoiceDate: "2024-01-15",
      partnerClassification: "agency",
      salesRepresentative: "山田四郎",
      transactionDate: "2024-01-10",
    };

    const result = validateSalesDataCompleteness(zeroAmountRecord);

    expect(result.isValid).toBe(false);
    expect(result.missingFields).toContain("amount");
    expect(result.shouldExcludeFromBilling).toBe(true);
  });

  test("invoiceDateが無効な形式の場合、欠落として検出される", () => {
    const invalidDateRecord = {
      recordId: "REC-005",
      customerName: "顧客B",
      amount: 75000,
      invoiceDate: "invalid-date",
      partnerClassification: "agency",
      salesRepresentative: "田中五郎",
      transactionDate: "2024-01-10",
    };

    const result = validateSalesDataCompleteness(invalidDateRecord);

    expect(result.isValid).toBe(false);
    expect(result.missingFields).toContain("invoiceDate");
    expect(result.shouldExcludeFromBilling).toBe(true);
  });

  test("partnerClassificationが空の場合、欠落として検出される", () => {
    const missingClassificationRecord = {
      recordId: "REC-006",
      customerName: "顧客C",
      amount: 60000,
      invoiceDate: "2024-01-15",
      partnerClassification: "",
      salesRepresentative: "鈴木六郎",
      transactionDate: "2024-01-10",
    };

    const result = validateSalesDataCompleteness(missingClassificationRecord);

    expect(result.isValid).toBe(false);
    expect(result.missingFields).toContain("partnerClassification");
    expect(result.shouldExcludeFromBilling).toBe(true);
  });

  test("検出結果のタイムスタンプがISO形式で記録される", () => {
    const recordWithTimestamp = {
      recordId: "REC-007",
      customerName: "",
      amount: 45000,
      invoiceDate: "2024-01-15",
      partnerClassification: "direct_client",
      salesRepresentative: "佐藤七郎",
      transactionDate: "2024-01-10",
    };

    const result = validateSalesDataCompleteness(recordWithTimestamp);

    expect(result.detectionTimestamp).toMatch(
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/
    );
  });

  test("不足データの補正対象通知メッセージにレコードIDが含まれる", () => {
    const recordForNotification = {
      recordId: "REC-TEST-12345",
      customerName: "",
      amount: 30000,
      invoiceDate: "2024-01-15",
      partnerClassification: "agency",
      salesRepresentative: "山田八郎",
      transactionDate: "2024-01-10",
    };

    const result = validateSalesDataCompleteness(recordForNotification);

    expect(result.notificationMessage).toContain("REC-TEST-12345");
    expect(result.notificationMessage).toContain("補正対象");
  });

  test("複数不足項目の場合、すべての項目が補正対象通知メッセージに列挙される", () => {
    const multiMissingRecord = {
      recordId: "REC-009",
      customerName: "",
      amount: null,
      invoiceDate: "",
      partnerClassification: "direct_client",
      salesRepresentative: "鈴木九郎",
      transactionDate: "2024-01-10",
    };

    const result = validateSalesDataCompleteness(multiMissingRecord);

    const message = result.notificationMessage;
    expect(message).toMatch(/customerName/);
    expect(message).toMatch(/amount/);
    expect(message).toMatch(/invoiceDate/);
  });
});