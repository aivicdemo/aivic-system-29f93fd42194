import { generateMonthlySummaryReport } from "../../src/logic/it-1-br-1781935279444-1-2-1";

describe("月次サマリーテンプレートの定義・管理機能", () => {
  test("SCEN-1035: 月次サマリーレポートが正確に生成される", () => {
    // 前提条件：営業データ品質管理・請求自動化システムにログイン済み
    const target_month = "2024-01";
    const user_id = "user-001";

    // 入力データ：営業成果データ（品質検証済み）
    const sales_data = [
      {
        customer_id: "cust-001",
        service_id: "svc-001",
        appointment_count: 10,
        contract_count: 3,
        revenue_amount: 150000,
      },
      {
        customer_id: "cust-002",
        service_id: "svc-002",
        appointment_count: 8,
        contract_count: 2,
        revenue_amount: 100000,
      },
    ];

    // 入力データ：請求集計データ
    const billing_data = [
      {
        customer_id: "cust-001",
        service_id: "svc-001",
        base_amount: 150000,
        discount_amount: 0,
        billing_amount: 150000,
      },
      {
        customer_id: "cust-002",
        service_id: "svc-002",
        base_amount: 100000,
        discount_amount: 10000,
        billing_amount: 90000,
      },
    ];

    // 入力データ：データ品質指標
    const quality_metrics = {
      total_records: 2,
      valid_records: 2,
      invalid_records: 0,
      completeness_rate: 100,
      accuracy_rate: 100,
      data_quality_score: 100,
    };

    // 月次サマリーレポート生成処理を実行
    const report_result = generateMonthlySummaryReport({
      target_month,
      user_id,
      sales_data,
      billing_data,
      quality_metrics,
    });

    // 期待結果1：レポートが正常に生成されている
    expect(report_result).toBeDefined();
    expect(report_result.report_id).toBeDefined();
    expect(report_result.target_month).toBe("2024-01");

    // 期待結果2：売上集計データが正確に表示されている
    // 顧客1：アポ数10, 成約数3, 売上150000
    // 顧客2：アポ数8, 成約数2, 売上100000
    expect(report_result.sales_summary).toEqual({
      total_appointments: 18,
      total_contracts: 5,
      total_revenue: 250000,
      customer_breakdown: [
        {
          customer_id: "cust-001",
          appointment_count: 10,
          contract_count: 3,
          revenue_amount: 150000,
        },
        {
          customer_id: "cust-002",
          appointment_count: 8,
          contract_count: 2,
          revenue_amount: 100000,
        },
      ],
    });

    // 期待結果3：請求集計データが正確に表示されている
    // 顧客1：請求額150000
    // 顧客2：割引10000を適用後の請求額90000
    // 合計240000
    expect(report_result.billing_summary).toEqual({
      total_base_amount: 250000,
      total_discount_amount: 10000,
      total_billing_amount: 240000,
      service_breakdown: [
        {
          customer_id: "cust-001",
          service_id: "svc-001",
          billing_amount: 150000,
        },
        {
          customer_id: "cust-002",
          service_id: "svc-002",
          billing_amount: 90000,
        },
      ],
    });

    // 期待結果4：データ品質指標が正確に表示されている
    expect(report_result.quality_indicators).toEqual({
      total_records: 2,
      valid_records: 2,
      invalid_records: 0,
      completeness_rate: 100,
      accuracy_rate: 100,
      data_quality_score: 100,
    });

    // 期待結果5：総計値が各明細行の合計と一致している
    // 売上合計：150000 + 100000 = 250000
    const sales_line_total =
      report_result.sales_summary.customer_breakdown.reduce(
        (sum, item) => sum + item.revenue_amount,
        0
      );
    expect(report_result.sales_summary.total_revenue).toBe(sales_line_total);

    // 請求合計：150000 + 90000 = 240000
    const billing_line_total =
      report_result.billing_summary.service_breakdown.reduce(
        (sum, item) => sum + item.billing_amount,
        0
      );
    expect(report_result.billing_summary.total_billing_amount).toBe(
      billing_line_total
    );

    // 期待結果6：PDFエクスポート機能が正常に動作している
    expect(report_result.export_formats).toBeDefined();
    expect(report_result.export_formats).toContain("pdf");

    // PDFファイル生成メタデータが正常である
    expect(report_result.pdf_export).toBeDefined();
    expect(report_result.pdf_export.file_name).toBe(
      `monthly_summary_2024-01_${user_id}.pdf`
    );
    expect(report_result.pdf_export.generated_at).toBeDefined();
    expect(report_result.pdf_export.file_size_bytes).toBeGreaterThan(0);
    expect(report_result.pdf_export.status).toBe("success");

    // 期待結果7：レポートメタデータが正確に記録されている
    expect(report_result.metadata).toEqual({
      generated_by: user_id,
      generated_at: expect.any(String),
      report_version: "1.0",
      template_id: "monthly_summary_template_001",
    });

    // 期待結果8：すべてのレポート要素が期待される構造を持つ
    expect(report_result).toHaveProperty("report_id");
    expect(report_result).toHaveProperty("target_month");
    expect(report_result).toHaveProperty("sales_summary");
    expect(report_result).toHaveProperty("billing_summary");
    expect(report_result).toHaveProperty("quality_indicators");
    expect(report_result).toHaveProperty("export_formats");
    expect(report_result).toHaveProperty("pdf_export");
    expect(report_result).toHaveProperty("metadata");
  });
});