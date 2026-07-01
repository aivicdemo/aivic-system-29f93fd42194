import { describe, test, expect, beforeEach } from "@jest/globals";
import { extractSalesDataFromQuery } from "../../src/logic/it-1781935279444-2-2-1";

describe("営業データの完全性・正確性を自動検証し、不足データ・誤りを検出・通知する機能", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("SCEN-1045: 質問内容から営業データが正確に特定され、対応する根拠データが完全かつ正確に抽出される", () => {
    // 入力: 顧客質問
    const query = {
      queryText: "2024年1月の商品Aの売上実績は？",
      targetPeriod: {
        startDate: "2024-01-01",
        endDate: "2024-01-31",
      },
      productName: "商品A",
      queryType: "sales_performance",
    };

    // モック営業データベース
    const mockSalesData = [
      {
        transactionId: "TXN-001",
        transactionDate: "2024-01-05",
        productName: "商品A",
        quantity: 10,
        unitPrice: 1000,
        totalAmount: 10000,
        salesPerson: "田中太郎",
        customerId: "CUST-001",
        customerName: "顧客企業A",
      },
      {
        transactionId: "TXN-002",
        transactionDate: "2024-01-12",
        productName: "商品A",
        quantity: 15,
        unitPrice: 1000,
        totalAmount: 15000,
        salesPerson: "鈴木花子",
        customerId: "CUST-002",
        customerName: "顧客企業B",
      },
      {
        transactionId: "TXN-003",
        transactionDate: "2024-01-20",
        productName: "商品A",
        quantity: 8,
        unitPrice: 1000,
        totalAmount: 8000,
        salesPerson: "佐藤次郎",
        customerId: "CUST-001",
        customerName: "顧客企業A",
      },
      {
        transactionId: "TXN-004",
        transactionDate: "2024-01-28",
        productName: "商品B",
        quantity: 5,
        unitPrice: 2000,
        totalAmount: 10000,
        salesPerson: "田中太郎",
        customerId: "CUST-003",
        customerName: "顧客企業C",
      },
    ];

    // システムが質問内容を解析し、対応する営業データを抽出
    const result = extractSalesDataFromQuery(query, mockSalesData);

    // 期待される抽出データ
    const expectedExtractedData = [
      {
        transactionId: "TXN-001",
        transactionDate: "2024-01-05",
        productName: "商品A",
        quantity: 10,
        unitPrice: 1000,
        totalAmount: 10000,
        salesPerson: "田中太郎",
        customerId: "CUST-001",
        customerName: "顧客企業A",
      },
      {
        transactionId: "TXN-002",
        transactionDate: "2024-01-12",
        productName: "商品A",
        quantity: 15,
        unitPrice: 1000,
        totalAmount: 15000,
        salesPerson: "鈴木花子",
        customerId: "CUST-002",
        customerName: "顧客企業B",
      },
      {
        transactionId: "TXN-003",
        transactionDate: "2024-01-20",
        productName: "商品A",
        quantity: 8,
        unitPrice: 1000,
        totalAmount: 8000,
        salesPerson: "佐藤次郎",
        customerId: "CUST-001",
        customerName: "顧客企業A",
      },
    ];

    // 抽出されたデータが正確に含まれていることを検証
    expect(result.extractedData).toEqual(expectedExtractedData);

    // 集計値の検証
    expect(result.totalQuantity).toBe(33);
    expect(result.totalAmount).toBe(33000);
    expect(result.transactionCount).toBe(3);

    // 説明資料の自動生成を検証
    expect(result.explanationDocument).toBeDefined();
    expect(result.explanationDocument.title).toBe(
      "2024年1月 商品A 売上実績レポート"
    );
    expect(result.explanationDocument.summary).toContain("合計金額: 33000円");
    expect(result.explanationDocument.summary).toContain("売上件数: 3件");

    // 根拠データと説明資料の内容が一致していることを検証
    const transactionDetails = result.explanationDocument.details;
    expect(transactionDetails).toHaveLength(3);
    expect(transactionDetails[0]).toEqual({
      date: "2024-01-05",
      product: "商品A",
      quantity: 10,
      amount: 10000,
      salesperson: "田中太郎",
      customer: "顧客企業A",
    });
    expect(transactionDetails[1]).toEqual({
      date: "2024-01-12",
      product: "商品A",
      quantity: 15,
      amount: 15000,
      salesperson: "鈴木花子",
      customer: "顧客企業B",
    });
    expect(transactionDetails[2]).toEqual({
      date: "2024-01-20",
      product: "商品A",
      quantity: 8,
      amount: 8000,
      salesperson: "佐藤次郎",
      customer: "顧客企業A",
    });

    // 説明資料がダウンロード可能な形式であることを検証
    expect(result.downloadFormat).toBe("pdf");
    expect(result.filename).toBe("2024年1月_商品A_売上実績レポート.pdf");

    // 抽出データにおいて必須項目が完全に含まれていることを検証
    result.extractedData.forEach((record: any) => {
      expect(record).toHaveProperty("transactionId");
      expect(record).toHaveProperty("transactionDate");
      expect(record).toHaveProperty("productName");
      expect(record).toHaveProperty("quantity");
      expect(record).toHaveProperty("unitPrice");
      expect(record).toHaveProperty("totalAmount");
      expect(record).toHaveProperty("salesPerson");
      expect(record).toHaveProperty("customerId");
      expect(record).toHaveProperty("customerName");
    });

    // 説明資料の構造が正確であることを検証
    expect(result.explanationDocument).toHaveProperty("title");
    expect(result.explanationDocument).toHaveProperty("summary");
    expect(result.explanationDocument).toHaveProperty("details");
    expect(result.explanationDocument).toHaveProperty("generatedAt");
    expect(typeof result.explanationDocument.generatedAt).toBe("string");

    // 質問への回答が根拠データに基づいて正確であることを検証
    expect(result.answer).toBe(
      "2024年1月の商品Aの売上実績は、全3件の取引で合計33,000円です。詳細は以下の通りです。"
    );

    // データの整合性確認：データベースに存在しないデータが抽出されていないこと
    const extractedTransactionIds = result.extractedData.map(
      (d: any) => d.transactionId
    );
    expect(extractedTransactionIds).not.toContain("TXN-004");

    // 日付範囲の検証：期間外のデータが含まれていないこと
    result.extractedData.forEach((record: any) => {
      const recordDate = new Date(record.transactionDate);
      const startDate = new Date(query.targetPeriod.startDate);
      const endDate = new Date(query.targetPeriod.endDate);
      expect(recordDate.getTime()).toBeGreaterThanOrEqual(startDate.getTime());
      expect(recordDate.getTime()).toBeLessThanOrEqual(endDate.getTime());
    });

    // 商品名フィルタの検証：指定された商品のみが抽出されていること
    result.extractedData.forEach((record: any) => {
      expect(record.productName).toBe("商品A");
    });
  });

  test("SCEN-1045-ERR: 不正な日付範囲を指定した場合、エラーを返す", () => {
    const invalidQuery = {
      queryText: "2024年1月の商品Aの売上実績は？",
      targetPeriod: {
        startDate: "2024-01-31",
        endDate: "2024-01-01",
      },
      productName: "商品A",
      queryType: "sales_performance",
    };

    const mockSalesData: any[] = [];

    expect(() =>
      extractSalesDataFromQuery(invalidQuery, mockSalesData)
    ).toThrow(/日付範囲/);
  });

  test("SCEN-1045-ERR: 質問テキストが空の場合、エラーを返す", () => {
    const emptyQuery = {
      queryText: "",
      targetPeriod: {
        startDate: "2024-01-01",
        endDate: "2024-01-31",
      },
      productName: "商品A",
      queryType: "sales_performance",
    };

    const mockSalesData: any[] = [];

    expect(() =>
      extractSalesDataFromQuery(emptyQuery, mockSalesData)
    ).toThrow(/質問内容/);
  });

  test("SCEN-1045-ERR: データベースが空の場合、抽出結果が空配列を返す", () => {
    const query = {
      queryText: "2024年1月の商品Aの売上実績は？",
      targetPeriod: {
        startDate: "2024-01-01",
        endDate: "2024-01-31",
      },
      productName: "商品A",
      queryType: "sales_performance",
    };

    const emptyDatabase: any[] = [];

    const result = extractSalesDataFromQuery(query, emptyDatabase);

    expect(result.extractedData).toEqual([]);
    expect(result.totalQuantity).toBe(0);
    expect(result.totalAmount).toBe(0);
    expect(result.transactionCount).toBe(0);
  });

  test("SCEN-1045-ERR: 一致するデータが存在しない場合、警告メッセージを含める", () => {
    const query = {
      queryText: "2024年1月の商品Zの売上実績は？",
      targetPeriod: {
        startDate: "2024-01-01",
        endDate: "2024-01-31",
      },
      productName: "商品Z",
      queryType: "sales_performance",
    };

    const mockSalesData = [
      {
        transactionId: "TXN-001",
        transactionDate: "2024-01-05",
        productName: "商品A",
        quantity: 10,
        unitPrice: 1000,
        totalAmount: 10000,
        salesPerson: "田中太郎",
        customerId: "CUST-001",
        customerName: "顧客企業A",
      },
    ];

    const result = extractSalesDataFromQuery(query, mockSalesData);

    expect(result.extractedData).toEqual([]);
    expect(result.warning).toContain("該当するデータ");
  });
});