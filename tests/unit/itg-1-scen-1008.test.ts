import { describe, test, expect } from "@jest/globals";
import {
  verifySummaryCertification,
} from "../../src/logic/it-1-br-1781935279444-1-2-1";

describe("月次サマリーテンプレートの定義・管理機能", () => {
  // SCEN-1008: [normal] 月次サマリーレポート正確性・完全性確認
  test("生成された月次サマリーレポートの内容が正確かつ完全である場合に承認判定が正確に実行される", () => {
    const monthly_summary_data = {
      summary_id: "summary_2024_01",
      period_start: "2024-01-01",
      period_end: "2024-01-31",
      created_at: "2024-02-01T09:00:00Z",
      created_by: "operator_001",
      total_revenue: 5000000,
      total_transactions: 150,
      total_customers: 45,
      product_breakdown: [
        {
          product_id: "prod_A",
          product_name: "Service A",
          revenue: 3000000,
          transaction_count: 90,
        },
        {
          product_id: "prod_B",
          product_name: "Service B",
          revenue: 2000000,
          transaction_count: 60,
        },
      ],
      region_breakdown: [
        {
          region_id: "region_tokyo",
          region_name: "Tokyo",
          revenue: 3500000,
          transaction_count: 105,
        },
        {
          region_id: "region_osaka",
          region_name: "Osaka",
          revenue: 1500000,
          transaction_count: 45,
        },
      ],
      required_fields_present: true,
      approval_status: "pending",
      approval_date: null,
      approved_by: null,
    };

    const source_data = {
      total_revenue: 5000000,
      total_transactions: 150,
      total_customers: 45,
      product_A_revenue: 3000000,
      product_A_count: 90,
      product_B_revenue: 2000000,
      product_B_count: 60,
      region_tokyo_revenue: 3500000,
      region_tokyo_count: 105,
      region_osaka_revenue: 1500000,
      region_osaka_count: 45,
    };

    const result = verifySummaryCertification(
      monthly_summary_data,
      source_data
    );

    expect(result.is_approved).toBe(true);
    expect(result.approval_status).toBe("approved");
    expect(result.certification_result).toEqual({
      total_revenue_match: true,
      total_transactions_match: true,
      total_customers_match: true,
      product_breakdown_match: true,
      region_breakdown_match: true,
      required_fields_complete: true,
      overall_accuracy: true,
    });
    expect(result.approved_by).toBe("operator_001");
    expect(result.approval_timestamp).toMatch(
      /\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z/
    );
    expect(result.approval_history).toEqual({
      summary_id: "summary_2024_01",
      approval_date: expect.stringMatching(
        /\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z/
      ),
      approved_by: "operator_001",
      approval_reason: "完全性と正確性の検証完了",
      approval_status: "approved",
    });
  });

  test("月次サマリーレポート内の売上合計がソースデータと不一致の場合に承認判定が失敗する", () => {
    const monthly_summary_data = {
      summary_id: "summary_2024_02",
      period_start: "2024-02-01",
      period_end: "2024-02-29",
      created_at: "2024-03-01T09:00:00Z",
      created_by: "operator_001",
      total_revenue: 4500000,
      total_transactions: 150,
      total_customers: 45,
      product_breakdown: [
        {
          product_id: "prod_A",
          product_name: "Service A",
          revenue: 2700000,
          transaction_count: 90,
        },
        {
          product_id: "prod_B",
          product_name: "Service B",
          revenue: 1800000,
          transaction_count: 60,
        },
      ],
      region_breakdown: [
        {
          region_id: "region_tokyo",
          region_name: "Tokyo",
          revenue: 3150000,
          transaction_count: 105,
        },
        {
          region_id: "region_osaka",
          region_name: "Osaka",
          revenue: 1350000,
          transaction_count: 45,
        },
      ],
      required_fields_present: true,
      approval_status: "pending",
      approval_date: null,
      approved_by: null,
    };

    const source_data = {
      total_revenue: 5000000,
      total_transactions: 150,
      total_customers: 45,
      product_A_revenue: 3000000,
      product_A_count: 90,
      product_B_revenue: 2000000,
      product_B_count: 60,
      region_tokyo_revenue: 3500000,
      region_tokyo_count: 105,
      region_osaka_revenue: 1500000,
      region_osaka_count: 45,
    };

    expect(() =>
      verifySummaryCertification(monthly_summary_data, source_data)
    ).toThrow(/売上合計/);
  });

  test("月次サマリーレポートの必須項目が欠落している場合に承認判定が失敗する", () => {
    const monthly_summary_data = {
      summary_id: "summary_2024_03",
      period_start: "2024-03-01",
      period_end: "2024-03-31",
      created_at: "2024-04-01T09:00:00Z",
      created_by: "operator_001",
      total_revenue: 5000000,
      total_transactions: 150,
      total_customers: 45,
      product_breakdown: [
        {
          product_id: "prod_A",
          product_name: "Service A",
          revenue: 3000000,
          transaction_count: 90,
        },
      ],
      region_breakdown: [],
      required_fields_present: false,
      approval_status: "pending",
      approval_date: null,
      approved_by: null,
    };

    const source_data = {
      total_revenue: 5000000,
      total_transactions: 150,
      total_customers: 45,
      product_A_revenue: 3000000,
      product_A_count: 90,
      product_B_revenue: 2000000,
      product_B_count: 60,
      region_tokyo_revenue: 3500000,
      region_tokyo_count: 105,
      region_osaka_revenue: 1500000,
      region_osaka_count: 45,
    };

    expect(() =>
      verifySummaryCertification(monthly_summary_data, source_data)
    ).toThrow(/必須項目/);
  });

  test("月次サマリーレポートの取引件数がソースデータと不一致の場合に承認判定が失敗する", () => {
    const monthly_summary_data = {
      summary_id: "summary_2024_04",
      period_start: "2024-04-01",
      period_end: "2024-04-30",
      created_at: "2024-05-01T09:00:00Z",
      created_by: "operator_001",
      total_revenue: 5000000,
      total_transactions: 140,
      total_customers: 45,
      product_breakdown: [
        {
          product_id: "prod_A",
          product_name: "Service A",
          revenue: 3000000,
          transaction_count: 85,
        },
        {
          product_id: "prod_B",
          product_name: "Service B",
          revenue: 2000000,
          transaction_count: 55,
        },
      ],
      region_breakdown: [
        {
          region_id: "region_tokyo",
          region_name: "Tokyo",
          revenue: 3500000,
          transaction_count: 98,
        },
        {
          region_id: "region_osaka",
          region_name: "Osaka",
          revenue: 1500000,
          transaction_count: 42,
        },
      ],
      required_fields_present: true,
      approval_status: "pending",
      approval_date: null,
      approved_by: null,
    };

    const source_data = {
      total_revenue: 5000000,
      total_transactions: 150,
      total_customers: 45,
      product_A_revenue: 3000000,
      product_A_count: 90,
      product_B_revenue: 2000000,
      product_B_count: 60,
      region_tokyo_revenue: 3500000,
      region_tokyo_count: 105,
      region_osaka_revenue: 1500000,
      region_osaka_count: 45,
    };

    expect(() =>
      verifySummaryCertification(monthly_summary_data, source_data)
    ).toThrow(/取引件数/);
  });

  test("月次サマリーレポートの商品別売上内訳がソースデータと不一致の場合に承認判定が失敗する", () => {
    const monthly_summary_data = {
      summary_id: "summary_2024_05",
      period_start: "2024-05-01",
      period_end: "2024-05-31",
      created_at: "2024-06-01T09:00:00Z",
      created_by: "operator_001",
      total_revenue: 5000000,
      total_transactions: 150,
      total_customers: 45,
      product_breakdown: [
        {
          product_id: "prod_A",
          product_name: "Service A",
          revenue: 2800000,
          transaction_count: 88,
        },
        {
          product_id: "prod_B",
          product_name: "Service B",
          revenue: 2200000,
          transaction_count: 62,
        },
      ],
      region_breakdown: [
        {
          region_id: "region_tokyo",
          region_name: "Tokyo",
          revenue: 3500000,
          transaction_count: 105,
        },
        {
          region_id: "region_osaka",
          region_name: "Osaka",
          revenue: 1500000,
          transaction_count: 45,
        },
      ],
      required_fields_present: true,
      approval_status: "pending",
      approval_date: null,
      approved_by: null,
    };

    const source_data = {
      total_revenue: 5000000,
      total_transactions: 150,
      total_customers: 45,
      product_A_revenue: 3000000,
      product_A_count: 90,
      product_B_revenue: 2000000,
      product_B_count: 60,
      region_tokyo_revenue: 3500000,
      region_tokyo_count: 105,
      region_osaka_revenue: 1500000,
      region_osaka_count: 45,
    };

    expect(() =>
      verifySummaryCertification(monthly_summary_data, source_data)
    ).toThrow(/商品別売上/);
  });

  test("月次サマリーレポートの地域別売上内訳がソースデータと不一致の場合に承認判定が失敗する", () => {
    const monthly_summary_data = {
      summary_id: "summary_2024_06",
      period_start: "2024-06-01",
      period_end: "2024-06-30",
      created_at: "2024-07-01T09:00:00Z",
      created_by: "operator_001",
      total_revenue: 5000000,
      total_transactions: 150,
      total_customers: 45,
      product_breakdown: [
        {
          product_id: "prod_A",
          product_name: "Service A",
          revenue: 3000000,
          transaction_count: 90,
        },
        {
          product_id: "prod_B",
          product_name: "Service B",
          revenue: 2000000,
          transaction_count: 60,
        },
      ],
      region_breakdown: [
        {
          region_id: "region_tokyo",
          region_name: "Tokyo",
          revenue: 3200000,
          transaction_count: 100,
        },
        {
          region_id: "region_osaka",
          region_name: "Osaka",
          revenue: 1800000,
          transaction_count: 50,
        },
      ],
      required_fields_present: true,
      approval_status: "pending",
      approval_date: null,
      approved_by: null,
    };

    const source_data = {
      total_revenue: 5000000,
      total_transactions: 150,
      total_customers: 45,
      product_A_revenue: 3000000,
      product_A_count: 90,
      product_B_revenue: 2000000,
      product_B_count: 60,
      region_tokyo_revenue: 3500000,
      region_tokyo_count: 105,
      region_osaka_revenue: 1500000,
      region_osaka_count: 45,
    };

    expect(() =>
      verifySummaryCertification(monthly_summary_data, source_data)
    ).toThrow(/地域別売上/);
  });
});