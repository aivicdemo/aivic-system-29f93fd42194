import { describe, test, expect } from "@jest/globals";
import {
  extractBillingItemsByService,
  type ExtractBillingItemsInput,
  type ServiceBillingAmount,
} from "../../src/logic/it-1-2-1";

describe("営業成果データから請求対象項目の自動抽出と顧客別・サービス別集計", () => {
  // SCEN-1010: [normal] 営業データから請求対象項目の自動抽出・集計 - 複数サービスを提供する顧客の場合、サービス別請求額が正確に分離・集計される
  test("複数サービス顧客について、各サービスが正確に分離・集計され、サービス別明細が正確に表示される", () => {
    const input: ExtractBillingItemsInput = {
      customerId: "CUST-20240115-001",
      contractId: "CONT-20240101-A",
      invoicePeriod: {
        startDate: "2024-01-01",
        endDate: "2024-01-31",
      },
      salesData: [
        {
          serviceId: "SVC-A",
          serviceName: "サービスA",
          saleAmount: 100000,
          quantity: 1,
          unitPrice: 100000,
          transactionDate: "2024-01-15",
        },
        {
          serviceId: "SVC-B",
          serviceName: "サービスB",
          saleAmount: 50000,
          quantity: 1,
          unitPrice: 50000,
          transactionDate: "2024-01-20",
        },
        {
          serviceId: "SVC-C",
          serviceName: "サービスC",
          saleAmount: 75000,
          quantity: 1,
          unitPrice: 75000,
          transactionDate: "2024-01-25",
        },
      ],
      billingRules: {
        applicableServiceIds: ["SVC-A", "SVC-B", "SVC-C"],
        discountRate: 0,
        minimumBillingAmount: 0,
        maximumBillingAmount: null,
      },
    };

    const result = extractBillingItemsByService(input);

    // サービス別請求額が正確に分離されていることを検証
    expect(result.serviceBreakdown).toHaveLength(3);

    const serviceA = result.serviceBreakdown.find(
      (s: ServiceBillingAmount) => s.serviceId === "SVC-A"
    );
    expect(serviceA).toEqual({
      serviceId: "SVC-A",
      serviceName: "サービスA",
      billingAmount: 100000,
      quantity: 1,
      unitPrice: 100000,
    });

    const serviceB = result.serviceBreakdown.find(
      (s: ServiceBillingAmount) => s.serviceId === "SVC-B"
    );
    expect(serviceB).toEqual({
      serviceId: "SVC-B",
      serviceName: "サービスB",
      billingAmount: 50000,
      quantity: 1,
      unitPrice: 50000,
    });

    const serviceC = result.serviceBreakdown.find(
      (s: ServiceBillingAmount) => s.serviceId === "SVC-C"
    );
    expect(serviceC).toEqual({
      serviceId: "SVC-C",
      serviceName: "サービスC",
      billingAmount: 75000,
      quantity: 1,
      unitPrice: 75000,
    });

    // 各サービスの請求額の集計合計が正確であることを検証
    expect(result.totalBillingAmount).toBe(225000);

    // 請求書生成時にサービス別の明細が正確に表示されることを確認
    expect(result.invoiceLineItems).toHaveLength(3);
    expect(result.invoiceLineItems[0]).toEqual({
      lineNumber: 1,
      serviceId: "SVC-A",
      serviceName: "サービスA",
      quantity: 1,
      unitPrice: 100000,
      lineAmount: 100000,
    });
    expect(result.invoiceLineItems[1]).toEqual({
      lineNumber: 2,
      serviceId: "SVC-B",
      serviceName: "サービスB",
      quantity: 1,
      unitPrice: 50000,
      lineAmount: 50000,
    });
    expect(result.invoiceLineItems[2]).toEqual({
      lineNumber: 3,
      serviceId: "SVC-C",
      serviceName: "サービスC",
      quantity: 1,
      unitPrice: 75000,
      lineAmount: 75000,
    });

    // 請求書全体の構造を検証
    expect(result.customerId).toBe("CUST-20240115-001");
    expect(result.contractId).toBe("CONT-20240101-A");
    expect(result.invoicePeriod).toEqual({
      startDate: "2024-01-01",
      endDate: "2024-01-31",
    });
    expect(result.isReadyForInvoiceGeneration).toBe(true);
  });
});