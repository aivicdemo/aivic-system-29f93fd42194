import { describe, it, expect } from "@jest/globals";
import { extractAndAggregateBillingItems } from "../../src/logic/it-1-2-1";

describe("営業成果データから請求対象項目を自動抽出し顧客ごと・サービスごとの請求額を集計", () => {
  it("SCEN-1021: 請求対象項目が存在しない営業データからは空の集計結果が返却される", () => {
    const salesDataWithNoBillingItems = [
      {
        sales_id: "S001",
        customer_id: "C001",
        service_id: "SVC001",
        billing_item: null,
        amount: 50000,
        transaction_date: "2024-01-15",
      },
      {
        sales_id: "S002",
        customer_id: "C001",
        service_id: "SVC001",
        billing_item: undefined,
        amount: 30000,
        transaction_date: "2024-01-16",
      },
      {
        sales_id: "S003",
        customer_id: "C002",
        service_id: "SVC002",
        billing_item: "",
        amount: 20000,
        transaction_date: "2024-01-17",
      },
      {
        sales_id: "S004",
        customer_id: "C002",
        service_id: "SVC002",
        billing_item: null,
        amount: 15000,
        transaction_date: "2024-01-18",
      },
    ];

    const result = extractAndAggregateBillingItems(salesDataWithNoBillingItems);

    expect(result).toEqual({});
  });

  it("SCEN-1021: 請求対象項目が存在しない営業データと存在する営業データが混在する場合、存在しるデータのみ集計される", () => {
    const mixedSalesData = [
      {
        sales_id: "S001",
        customer_id: "C001",
        service_id: "SVC001",
        billing_item: null,
        amount: 50000,
        transaction_date: "2024-01-15",
      },
      {
        sales_id: "S002",
        customer_id: "C001",
        service_id: "SVC001",
        billing_item: "appointment",
        amount: 30000,
        transaction_date: "2024-01-16",
      },
      {
        sales_id: "S003",
        customer_id: "C002",
        service_id: "SVC002",
        billing_item: "",
        amount: 20000,
        transaction_date: "2024-01-17",
      },
      {
        sales_id: "S004",
        customer_id: "C002",
        service_id: "SVC002",
        billing_item: "contract",
        amount: 15000,
        transaction_date: "2024-01-18",
      },
    ];

    const result = extractAndAggregateBillingItems(mixedSalesData);

    expect(result).toEqual({
      "C001-SVC001": {
        customer_id: "C001",
        service_id: "SVC001",
        billing_items: {
          appointment: 30000,
        },
        total_amount: 30000,
      },
      "C002-SVC002": {
        customer_id: "C002",
        service_id: "SVC002",
        billing_items: {
          contract: 15000,
        },
        total_amount: 15000,
      },
    });
  });

  it("SCEN-1021: 複数の有効な請求対象項目が同じ顧客・サービスで集計される", () => {
    const validSalesData = [
      {
        sales_id: "S001",
        customer_id: "C001",
        service_id: "SVC001",
        billing_item: "appointment",
        amount: 50000,
        transaction_date: "2024-01-15",
      },
      {
        sales_id: "S002",
        customer_id: "C001",
        service_id: "SVC001",
        billing_item: "appointment",
        amount: 30000,
        transaction_date: "2024-01-16",
      },
      {
        sales_id: "S003",
        customer_id: "C001",
        service_id: "SVC001",
        billing_item: "contract",
        amount: 20000,
        transaction_date: "2024-01-17",
      },
      {
        sales_id: "S004",
        customer_id: "C002",
        service_id: "SVC002",
        billing_item: "contract",
        amount: 15000,
        transaction_date: "2024-01-18",
      },
    ];

    const result = extractAndAggregateBillingItems(validSalesData);

    expect(result).toEqual({
      "C001-SVC001": {
        customer_id: "C001",
        service_id: "SVC001",
        billing_items: {
          appointment: 80000,
          contract: 20000,
        },
        total_amount: 100000,
      },
      "C002-SVC002": {
        customer_id: "C002",
        service_id: "SVC002",
        billing_items: {
          contract: 15000,
        },
        total_amount: 15000,
      },
    });
  });

  it("SCEN-1021: 空の営業データ配列が入力された場合、空のオブジェクトが返却される", () => {
    const emptySalesData: any[] = [];

    const result = extractAndAggregateBillingItems(emptySalesData);

    expect(result).toEqual({});
  });

  it("SCEN-1021: 請求対象項目が whitespace のみの場合は請求対象外として扱われる", () => {
    const salesDataWithWhitespace = [
      {
        sales_id: "S001",
        customer_id: "C001",
        service_id: "SVC001",
        billing_item: "   ",
        amount: 50000,
        transaction_date: "2024-01-15",
      },
      {
        sales_id: "S002",
        customer_id: "C001",
        service_id: "SVC001",
        billing_item: "\t",
        amount: 30000,
        transaction_date: "2024-01-16",
      },
      {
        sales_id: "S003",
        customer_id: "C002",
        service_id: "SVC002",
        billing_item: "appointment",
        amount: 20000,
        transaction_date: "2024-01-17",
      },
    ];

    const result = extractAndAggregateBillingItems(salesDataWithWhitespace);

    expect(result).toEqual({
      "C002-SVC002": {
        customer_id: "C002",
        service_id: "SVC002",
        billing_items: {
          appointment: 20000,
        },
        total_amount: 20000,
      },
    });
  });
});