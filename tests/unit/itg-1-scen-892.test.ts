import { describe, test, expect } from "@jest/globals";
import {
  validateAggregatedBillingAmount,
} from "../../src/logic/it-1-2-1";

describe("営業成果データから請求対象項目を自動抽出し、顧客ごと・サービスごとの請求額を集計する機能", () => {
  test("SCEN-892: 請求額計算結果検証機能 - 集計済み請求額が複数の観点から検証され妥当性が確認される", () => {
    // テストデータ準備: 複数の営業案件から生成された請求データ
    const billingRecords = [
      {
        customerId: "CUST001",
        serviceId: "SRV001",
        quantity: 5,
        unitPrice: 10000,
        subtotal: 50000,
        taxRate: 0.1,
        taxAmount: 5000,
        discountRate: 0.0,
        discountAmount: 0,
        groupId: "GRP001",
        currency: "JPY",
      },
      {
        customerId: "CUST001",
        serviceId: "SRV002",
        quantity: 3,
        unitPrice: 20000,
        subtotal: 60000,
        taxRate: 0.1,
        taxAmount: 6000,
        discountRate: 0.1,
        discountAmount: 6600,
        groupId: "GRP001",
        currency: "JPY",
      },
      {
        customerId: "CUST002",
        serviceId: "SRV001",
        quantity: 2,
        unitPrice: 10000,
        subtotal: 20000,
        taxRate: 0.1,
        taxAmount: 2000,
        discountRate: 0.0,
        discountAmount: 0,
        groupId: "GRP002",
        currency: "JPY",
      },
    ];

    // 請求額計算機能を実行し、集計済み請求額を取得
    const result = validateAggregatedBillingAmount({
      billingRecords,
      aggregatedAmountByCustomerService: {
        "CUST001_SRV001": 55000,
        "CUST001_SRV002": 59400,
        "CUST002_SRV001": 22000,
      },
      aggregatedAmountByGroup: {
        GRP001: 114400,
        GRP002: 22000,
      },
      totalBillingAmount: 136400,
      auditLogId: "AUDIT001",
      auditLogTimestamp: "2024-01-15T11:00:00Z",
    });

    // 数値型であり、負の値でないことを検証
    expect(result.totalBillingAmount).toBe(136400);
    expect(typeof result.totalBillingAmount).toBe("number");
    expect(result.totalBillingAmount).toBeGreaterThanOrEqual(0);

    // 計算根拠となる明細項目の合計が集計済み請求額と一致することを検証
    const expectedLineItemSum = billingRecords.reduce((sum, record) => {
      const afterDiscount = record.subtotal - record.discountAmount;
      const withTax = afterDiscount + record.taxAmount;
      return sum + withTax;
    }, 0);
    expect(expectedLineItemSum).toBe(136400);
    expect(result.lineItemSumValid).toBe(true);

    // 消費税を含む計算パターンについて、税率が正しく適用されていることを検証
    const firstRecordTax = 50000 * 0.1;
    expect(firstRecordTax).toBe(5000);
    const secondRecordTax = 60000 * 0.1;
    expect(secondRecordTax).toBe(6000);
    const thirdRecordTax = 20000 * 0.1;
    expect(thirdRecordTax).toBe(2000);
    expect(result.taxCalculationValid).toBe(true);

    // 割引が適用されている場合、割引前後の金額差分が正確であることを検証
    const secondRecordBeforeDiscount = 60000 + 6000;
    const secondRecordAfterDiscount = 60000 + 6000 - 6600;
    const discountDifference = secondRecordBeforeDiscount - secondRecordAfterDiscount;
    expect(discountDifference).toBe(6600);
    expect(result.discountCalculationValid).toBe(true);

    // 複数の請求グループが存在する場合、各グループ別の集計額が正確であることを検証
    const group1Expected = 55000 + 59400;
    const group2Expected = 22000;
    expect(result.aggregatedAmountByGroup["GRP001"]).toBe(114400);
    expect(result.aggregatedAmountByGroup["GRP002"]).toBe(22000);
    expect(result.groupAggregationValid).toBe(true);

    // 顧客ごと・サービスごとの集計額が正確であることを検証
    expect(result.aggregatedAmountByCustomerService["CUST001_SRV001"]).toBe(55000);
    expect(result.aggregatedAmountByCustomerService["CUST001_SRV002"]).toBe(59400);
    expect(result.aggregatedAmountByCustomerService["CUST002_SRV001"]).toBe(22000);
    expect(result.customerServiceAggregationValid).toBe(true);

    // 通貨単位が正しく設定され、金額表示形式が統一されていることを検証
    const allRecordsCurrency = billingRecords.every((r) => r.currency === "JPY");
    expect(allRecordsCurrency).toBe(true);
    expect(result.currencyValid).toBe(true);
    expect(result.totalBillingAmount).toEqual(136400);

    // 丸め処理が発生している場合、丸め方式が仕様に準拠していることを検証
    expect(result.roundingMethodValid).toBe(true);
    expect(result.roundingMethod).toBe("floor");

    // 集計済み請求額が監査ログに正確に記録されていることを検証
    expect(result.auditLogId).toBe("AUDIT001");
    expect(result.auditLogTimestamp).toBe("2024-01-15T11:00:00Z");
    expect(result.auditLogValid).toBe(true);

    // すべての検証項目が合格したか確認
    expect(result.isValid).toBe(true);
    expect(result.validationPassed).toEqual({
      lineItemSumValid: true,
      taxCalculationValid: true,
      discountCalculationValid: true,
      groupAggregationValid: true,
      customerServiceAggregationValid: true,
      currencyValid: true,
      roundingMethodValid: true,
      auditLogValid: true,
    });
  });
});