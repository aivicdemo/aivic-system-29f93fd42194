import { describe, test, expect } from "@jest/globals";
import {
  aggregateCustomerPerformanceIndicators,
} from "../../src/logic/it-1781935279444-1-1-1";

describe("営業データ項目のメタデータ管理機能 - 顧客別成果指標集計ロジック検証", () => {
  // SCEN-1109: [normal] 顧客別成果指標集計ロジック検証 - 契約内容に基づいた集計ルールが正しく適用され成約数が計算される
  test("契約内容に基づいた集計ルールが正しく適用され、複数契約タイプが混在しても各々のルールが独立して正確に適用される", () => {
    // テストデータ準備: 複数の契約内容（契約タイプ、契約期間、成約条件）を持つ顧客レコード
    const contracts = [
      {
        contract_id: "CNT001",
        customer_id: "CUST001",
        contract_type: "PERFORMANCE_BASED",
        contract_start_date: "2024-01-01",
        contract_end_date: "2024-12-31",
        deal_threshold_count: 5,
        exclusion_flags: ["INTERNAL_TEST", "DEMO"],
      },
      {
        contract_id: "CNT002",
        customer_id: "CUST001",
        contract_type: "SERVICE_LEVEL",
        contract_start_date: "2024-01-15",
        contract_end_date: "2024-06-30",
        deal_threshold_count: 3,
        exclusion_flags: ["CANCELLED"],
      },
      {
        contract_id: "CNT003",
        customer_id: "CUST002",
        contract_type: "PERFORMANCE_BASED",
        contract_start_date: "2024-02-01",
        contract_end_date: "2024-12-31",
        deal_threshold_count: 10,
        exclusion_flags: ["INTERNAL_TEST"],
      },
    ];

    const salesActivities = [
      {
        activity_id: "ACT001",
        customer_id: "CUST001",
        contract_id: "CNT001",
        activity_date: "2024-03-15",
        deal_count: 2,
        activity_type: "MEETING",
        status_flags: [],
      },
      {
        activity_id: "ACT002",
        customer_id: "CUST001",
        contract_id: "CNT001",
        activity_date: "2024-04-20",
        deal_count: 4,
        activity_type: "PITCH",
        status_flags: [],
      },
      {
        activity_id: "ACT003",
        customer_id: "CUST001",
        contract_id: "CNT001",
        activity_date: "2024-05-10",
        deal_count: 1,
        activity_type: "NEGOTIATION",
        status_flags: ["INTERNAL_TEST"],
      },
      {
        activity_id: "ACT004",
        customer_id: "CUST001",
        contract_id: "CNT002",
        activity_date: "2024-03-25",
        deal_count: 1,
        activity_type: "MEETING",
        status_flags: [],
      },
      {
        activity_id: "ACT005",
        customer_id: "CUST001",
        contract_id: "CNT002",
        activity_date: "2024-05-05",
        deal_count: 2,
        activity_type: "PITCH",
        status_flags: ["CANCELLED"],
      },
      {
        activity_id: "ACT006",
        customer_id: "CUST002",
        contract_id: "CNT003",
        activity_date: "2024-03-01",
        deal_count: 3,
        activity_type: "MEETING",
        status_flags: [],
      },
      {
        activity_id: "ACT007",
        customer_id: "CUST002",
        contract_id: "CNT003",
        activity_date: "2024-04-10",
        deal_count: 5,
        activity_type: "PITCH",
        status_flags: [],
      },
      {
        activity_id: "ACT008",
        customer_id: "CUST002",
        contract_id: "CNT003",
        activity_date: "2024-06-15",
        deal_count: 2,
        activity_type: "NEGOTIATION",
        status_flags: ["INTERNAL_TEST"],
      },
      {
        activity_id: "ACT009",
        customer_id: "CUST001",
        contract_id: "CNT001",
        activity_date: "2024-06-30",
        deal_count: 0,
        activity_type: "FOLLOW_UP",
        status_flags: [],
      },
    ];

    const aggregationRules = {
      PERFORMANCE_BASED: {
        calculation_formula: "SUM(deal_count) - EXCLUDED_COUNT",
        exclude_status: ["INTERNAL_TEST", "DEMO"],
        min_deal_count: 1,
      },
      SERVICE_LEVEL: {
        calculation_formula: "SUM(deal_count) - EXCLUDED_COUNT",
        exclude_status: ["CANCELLED", "DEMO"],
        min_deal_count: 0,
      },
    };

    // 顧客別成果指標集計ロジック実行
    const result = aggregateCustomerPerformanceIndicators({
      contracts: contracts,
      sales_activities: salesActivities,
      aggregation_rules: aggregationRules,
    });

    // ハッピーパス: 複数契約タイプが混在しても各々のルールが独立して正確に適用される
    // 契約 CNT001（PERFORMANCE_BASED）の集計
    // - ACT001: deal_count=2, status_flags=[] → 含算
    // - ACT002: deal_count=4, status_flags=[] → 含算
    // - ACT003: deal_count=1, status_flags=["INTERNAL_TEST"] → 除外（INTERNAL_TEST は exclusion_flag）
    // 合計: 2 + 4 = 6

    // 契約 CNT002（SERVICE_LEVEL）の集計
    // - ACT004: deal_count=1, status_flags=[] → 含算
    // - ACT005: deal_count=2, status_flags=["CANCELLED"] → 除外（CANCELLED は exclude_status）
    // 合計: 1

    // 契約 CNT003（PERFORMANCE_BASED）の集計
    // - ACT006: deal_count=3, status_flags=[] → 含算
    // - ACT007: deal_count=5, status_flags=[] → 含算
    // - ACT008: deal_count=2, status_flags=["INTERNAL_TEST"] → 除外（INTERNAL_TEST は exclusion_flag）
    // 合計: 3 + 5 = 8

    expect(result).toEqual({
      aggregation_results: [
        {
          contract_id: "CNT001",
          customer_id: "CUST001",
          contract_type: "PERFORMANCE_BASED",
          aggregated_deal_count: 6,
          aggregation_status: "SUCCESS",
          meets_threshold: true,
        },
        {
          contract_id: "CNT002",
          customer_id: "CUST001",
          contract_type: "SERVICE_LEVEL",
          aggregated_deal_count: 1,
          aggregation_status: "SUCCESS",
          meets_threshold: true,
        },
        {
          contract_id: "CNT003",
          customer_id: "CUST002",
          contract_type: "PERFORMANCE_BASED",
          aggregated_deal_count: 8,
          aggregation_status: "SUCCESS",
          meets_threshold: false,
        },
      ],
      customer_summary: [
        {
          customer_id: "CUST001",
          total_deal_count: 7,
          contract_count: 2,
        },
        {
          customer_id: "CUST002",
          total_deal_count: 8,
          contract_count: 1,
        },
      ],
      aggregation_timestamp: expect.any(String),
    });

    // エッジケース: 成約数がゼロの場合
    expect(
      result.aggregation_results.some(
        (r) => r.contract_id === "CNT001" && r.aggregated_deal_count === 6
      )
    ).toBe(true);

    // エッジケース: 境界値（最大値） CNT003 は threshold=10、計算値=8 → meets_threshold=false
    expect(
      result.aggregation_results.find((r) => r.contract_id === "CNT003")
        ?.meets_threshold
    ).toBe(false);

    // エッジケース: 複数契約タイプが混在している場合、各々のルールが独立して適用される
    const cnt001Result = result.aggregation_results.find(
      (r) => r.contract_id === "CNT001"
    );
    const cnt002Result = result.aggregation_results.find(
      (r) => r.contract_id === "CNT002"
    );
    expect(cnt001Result?.contract_type).toBe("PERFORMANCE_BASED");
    expect(cnt002Result?.contract_type).toBe("SERVICE_LEVEL");
    expect(cnt001Result?.aggregated_deal_count).not.toBe(
      cnt002Result?.aggregated_deal_count
    );

    // 検証: すべての結果が SUCCESS ステータスを返す
    expect(
      result.aggregation_results.every((r) => r.aggregation_status === "SUCCESS")
    ).toBe(true);

    // 検証: カスタマーサマリーが正確に計算されている
    const cust001Summary = result.customer_summary.find(
      (s) => s.customer_id === "CUST001"
    );
    expect(cust001Summary?.total_deal_count).toBe(7); // 6 + 1
    expect(cust001Summary?.contract_count).toBe(2);

    const cust002Summary = result.customer_summary.find(
      (s) => s.customer_id === "CUST002"
    );
    expect(cust002Summary?.total_deal_count).toBe(8);
    expect(cust002Summary?.contract_count).toBe(1);

    // エラーテスト: 無効な契約タイプが渡された場合
    expect(() =>
      aggregateCustomerPerformanceIndicators({
        contracts: [
          {
            contract_id: "CNT_ERR",
            customer_id: "CUST_ERR",
            contract_type: "INVALID_TYPE",
            contract_start_date: "2024-01-01",
            contract_end_date: "2024-12-31",
            deal_threshold_count: 5,
            exclusion_flags: [],
          },
        ],
        sales_activities: [],
        aggregation_rules: aggregationRules,
      })
    ).toThrow(/契約タイプ/);

    // エラーテスト: 集計ルールが定義されていない契約タイプ
    expect(() =>
      aggregateCustomerPerformanceIndicators({
        contracts: [
          {
            contract_id: "CNT_RULE_ERR",
            customer_id: "CUST_RULE_ERR",
            contract_type: "UNDEFINED_RULE_TYPE",
            contract_start_date: "2024-01-01",
            contract_end_date: "2024-12-31",
            deal_threshold_count: 5,
            exclusion_flags: [],
          },
        ],
        sales_activities: [],
        aggregation_rules: aggregationRules,
      })
    ).toThrow(/集計ルール/);

    // エラーテスト: 契約期間が無効な場合
    expect(() =>
      aggregateCustomerPerformanceIndicators({
        contracts: [
          {
            contract_id: "CNT_DATE_ERR",
            customer_id: "CUST_DATE_ERR",
            contract_type: "PERFORMANCE_BASED",
            contract_start_date: "2024-12-31",
            contract_end_date: "2024-01-01",
            deal_threshold_count: 5,
            exclusion_flags: [],
          },
        ],
        sales_activities: [],
        aggregation_rules: aggregationRules,
      })
    ).toThrow(/契約期間/);
  });
});