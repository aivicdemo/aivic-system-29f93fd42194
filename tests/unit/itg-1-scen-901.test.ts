import { generateMonthlySummary } from "../../src/logic/it-1-br-1781935279444-1-2-1";

describe("月次営業成果サマリー自動生成機能", () => {
  // SCEN-901: [edge] 月次営業成果サマリー自動生成機能 - 成果指標が 0 件の顧客・サービスでも正確に集計され表示される
  test("成果指標が0件の顧客・サービスでも正確に集計・表示される", () => {
    // テストデータ: 成果指標が0件の顧客3件
    const customers_zero_indicators = [
      {
        customer_id: "CUST_001",
        customer_name: "顧客A",
        contract_id: "CONT_001",
        month: "2024-01",
      },
      {
        customer_id: "CUST_002",
        customer_name: "顧客B",
        contract_id: "CONT_002",
        month: "2024-01",
      },
      {
        customer_id: "CUST_003",
        customer_name: "顧客C",
        contract_id: "CONT_003",
        month: "2024-01",
      },
    ];

    // テストデータ: 成果指標が0件のサービス3件
    const services_zero_indicators = [
      {
        service_id: "SVC_001",
        service_name: "サービスX",
        month: "2024-01",
      },
      {
        service_id: "SVC_002",
        service_name: "サービスY",
        month: "2024-01",
      },
      {
        service_id: "SVC_003",
        service_name: "サービスZ",
        month: "2024-01",
      },
    ];

    // テストデータ: 一部顧客・サービスに成果指標あり（0件との混在を確認）
    const performance_indicators = [
      {
        indicator_id: "IND_001",
        customer_id: "CUST_001",
        service_id: "SVC_001",
        month: "2024-01",
        appointment_count: 5,
        contract_count: 2,
        revenue: 100000,
      },
      {
        indicator_id: "IND_002",
        customer_id: "CUST_002",
        service_id: "SVC_002",
        month: "2024-01",
        appointment_count: 0,
        contract_count: 0,
        revenue: 0,
      },
    ];

    // 月次営業成果サマリー自動生成機能を実行
    const summary_result = generateMonthlySummary({
      customers: customers_zero_indicators,
      services: services_zero_indicators,
      performance_indicators: performance_indicators,
      month: "2024-01",
    });

    // 成功時のレスポンス構造を確認
    expect(summary_result).toBeDefined();
    expect(summary_result.status).toBe("success");

    // 生成されたサマリーレポートが存在することを確認
    expect(summary_result.summary_report).toBeDefined();

    // サマリーレポートに成果指標0件の顧客が全て含まれていることを確認
    const customer_ids_in_report = summary_result.summary_report.customers.map(
      (c: any) => c.customer_id
    );
    expect(customer_ids_in_report).toContain("CUST_001");
    expect(customer_ids_in_report).toContain("CUST_002");
    expect(customer_ids_in_report).toContain("CUST_003");
    expect(customer_ids_in_report.length).toBe(3);

    // サマリーレポートに成果指標0件のサービスが全て含まれていることを確認
    const service_ids_in_report = summary_result.summary_report.services.map(
      (s: any) => s.service_id
    );
    expect(service_ids_in_report).toContain("SVC_001");
    expect(service_ids_in_report).toContain("SVC_002");
    expect(service_ids_in_report).toContain("SVC_003");
    expect(service_ids_in_report.length).toBe(3);

    // 顧客別集計値の検証
    const cust_001_summary = summary_result.summary_report.customers.find(
      (c: any) => c.customer_id === "CUST_001"
    );
    expect(cust_001_summary).toBeDefined();
    expect(cust_001_summary.total_appointment_count).toBe(5);
    expect(cust_001_summary.total_contract_count).toBe(2);
    expect(cust_001_summary.total_revenue).toBe(100000);

    // 成果指標0件の顧客CUST_002の集計値が0として表示されることを確認
    const cust_002_summary = summary_result.summary_report.customers.find(
      (c: any) => c.customer_id === "CUST_002"
    );
    expect(cust_002_summary).toBeDefined();
    expect(cust_002_summary.total_appointment_count).toBe(0);
    expect(cust_002_summary.total_contract_count).toBe(0);
    expect(cust_002_summary.total_revenue).toBe(0);

    // 成果指標が全くない顧客CUST_003の集計値が0として表示されることを確認
    const cust_003_summary = summary_result.summary_report.customers.find(
      (c: any) => c.customer_id === "CUST_003"
    );
    expect(cust_003_summary).toBeDefined();
    expect(cust_003_summary.total_appointment_count).toBe(0);
    expect(cust_003_summary.total_contract_count).toBe(0);
    expect(cust_003_summary.total_revenue).toBe(0);

    // サービス別集計値の検証
    const svc_001_summary = summary_result.summary_report.services.find(
      (s: any) => s.service_id === "SVC_001"
    );
    expect(svc_001_summary).toBeDefined();
    expect(svc_001_summary.total_appointment_count).toBe(5);
    expect(svc_001_summary.total_contract_count).toBe(2);
    expect(svc_001_summary.total_revenue).toBe(100000);

    // 成果指標0件のサービスSVC_002の集計値が0として表示されることを確認
    const svc_002_summary = summary_result.summary_report.services.find(
      (s: any) => s.service_id === "SVC_002"
    );
    expect(svc_002_summary).toBeDefined();
    expect(svc_002_summary.total_appointment_count).toBe(0);
    expect(svc_002_summary.total_contract_count).toBe(0);
    expect(svc_002_summary.total_revenue).toBe(0);

    // 成果指標が全くないサービスSVC_003の集計値が0として表示されることを確認
    const svc_003_summary = summary_result.summary_report.services.find(
      (s: any) => s.service_id === "SVC_003"
    );
    expect(svc_003_summary).toBeDefined();
    expect(svc_003_summary.total_appointment_count).toBe(0);
    expect(svc_003_summary.total_contract_count).toBe(0);
    expect(svc_003_summary.total_revenue).toBe(0);

    // 全体集計値の検証
    expect(summary_result.summary_report.aggregate).toBeDefined();
    expect(summary_result.summary_report.aggregate.total_appointment_count).toBe(
      5
    );
    expect(summary_result.summary_report.aggregate.total_contract_count).toBe(2);
    expect(summary_result.summary_report.aggregate.total_revenue).toBe(100000);

    // 平均値計算の検証（0件を含む）
    expect(
      summary_result.summary_report.aggregate.average_appointment_count
    ).toBe(5 / 3); // (5+0+0)/3
    expect(
      summary_result.summary_report.aggregate.average_contract_count
    ).toBe(2 / 3); // (2+0+0)/3

    // 最大値・最小値計算の検証
    expect(summary_result.summary_report.aggregate.max_appointment_count).toBe(
      5
    );
    expect(summary_result.summary_report.aggregate.min_appointment_count).toBe(
      0
    );
    expect(summary_result.summary_report.aggregate.max_contract_count).toBe(2);
    expect(summary_result.summary_report.aggregate.min_contract_count).toBe(0);

    // サマリーレポートのフォーマットが正常であることを確認
    // null値や未定義値がないことを確認
    summary_result.summary_report.customers.forEach((customer: any) => {
      expect(customer.customer_id).not.toBeNull();
      expect(customer.customer_id).not.toBeUndefined();
      expect(customer.customer_name).not.toBeNull();
      expect(customer.customer_name).not.toBeUndefined();
      expect(typeof customer.total_appointment_count).toBe("number");
      expect(typeof customer.total_contract_count).toBe("number");
      expect(typeof customer.total_revenue).toBe("number");
      expect(customer.total_appointment_count).toBeGreaterThanOrEqual(0);
      expect(customer.total_contract_count).toBeGreaterThanOrEqual(0);
      expect(customer.total_revenue).toBeGreaterThanOrEqual(0);
    });

    summary_result.summary_report.services.forEach((service: any) => {
      expect(service.service_id).not.toBeNull();
      expect(service.service_id).not.toBeUndefined();
      expect(service.service_name).not.toBeNull();
      expect(service.service_name).not.toBeUndefined();
      expect(typeof service.total_appointment_count).toBe("number");
      expect(typeof service.total_contract_count).toBe("number");
      expect(typeof service.total_revenue).toBe("number");
      expect(service.total_appointment_count).toBeGreaterThanOrEqual(0);
      expect(service.total_contract_count).toBeGreaterThanOrEqual(0);
      expect(service.total_revenue).toBeGreaterThanOrEqual(0);
    });

    // 月情報が正しく記録されていることを確認
    expect(summary_result.summary_report.month).toBe("2024-01");

    // タイムスタンプが適切に設定されていることを確認（ISO形式）
    expect(summary_result.summary_report.generated_at).toMatch(
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/
    );
  });
});