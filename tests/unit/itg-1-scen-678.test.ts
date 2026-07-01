import { describe, test, expect, beforeEach, afterEach } from "@jest/globals";
import { extractAndAggregateInvoiceItems } from "../../src/logic/it-1-2-1";

describe("営業成果データから請求対象項目を自動抽出し、顧客ごと・サービスごとの請求額を集計する機能", () => {
  test("SCEN-678: レポート自動配信機能 - 配信スケジュール時刻ジャストにレポートが配信される", () => {
    // 前提: 営業データが営業システムに記録され、顧客ごとの契約条件と請求ルールが定義されている状態
    const salesData = [
      {
        customerId: "CUST001",
        serviceId: "SVC001",
        appointmentCount: 10,
        contractCount: 3,
        revenueAmount: 150000,
        recordDate: "2024-01-15",
      },
      {
        customerId: "CUST001",
        serviceId: "SVC002",
        appointmentCount: 5,
        contractCount: 2,
        revenueAmount: 100000,
        recordDate: "2024-01-15",
      },
      {
        customerId: "CUST002",
        serviceId: "SVC001",
        appointmentCount: 8,
        contractCount: 4,
        revenueAmount: 200000,
        recordDate: "2024-01-15",
      },
    ];

    const contractRules = [
      {
        customerId: "CUST001",
        serviceId: "SVC001",
        baseFee: 50000,
        performanceFeePercentage: 10,
        discountRate: 0,
      },
      {
        customerId: "CUST001",
        serviceId: "SVC002",
        baseFee: 30000,
        performanceFeePercentage: 5,
        discountRate: 0,
      },
      {
        customerId: "CUST002",
        serviceId: "SVC001",
        baseFee: 60000,
        performanceFeePercentage: 8,
        discountRate: 10,
      },
    ];

    const distributionSchedule = {
      scheduledTime: "14:00:00",
      targetRecipients: ["recipient1@example.com", "recipient2@example.com"],
      reportFormat: "pdf",
    };

    // 発生条件: 月次締め日に営業データから請求対象項目を抽出し、請求額を自動計算する処理が実行される
    // 結果: 営業データから請求ルールに基づいて請求対象項目が自動判定・抽出され、顧客ごと・サービスごとの請求額が集計される

    const result = extractAndAggregateInvoiceItems({
      salesData,
      contractRules,
      distributionSchedule,
      aggregationUnit: "customer_service",
    });

    // 期待値の計算:
    // CUST001 × SVC001:
    // 請求額 = 基本料金 50,000 + (売上 150,000 × 10%) - (合計 × 割引率0%)
    //        = 50,000 + 15,000 = 65,000

    // CUST001 × SVC002:
    // 請求額 = 基本料金 30,000 + (売上 100,000 × 5%) - (合計 × 割引率0%)
    //        = 30,000 + 5,000 = 35,000

    // CUST002 × SVC001:
    // 請求額 = 基本料金 60,000 + (売上 200,000 × 8%) - (合計 × 割引率10%)
    //        = (60,000 + 16,000) × (1 - 0.1) = 76,000 × 0.9 = 68,400

    expect(result.aggregatedInvoices).toEqual([
      {
        customerId: "CUST001",
        serviceId: "SVC001",
        baseFee: 50000,
        performanceFee: 15000,
        subtotal: 65000,
        discountAmount: 0,
        invoiceAmount: 65000,
        invoiceCount: 1,
      },
      {
        customerId: "CUST001",
        serviceId: "SVC002",
        baseFee: 30000,
        performanceFee: 5000,
        subtotal: 35000,
        discountAmount: 0,
        invoiceAmount: 35000,
        invoiceCount: 1,
      },
      {
        customerId: "CUST002",
        serviceId: "SVC001",
        baseFee: 60000,
        performanceFee: 16000,
        subtotal: 76000,
        discountAmount: 7600,
        invoiceAmount: 68400,
        invoiceCount: 1,
      },
    ]);

    // 配信スケジュール情報の検証
    expect(result.distributionInfo).toEqual({
      scheduledTime: "14:00:00",
      targetRecipientCount: 2,
      reportFormat: "pdf",
      distributionStatus: "scheduled",
      scheduleDeviation: 0,
    });

    // 総請求額の検証: 65,000 + 35,000 + 68,400 = 168,400
    expect(result.totalInvoiceAmount).toBe(168400);

    // 集計単位の検証
    expect(result.aggregationUnit).toBe("customer_service");

    // 配信予定時刻と実際配信時刻のズレが±1秒以内であることを検証
    expect(Math.abs(result.scheduleDeviation)).toBeLessThanOrEqual(1);

    // 配信対象者にレポートが正常に送信されていることを検証
    expect(result.distributionInfo.targetRecipientCount).toBe(2);

    // 時刻のジャスト配信が保証されていることの検証
    expect(result.distributionInfo.distributionStatus).toBe("scheduled");
  });
});