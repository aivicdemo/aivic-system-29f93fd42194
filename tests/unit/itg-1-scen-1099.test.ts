import { describe, test, expect, beforeEach, afterEach } from "@jest/globals";
import {
  validateSalesReportAggregation,
  ValidationError,
} from "../../src/logic/it-1781935279444-2-2-1";

describe("営業報告書集計検証 - 必須項目欠落時のエラー検出", () => {
  let mockNotificationSent: boolean;
  let mockErrorLog: Array<{
    testId: string;
    missingField: string;
    timestamp: string;
  }>;

  beforeEach(() => {
    mockNotificationSent = false;
    mockErrorLog = [];
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // SCEN-1099
  test("必須項目の1つが欠落している場合、不足データエラーとして検出・通知されること", () => {
    // Arrange: 営業報告書データを準備（必須項目: 顧客名、金額、報告日時、営業担当者）
    const validSalesReport = {
      customerId: "C001",
      customerName: "テスト顧客A",
      amount: 50000,
      reportedAt: "2024-01-15T10:30:00Z",
      salesPersonId: "S001",
      salesPersonName: "営業太郎",
      serviceType: "コンサル",
      contractId: "CT001",
    };

    // 必須項目（顧客名）を意図的に削除したデータセット
    const missingCustomerNameReport = {
      customerId: "C001",
      // customerName 欠落
      amount: 50000,
      reportedAt: "2024-01-15T10:30:00Z",
      salesPersonId: "S001",
      salesPersonName: "営業太郎",
      serviceType: "コンサル",
      contractId: "CT001",
    };

    // 必須項目（金額）を意図的に削除したデータセット
    const missingAmountReport = {
      customerId: "C001",
      customerName: "テスト顧客A",
      // amount 欠落
      reportedAt: "2024-01-15T10:30:00Z",
      salesPersonId: "S001",
      salesPersonName: "営業太郎",
      serviceType: "コンサル",
      contractId: "CT001",
    };

    // 必須項目（報告日時）を意図的に削除したデータセット
    const missingReportedAtReport = {
      customerId: "C001",
      customerName: "テスト顧客A",
      amount: 50000,
      // reportedAt 欠落
      salesPersonId: "S001",
      salesPersonName: "営業太郎",
      serviceType: "コンサル",
      contractId: "CT001",
    };

    // 必須項目（営業担当者ID）を意図的に削除したデータセット
    const missingSalesPersonIdReport = {
      customerId: "C001",
      customerName: "テスト顧客A",
      amount: 50000,
      reportedAt: "2024-01-15T10:30:00Z",
      // salesPersonId 欠落
      salesPersonName: "営業太郎",
      serviceType: "コンサル",
      contractId: "CT001",
    };

    // Act & Assert: 顧客名欠落時のエラー検出
    expect(() => {
      validateSalesReportAggregation(missingCustomerNameReport as any);
    }).toThrow(/顧客名/);

    // Act & Assert: 金額欠落時のエラー検出
    expect(() => {
      validateSalesReportAggregation(missingAmountReport as any);
    }).toThrow(/金額/);

    // Act & Assert: 報告日時欠落時のエラー検出
    expect(() => {
      validateSalesReportAggregation(missingReportedAtReport as any);
    }).toThrow(/報告日時/);

    // Act & Assert: 営業担当者ID欠落時のエラー検出
    expect(() => {
      validateSalesReportAggregation(missingSalesPersonIdReport as any);
    }).toThrow(/営業担当者/);

    // Act & Assert: 有効なデータでは成功することを確認
    const result = validateSalesReportAggregation(validSalesReport as any);
    expect(result).toEqual(
      expect.objectContaining({
        isValid: true,
        errors: [],
        testId: "SCEN-1099",
      })
    );
  });

  // SCEN-1099: エラーハンドリング処理とエラーメッセージ生成の検証
  test("不足データエラーメッセージが正しく生成され、エラーハンドリング処理が発動されること", () => {
    // Arrange
    const reportWithMissingField = {
      customerId: "C001",
      // customerName 欠落
      amount: 50000,
      reportedAt: "2024-01-15T10:30:00Z",
      salesPersonId: "S001",
      salesPersonName: "営業太郎",
      serviceType: "コンサル",
      contractId: "CT001",
    };

    // Act & Assert: エラーハンドリング処理が発動して適切なエラーメッセージを返す
    try {
      validateSalesReportAggregation(reportWithMissingField as any);
      fail("エラーが発生するはずです");
    } catch (error) {
      expect(error).toBeInstanceOf(ValidationError);
      if (error instanceof ValidationError) {
        expect(error.message).toMatch(/顧客名/);
        expect(error.missingFields).toContain("customerName");
        expect(error.testId).toBe("SCEN-1099");
      }
    }
  });

  // SCEN-1099: エラーログへの記録検証
  test("エラーログにテストID「SCEN-1099」と欠落項目情報が正しく記録されること", () => {
    // Arrange
    const reportWithMissingFields = {
      customerId: "C001",
      // customerName 欠落
      amount: 50000,
      // reportedAt 欠落
      salesPersonId: "S001",
      salesPersonName: "営業太郎",
      serviceType: "コンサル",
      contractId: "CT001",
    };

    // Act & Assert
    try {
      validateSalesReportAggregation(reportWithMissingFields as any);
      fail("エラーが発生するはずです");
    } catch (error) {
      expect(error).toBeInstanceOf(ValidationError);
      if (error instanceof ValidationError) {
        expect(error.testId).toBe("SCEN-1099");
        expect(error.missingFields).toEqual(
          expect.arrayContaining(["customerName", "reportedAt"])
        );
        expect(error.missingFields.length).toBe(2);
      }
    }
  });

  // SCEN-1099: エラー検出の複合検証
  test("複数の必須項目が欠落している場合、すべての欠落項目が検出されること", () => {
    // Arrange
    const reportWithMultipleMissingFields = {
      customerId: "C001",
      // customerName 欠落
      // amount 欠落
      reportedAt: "2024-01-15T10:30:00Z",
      salesPersonId: "S001",
      // salesPersonName 欠落
      serviceType: "コンサル",
      contractId: "CT001",
    };

    // Act & Assert: 複数の欠落項目をすべて検出
    try {
      validateSalesReportAggregation(reportWithMultipleMissingFields as any);
      fail("エラーが発生するはずです");
    } catch (error) {
      expect(error).toBeInstanceOf(ValidationError);
      if (error instanceof ValidationError) {
        expect(error.missingFields).toEqual(
          expect.arrayContaining([
            "customerName",
            "amount",
            "salesPersonName",
          ])
        );
        expect(error.missingFields.length).toBe(3);
        expect(error.testId).toBe("SCEN-1099");
      }
    }
  });
});