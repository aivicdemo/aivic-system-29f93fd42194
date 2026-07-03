import {
  aggregateMonthlyReportByCustomerAndService,
} from "../../src/logic/it-1-br-1781935279444-1-2-1";

describe("月次サマリーテンプレートの定義・管理機能", () => {
  // SCEN-679: [normal] 月次成果レポート自動集計機能 - 営業データから標準化されたレポートテンプレートに基づき顧客ごと・サービスごとの成果指標が自動集計される
  test("should automatically aggregate sales performance metrics by customer and service based on standardized template", () => {
    const sales_data = [
      {
        customer_id: "CUST001",
        customer_name: "顧客A",
        service_id: "SVC001",
        service_name: "コンサルティング",
        appointment_count: 5,
        deal_count: 3,
        revenue: 150000,
        customer_satisfaction: 4.5,
      },
      {
        customer_id: "CUST001",
        customer_name: "顧客A",
        service_id: "SVC002",
        service_name: "システム構築",
        appointment_count: 8,
        deal_count: 2,
        revenue: 500000,
        customer_satisfaction: 4.8,
      },
      {
        customer_id: "CUST002",
        customer_name: "顧客B",
        service_id: "SVC001",
        service_name: "コンサルティング",
        appointment_count: 12,
        deal_count: 4,
        revenue: 200000,
        customer_satisfaction: 4.2,
      },
      {
        customer_id: "CUST002",
        customer_name: "顧客B",
        service_id: "SVC003",
        service_name: "運用サポート",
        appointment_count: 3,
        deal_count: 1,
        revenue: 80000,
        customer_satisfaction: 3.9,
      },
    ];

    const template_config = {
      template_id: "TPL_MONTHLY_001",
      template_name: "標準月次成果レポート",
      aggregation_level: ["customer", "service"],
      metrics: [
        {
          metric_id: "MTR_APPOINTMENT",
          metric_name: "アポイント数",
          calculation_type: "sum",
          source_field: "appointment_count",
          unit: "件",
        },
        {
          metric_id: "MTR_DEAL",
          metric_name: "成約数",
          calculation_type: "sum",
          source_field: "deal_count",
          unit: "件",
        },
        {
          metric_id: "MTR_REVENUE",
          metric_name: "売上",
          calculation_type: "sum",
          source_field: "revenue",
          unit: "円",
        },
        {
          metric_id: "MTR_CONVERSION",
          metric_name: "成約率",
          calculation_type: "custom",
          formula: "deal_count / appointment_count * 100",
          unit: "%",
        },
        {
          metric_id: "MTR_SATISFACTION",
          metric_name: "顧客満足度",
          calculation_type: "average",
          source_field: "customer_satisfaction",
          unit: "点",
        },
      ],
      period: {
        period_start: "2024-01-01",
        period_end: "2024-01-31",
        period_type: "monthly",
      },
    };

    const result = aggregateMonthlyReportByCustomerAndService(
      sales_data,
      template_config
    );

    // レポートが生成されていることを確認
    expect(result).toBeDefined();
    expect(result.template_id).toBe("TPL_MONTHLY_001");
    expect(result.template_name).toBe("標準月次成果レポート");
    expect(result.period_type).toBe("monthly");
    expect(result.period_start).toBe("2024-01-01");
    expect(result.period_end).toBe("2024-01-31");

    // 顧客ごとの集計結果を検証
    expect(result.customer_summaries).toBeDefined();
    expect(result.customer_summaries.length).toBe(2);

    const cust001_summary = result.customer_summaries.find(
      (s) => s.customer_id === "CUST001"
    );
    expect(cust001_summary).toBeDefined();
    expect(cust001_summary.customer_name).toBe("顧客A");
    expect(cust001_summary.total_appointment_count).toBe(13); // 5 + 8
    expect(cust001_summary.total_deal_count).toBe(5); // 3 + 2
    expect(cust001_summary.total_revenue).toBe(650000); // 150000 + 500000
    expect(cust001_summary.total_conversion_rate).toBeCloseTo(
      (5 / 13) * 100,
      1
    ); // 38.46%
    expect(cust001_summary.average_satisfaction).toBeCloseTo(4.65, 1); // (4.5 + 4.8) / 2

    const cust002_summary = result.customer_summaries.find(
      (s) => s.customer_id === "CUST002"
    );
    expect(cust002_summary).toBeDefined();
    expect(cust002_summary.customer_name).toBe("顧客B");
    expect(cust002_summary.total_appointment_count).toBe(15); // 12 + 3
    expect(cust002_summary.total_deal_count).toBe(5); // 4 + 1
    expect(cust002_summary.total_revenue).toBe(280000); // 200000 + 80000
    expect(cust002_summary.total_conversion_rate).toBeCloseTo(
      (5 / 15) * 100,
      1
    ); // 33.33%
    expect(cust002_summary.average_satisfaction).toBeCloseTo(4.05, 1); // (4.2 + 3.9) / 2

    // 顧客別・サービス別の細粒度集計結果を検証
    expect(result.service_details).toBeDefined();
    expect(result.service_details.length).toBe(4);

    const cust001_svc001 = result.service_details.find(
      (d) => d.customer_id === "CUST001" && d.service_id === "SVC001"
    );
    expect(cust001_svc001).toBeDefined();
    expect(cust001_svc001.service_name).toBe("コンサルティング");
    expect(cust001_svc001.appointment_count).toBe(5);
    expect(cust001_svc001.deal_count).toBe(3);
    expect(cust001_svc001.revenue).toBe(150000);
    expect(cust001_svc001.conversion_rate).toBeCloseTo(60, 1); // 3/5 * 100
    expect(cust001_svc001.satisfaction_score).toBe(4.5);

    const cust001_svc002 = result.service_details.find(
      (d) => d.customer_id === "CUST001" && d.service_id === "SVC002"
    );
    expect(cust001_svc002).toBeDefined();
    expect(cust001_svc002.service_name).toBe("システム構築");
    expect(cust001_svc002.appointment_count).toBe(8);
    expect(cust001_svc002.deal_count).toBe(2);
    expect(cust001_svc002.revenue).toBe(500000);
    expect(cust001_svc002.conversion_rate).toBeCloseTo(25, 1); // 2/8 * 100
    expect(cust001_svc002.satisfaction_score).toBe(4.8);

    const cust002_svc001 = result.service_details.find(
      (d) => d.customer_id === "CUST002" && d.service_id === "SVC001"
    );
    expect(cust002_svc001).toBeDefined();
    expect(cust002_svc001.service_name).toBe("コンサルティング");
    expect(cust002_svc001.appointment_count).toBe(12);
    expect(cust002_svc001.deal_count).toBe(4);
    expect(cust002_svc001.revenue).toBe(200000);
    expect(cust002_svc001.conversion_rate).toBeCloseTo(
      (4 / 12) * 100,
      1
    ); // 33.33%
    expect(cust002_svc001.satisfaction_score).toBe(4.2);

    const cust002_svc003 = result.service_details.find(
      (d) => d.customer_id === "CUST002" && d.service_id === "SVC003"
    );
    expect(cust002_svc003).toBeDefined();
    expect(cust002_svc003.service_name).toBe("運用サポート");
    expect(cust002_svc003.appointment_count).toBe(3);
    expect(cust002_svc003.deal_count).toBe(1);
    expect(cust002_svc003.revenue).toBe(80000);
    expect(cust002_svc003.conversion_rate).toBeCloseTo(
      (1 / 3) * 100,
      1
    ); // 33.33%
    expect(cust002_svc003.satisfaction_score).toBe(3.9);

    // テンプレート準拠性の確認
    expect(result.template_compliance).toBeDefined();
    expect(result.template_compliance.is_compliant).toBe(true);
    expect(result.template_compliance.format_validation_passed).toBe(true);
    expect(result.template_compliance.metric_calculation_valid).toBe(true);
    expect(result.template_compliance.aggregation_level_correct).toBe(true);

    // 生成完了ステータス
    expect(result.generation_status).toBe("completed");
    expect(result.generated_at).toBeDefined();
    expect(result.total_records_aggregated).toBe(4);
    expect(result.total_customers).toBe(2);
    expect(result.total_services).toBe(3);
  });
});