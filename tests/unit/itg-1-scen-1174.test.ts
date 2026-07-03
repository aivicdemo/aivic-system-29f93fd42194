import { describe, test, expect } from "@jest/globals";
import { validateReportAccuracy } from "../../src/logic/it-1781935279444-2-1-1";

describe("営業データ入力時の品質検証ルール定義・実行機能", () => {
  test("SCEN-1174: レポート数値の正確性合否判定機能 - 不一致なレポート数値を誤りとして不合格判定できる", () => {
    // 基準値（システム内の正確な数値）
    const expectedApoCount = 15;
    const expectedContractCount = 8;
    const expectedCustomerResponseRate = 0.85;
    const expectedRevenue = 480000;

    // テストケース1: アポ数が不一致
    const reportData1 = {
      apoCount: 12, // 期待値15に対して3の差異
      contractCount: 8,
      customerResponseRate: 0.85,
      revenue: 480000,
      reportPeriod: "2024-01-01",
      customerId: "CUST-001",
      serviceType: "sales_support",
    };

    const result1 = validateReportAccuracy(reportData1, {
      apoCount: expectedApoCount,
      contractCount: expectedContractCount,
      customerResponseRate: expectedCustomerResponseRate,
      revenue: expectedRevenue,
    });

    expect(result1.isApproved).toBe(false);
    expect(result1.status).toBe("不合格");
    expect(result1.discrepancies).toHaveLength(1);
    expect(result1.discrepancies[0]).toEqual({
      field: "apoCount",
      expected: 15,
      actual: 12,
      difference: -3,
      differencePercentage: -20,
    });
    expect(result1.errorMessage).toMatch(/アポ数/);
    expect(result1.errorDetails).toContain("期待値: 15");
    expect(result1.errorDetails).toContain("実際値: 12");

    // テストケース2: 成約数が不一致
    const reportData2 = {
      apoCount: 15,
      contractCount: 10, // 期待値8に対して2の超過
      customerResponseRate: 0.85,
      revenue: 480000,
      reportPeriod: "2024-01-02",
      customerId: "CUST-002",
      serviceType: "sales_support",
    };

    const result2 = validateReportAccuracy(reportData2, {
      apoCount: expectedApoCount,
      contractCount: expectedContractCount,
      customerResponseRate: expectedCustomerResponseRate,
      revenue: expectedRevenue,
    });

    expect(result2.isApproved).toBe(false);
    expect(result2.status).toBe("不合格");
    expect(result2.discrepancies).toHaveLength(1);
    expect(result2.discrepancies[0]).toEqual({
      field: "contractCount",
      expected: 8,
      actual: 10,
      difference: 2,
      differencePercentage: 25,
    });
    expect(result2.errorMessage).toMatch(/成約数/);

    // テストケース3: 顧客反応率が不一致
    const reportData3 = {
      apoCount: 15,
      contractCount: 8,
      customerResponseRate: 0.72, // 期待値0.85に対して0.13の低下
      revenue: 480000,
      reportPeriod: "2024-01-03",
      customerId: "CUST-003",
      serviceType: "sales_support",
    };

    const result3 = validateReportAccuracy(reportData3, {
      apoCount: expectedApoCount,
      contractCount: expectedContractCount,
      customerResponseRate: expectedCustomerResponseRate,
      revenue: expectedRevenue,
    });

    expect(result3.isApproved).toBe(false);
    expect(result3.status).toBe("不合格");
    expect(result3.discrepancies).toHaveLength(1);
    expect(result3.discrepancies[0]).toEqual({
      field: "customerResponseRate",
      expected: 0.85,
      actual: 0.72,
      difference: -0.13,
      differencePercentage: -15.29,
    });
    expect(result3.errorMessage).toMatch(/顧客反応率/);

    // テストケース4: 売上が不一致
    const reportData4 = {
      apoCount: 15,
      contractCount: 8,
      customerResponseRate: 0.85,
      revenue: 520000, // 期待値480000に対して40000の超過
      reportPeriod: "2024-01-04",
      customerId: "CUST-004",
      serviceType: "sales_support",
    };

    const result4 = validateReportAccuracy(reportData4, {
      apoCount: expectedApoCount,
      contractCount: expectedContractCount,
      customerResponseRate: expectedCustomerResponseRate,
      revenue: expectedRevenue,
    });

    expect(result4.isApproved).toBe(false);
    expect(result4.status).toBe("不合格");
    expect(result4.discrepancies).toHaveLength(1);
    expect(result4.discrepancies[0]).toEqual({
      field: "revenue",
      expected: 480000,
      actual: 520000,
      difference: 40000,
      differencePercentage: 8.33,
    });
    expect(result4.errorMessage).toMatch(/売上/);

    // テストケース5: 複数項目が不一致
    const reportData5 = {
      apoCount: 10, // 不一致: -5
      contractCount: 6, // 不一致: -2
      customerResponseRate: 0.75, // 不一致: -0.10
      revenue: 450000, // 不一致: -30000
      reportPeriod: "2024-01-05",
      customerId: "CUST-005",
      serviceType: "sales_support",
    };

    const result5 = validateReportAccuracy(reportData5, {
      apoCount: expectedApoCount,
      contractCount: expectedContractCount,
      customerResponseRate: expectedCustomerResponseRate,
      revenue: expectedRevenue,
    });

    expect(result5.isApproved).toBe(false);
    expect(result5.status).toBe("不合格");
    expect(result5.discrepancies).toHaveLength(4);
    expect(result5.discrepancies[0]).toEqual({
      field: "apoCount",
      expected: 15,
      actual: 10,
      difference: -5,
      differencePercentage: -33.33,
    });
    expect(result5.discrepancies[1]).toEqual({
      field: "contractCount",
      expected: 8,
      actual: 6,
      difference: -2,
      differencePercentage: -25,
    });
    expect(result5.discrepancies[2]).toEqual({
      field: "customerResponseRate",
      expected: 0.85,
      actual: 0.75,
      difference: -0.1,
      differencePercentage: -11.76,
    });
    expect(result5.discrepancies[3]).toEqual({
      field: "revenue",
      expected: 480000,
      actual: 450000,
      difference: -30000,
      differencePercentage: -6.25,
    });
    expect(result5.errorDetails).toContain("複数項目の不一致");

    // テストケース6: 全項目が一致（合格ケース）
    const reportData6 = {
      apoCount: 15,
      contractCount: 8,
      customerResponseRate: 0.85,
      revenue: 480000,
      reportPeriod: "2024-01-06",
      customerId: "CUST-006",
      serviceType: "sales_support",
    };

    const result6 = validateReportAccuracy(reportData6, {
      apoCount: expectedApoCount,
      contractCount: expectedContractCount,
      customerResponseRate: expectedCustomerResponseRate,
      revenue: expectedRevenue,
    });

    expect(result6.isApproved).toBe(true);
    expect(result6.status).toBe("合格");
    expect(result6.discrepancies).toHaveLength(0);
    expect(result6.errorMessage).toBe("");

    // テストケース7: エラーログ記録の検証
    const reportData7 = {
      apoCount: 5,
      contractCount: 3,
      customerResponseRate: 0.5,
      revenue: 200000,
      reportPeriod: "2024-01-07",
      customerId: "CUST-007",
      serviceType: "sales_support",
    };

    const result7 = validateReportAccuracy(reportData7, {
      apoCount: expectedApoCount,
      contractCount: expectedContractCount,
      customerResponseRate: expectedCustomerResponseRate,
      revenue: expectedRevenue,
    });

    expect(result7.isApproved).toBe(false);
    expect(result7.status).toBe("不合格");
    expect(result7.auditLog).toBeDefined();
    expect(result7.auditLog.timestamp).toBeDefined();
    expect(result7.auditLog.customerId).toBe("CUST-007");
    expect(result7.auditLog.reportPeriod).toBe("2024-01-07");
    expect(result7.auditLog.validationResult).toBe("不合格");
    expect(result7.auditLog.discrepancyCount).toBe(4);
  });
});