import { describe, test, expect } from "@jest/globals";
import { validateReportAccuracy } from "../../src/logic/it-1-1-1";

describe("営業成果レポート内容妥当性判定機能", () => {
  test("SCEN-1013: レポート内の集計値が営業データと不一致の場合、エラーを返す", () => {
    // Arrange: 営業データベースの正規値
    const expectedSalesAmount = 1500000;
    const expectedContractCount = 12;
    const expectedAchievementRate = 85.5;

    // Act & Assert: 改ざんされたレポートデータを検証
    const tamperedReport = {
      reportId: "RPT-202401-001",
      customerId: "CUST-A001",
      period: "2024-01",
      salesAmount: 1200000, // 正規値 1500000 と不一致
      contractCount: 12,
      achievementRate: 85.5,
      generatedAt: "2024-01-31T09:00:00Z",
    };

    const sourceData = {
      customerId: "CUST-A001",
      period: "2024-01",
      salesAmount: expectedSalesAmount,
      contractCount: expectedContractCount,
      achievementRate: expectedAchievementRate,
    };

    // 不一致検出時にエラーを返す
    expect(() => validateReportAccuracy(tamperedReport, sourceData)).toThrow(
      /売上金額/
    );
  });

  test("SCEN-1013: 複数項目が不一致の場合、最初の不一致項目を検出して返す", () => {
    const tamperedReport = {
      reportId: "RPT-202401-002",
      customerId: "CUST-B001",
      period: "2024-01",
      salesAmount: 900000, // 不一致
      contractCount: 8, // 不一致
      achievementRate: 75.2, // 不一致
      generatedAt: "2024-01-31T10:30:00Z",
    };

    const sourceData = {
      customerId: "CUST-B001",
      period: "2024-01",
      salesAmount: 1250000,
      contractCount: 10,
      achievementRate: 82.5,
    };

    expect(() => validateReportAccuracy(tamperedReport, sourceData)).toThrow(
      /売上金額|件数|達成率/
    );
  });

  test("SCEN-1013: すべての集計値が営業データと一致する場合、成功ステータスを返す", () => {
    const validReport = {
      reportId: "RPT-202401-003",
      customerId: "CUST-C001",
      period: "2024-01",
      salesAmount: 1800000,
      contractCount: 15,
      achievementRate: 92.0,
      generatedAt: "2024-01-31T11:00:00Z",
    };

    const sourceData = {
      customerId: "CUST-C001",
      period: "2024-01",
      salesAmount: 1800000,
      contractCount: 15,
      achievementRate: 92.0,
    };

    const result = validateReportAccuracy(validReport, sourceData);

    expect(result).toEqual({
      isValid: true,
      statusCode: 200,
      message: "レポート内容の妥当性確認が完了しました。",
      validatedAt: expect.any(String),
    });
  });

  test("SCEN-1013: 達成率の小数点精度で不一致を検出する", () => {
    const tamperedReport = {
      reportId: "RPT-202401-004",
      customerId: "CUST-D001",
      period: "2024-01",
      salesAmount: 2100000,
      contractCount: 18,
      achievementRate: 88.3, // 正規値 88.5 と異なる
      generatedAt: "2024-01-31T12:15:00Z",
    };

    const sourceData = {
      customerId: "CUST-D001",
      period: "2024-01",
      salesAmount: 2100000,
      contractCount: 18,
      achievementRate: 88.5,
    };

    expect(() => validateReportAccuracy(tamperedReport, sourceData)).toThrow(
      /達成率/
    );
  });

  test("SCEN-1013: 不一致時に詳細情報を含むエラーメッセージを返す", () => {
    const tamperedReport = {
      reportId: "RPT-202401-005",
      customerId: "CUST-E001",
      period: "2024-01",
      salesAmount: 950000, // 不一致
      contractCount: 11,
      achievementRate: 80.0,
      generatedAt: "2024-01-31T13:45:00Z",
    };

    const sourceData = {
      customerId: "CUST-E001",
      period: "2024-01",
      salesAmount: 1100000,
      contractCount: 11,
      achievementRate: 80.0,
    };

    expect(() => validateReportAccuracy(tamperedReport, sourceData)).toThrow(
      /売上金額|期待値|1100000|950000/
    );
  });

  test("SCEN-1013: 境界値テスト - 売上金額がゼロの場合", () => {
    const tamperedReport = {
      reportId: "RPT-202401-006",
      customerId: "CUST-F001",
      period: "2024-01",
      salesAmount: 0,
      contractCount: 0,
      achievementRate: 0.0,
      generatedAt: "2024-01-31T14:00:00Z",
    };

    const sourceData = {
      customerId: "CUST-F001",
      period: "2024-01",
      salesAmount: 500000,
      contractCount: 5,
      achievementRate: 50.0,
    };

    expect(() => validateReportAccuracy(tamperedReport, sourceData)).toThrow(
      /売上金額/
    );
  });

  test("SCEN-1013: 境界値テスト - 達成率が100%を超える場合", () => {
    const tamperedReport = {
      reportId: "RPT-202401-007",
      customerId: "CUST-G001",
      period: "2024-01",
      salesAmount: 2500000,
      contractCount: 20,
      achievementRate: 110.5, // 100%を超える異常値
      generatedAt: "2024-01-31T15:30:00Z",
    };

    const sourceData = {
      customerId: "CUST-G001",
      period: "2024-01",
      salesAmount: 2500000,
      contractCount: 20,
      achievementRate: 95.0,
    };

    expect(() => validateReportAccuracy(tamperedReport, sourceData)).toThrow(
      /達成率/
    );
  });
});