import { generateBillingDocumentAndReportFromTemplate } from "../../src/logic/it-1-br-1781935279444-1-2-1";

describe("月次サマリーテンプレートの定義・管理機能 - 請求書・成果レポート自動生成", () => {
  test("SCEN-599: 定義済みテンプレートと集計済みデータから請求書・成果レポートが正確に自動生成される", () => {
    // テンプレート定義
    const billingTemplate = {
      template_id: "billing_tmpl_001",
      template_name: "月次請求書テンプレート",
      format: "PDF",
      items: [
        { item_key: "customer_name", display_name: "顧客名", position: 1 },
        { item_key: "billing_amount", display_name: "請求額", position: 2 },
        { item_key: "billing_date", display_name: "請求日", position: 3 },
        { item_key: "payment_deadline", display_name: "支払期限", position: 4 },
      ],
    };

    const reportTemplate = {
      template_id: "report_tmpl_001",
      template_name: "月次成果レポートテンプレート",
      format: "Excel",
      items: [
        { item_key: "project_name", display_name: "案件名", position: 1 },
        { item_key: "revenue", display_name: "売上", position: 2 },
        { item_key: "profit_margin", display_name: "利益率", position: 3 },
        { item_key: "achievement_rate", display_name: "達成率", position: 4 },
      ],
    };

    // 集計済み営業データ
    const aggregatedData = [
      {
        customer_id: "cust_001",
        customer_name: "株式会社A",
        service_id: "svc_001",
        service_name: "営業代行サービス",
        project_name: "プロジェクトA",
        billing_amount: 500000,
        billing_date: "2024-01-31",
        payment_deadline: "2024-02-28",
        revenue: 1200000,
        profit_margin: 0.42,
        achievement_rate: 1.05,
      },
      {
        customer_id: "cust_002",
        customer_name: "株式会社B",
        service_id: "svc_001",
        service_name: "営業代行サービス",
        project_name: "プロジェクトB",
        billing_amount: 750000,
        billing_date: "2024-01-31",
        payment_deadline: "2024-02-28",
        revenue: 1800000,
        profit_margin: 0.38,
        achievement_rate: 0.95,
      },
    ];

    // 自動生成実行
    const result = generateBillingDocumentAndReportFromTemplate({
      billing_template: billingTemplate,
      report_template: reportTemplate,
      aggregated_data: aggregatedData,
      output_format_billing: "PDF",
      output_format_report: "Excel",
      generation_date: "2024-02-01",
    });

    // 結果の検証
    expect(result).toBeDefined();
    expect(result.success).toBe(true);
    expect(result.generated_documents).toBeDefined();
    expect(Array.isArray(result.generated_documents)).toBe(true);
    expect(result.generated_documents.length).toBe(2);

    // 最初の請求書ドキュメント検証
    const firstBillingDoc = result.generated_documents[0];
    expect(firstBillingDoc.document_type).toBe("billing");
    expect(firstBillingDoc.template_id).toBe("billing_tmpl_001");
    expect(firstBillingDoc.customer_id).toBe("cust_001");
    expect(firstBillingDoc.content).toBeDefined();
    expect(firstBillingDoc.content.customer_name).toBe("株式会社A");
    expect(firstBillingDoc.content.billing_amount).toBe(500000);
    expect(firstBillingDoc.content.billing_date).toBe("2024-01-31");
    expect(firstBillingDoc.content.payment_deadline).toBe("2024-02-28");
    expect(firstBillingDoc.file_format).toBe("PDF");
    expect(firstBillingDoc.file_name).toMatch(/billing_cust_001_/);
    expect(firstBillingDoc.file_name).toMatch(/\.pdf$/);

    // 最初の成果レポートドキュメント検証
    const firstReportDoc = result.generated_documents[1];
    expect(firstReportDoc.document_type).toBe("report");
    expect(firstReportDoc.template_id).toBe("report_tmpl_001");
    expect(firstReportDoc.customer_id).toBe("cust_001");
    expect(firstReportDoc.content).toBeDefined();
    expect(firstReportDoc.content.project_name).toBe("プロジェクトA");
    expect(firstReportDoc.content.revenue).toBe(1200000);
    expect(firstReportDoc.content.profit_margin).toBe(0.42);
    expect(firstReportDoc.content.achievement_rate).toBe(1.05);
    expect(firstReportDoc.file_format).toBe("Excel");
    expect(firstReportDoc.file_name).toMatch(/report_cust_001_/);
    expect(firstReportDoc.file_name).toMatch(/\.xlsx$/);

    // 2番目の顧客のドキュメント検証（請求書）
    const secondBillingDoc = result.generated_documents[2];
    expect(secondBillingDoc.document_type).toBe("billing");
    expect(secondBillingDoc.customer_id).toBe("cust_002");
    expect(secondBillingDoc.content.customer_name).toBe("株式会社B");
    expect(secondBillingDoc.content.billing_amount).toBe(750000);

    // 2番目の顧客のドキュメント検証（成果レポート）
    const secondReportDoc = result.generated_documents[3];
    expect(secondReportDoc.document_type).toBe("report");
    expect(secondReportDoc.customer_id).toBe("cust_002");
    expect(secondReportDoc.content.project_name).toBe("プロジェクトB");
    expect(secondReportDoc.content.revenue).toBe(1800000);
    expect(secondReportDoc.content.profit_margin).toBe(0.38);
    expect(secondReportDoc.content.achievement_rate).toBe(0.95);

    // 数値計算の正確性検証
    expect(result.validation_summary).toBeDefined();
    expect(result.validation_summary.total_documents_generated).toBe(4);
    expect(result.validation_summary.total_billing_amount).toBe(1250000);
    expect(result.validation_summary.total_revenue).toBe(3000000);
    expect(result.validation_summary.all_calculations_accurate).toBe(true);

    // ファイルフォーマット検証
    expect(result.file_generation_status).toBeDefined();
    expect(result.file_generation_status.pdf_files_count).toBe(2);
    expect(result.file_generation_status.excel_files_count).toBe(2);
    expect(result.file_generation_status.all_files_generated_correctly).toBe(true);

    // テンプレート形式の保持検証
    expect(result.template_integrity).toBeDefined();
    expect(result.template_integrity.billing_template_applied_correctly).toBe(true);
    expect(result.template_integrity.report_template_applied_correctly).toBe(true);

    // 生成完了の確認
    expect(result.generation_status).toBe("completed");
    expect(result.generation_timestamp).toBeDefined();
    expect(result.total_processing_time_ms).toBeGreaterThan(0);
  });

  test("SCEN-599-ERR: テンプレート項目の欠落でエラーが検出される", () => {
    // 不正なテンプレート（必須項目欠落）
    const invalidBillingTemplate = {
      template_id: "billing_tmpl_invalid",
      template_name: "不正な請求書テンプレート",
      format: "PDF",
      items: [
        { item_key: "customer_name", display_name: "顧客名", position: 1 },
        // billing_amount が欠落
      ],
    };

    const reportTemplate = {
      template_id: "report_tmpl_001",
      template_name: "月次成果レポートテンプレート",
      format: "Excel",
      items: [
        { item_key: "project_name", display_name: "案件名", position: 1 },
        { item_key: "revenue", display_name: "売上", position: 2 },
        { item_key: "profit_margin", display_name: "利益率", position: 3 },
        { item_key: "achievement_rate", display_name: "達成率", position: 4 },
      ],
    };

    const aggregatedData = [
      {
        customer_id: "cust_001",
        customer_name: "株式会社A",
        service_id: "svc_001",
        service_name: "営業代行サービス",
        project_name: "プロジェクトA",
        billing_amount: 500000,
        billing_date: "2024-01-31",
        payment_deadline: "2024-02-28",
        revenue: 1200000,
        profit_margin: 0.42,
        achievement_rate: 1.05,
      },
    ];

    expect(() =>
      generateBillingDocumentAndReportFromTemplate({
        billing_template: invalidBillingTemplate,
        report_template: reportTemplate,
        aggregated_data: aggregatedData,
        output_format_billing: "PDF",
        output_format_report: "Excel",
        generation_date: "2024-02-01",
      })
    ).toThrow(/テンプレート項目/);
  });

  test("SCEN-599-ERR: 集計データの必須フィールド欠落でエラーが検出される", () => {
    const billingTemplate = {
      template_id: "billing_tmpl_001",
      template_name: "月次請求書テンプレート",
      format: "PDF",
      items: [
        { item_key: "customer_name", display_name: "顧客名", position: 1 },
        { item_key: "billing_amount", display_name: "請求額", position: 2 },
        { item_key: "billing_date", display_name: "請求日", position: 3 },
        { item_key: "payment_deadline", display_name: "支払期限", position: 4 },
      ],
    };

    const reportTemplate = {
      template_id: "report_tmpl_001",
      template_name: "月次成果レポートテンプレート",
      format: "Excel",
      items: [
        { item_key: "project_name", display_name: "案件名", position: 1 },
        { item_key: "revenue", display_name: "売上", position: 2 },
        { item_key: "profit_margin", display_name: "利益率", position: 3 },
        { item_key: "achievement_rate", display_name: "達成率", position: 4 },
      ],
    };

    // customer_name が欠落
    const invalidAggregatedData = [
      {
        customer_id: "cust_001",
        service_id: "svc_001",
        service_name: "営業代行サービス",
        project_name: "プロジェクトA",
        billing_amount: 500000,
        billing_date: "2024-01-31",
        payment_deadline: "2024-02-28",
        revenue: 1200000,
        profit_margin: 0.42,
        achievement_rate: 1.05,
      },
    ];

    expect(() =>
      generateBillingDocumentAndReportFromTemplate({
        billing_template: billingTemplate,
        report_template: reportTemplate,
        aggregated_data: invalidAggregatedData,
        output_format_billing: "PDF",
        output_format_report: "Excel",
        generation_date: "2024-02-01",
      })
    ).toThrow(/集計データ/);
  });

  test("SCEN-599-ERR: 出力フォーマットが不正な場合エラーが検出される", () => {
    const billingTemplate = {
      template_id: "billing_tmpl_001",
      template_name: "月次請求書テンプレート",
      format: "PDF",
      items: [
        { item_key: "customer_name", display_name: "顧客名", position: 1 },
        { item_key: "billing_amount", display_name: "請求額", position: 2 },
        { item_key: "billing_date", display_name: "請求日", position: 3 },
        { item_key: "payment_deadline", display_名: "支払期限", position: 4 },
      ],
    };

    const reportTemplate = {
      template_id: "report_tmpl_001",
      template_name: "月次成果レポートテンプレート",
      format: "Excel",
      items: [
        { item_key: "project_name", display_name: "案件名", position: 1 },
        { item_key: "revenue", display_name: "売上", position: 2 },
        { item_key: "profit_margin", display_name: "利益率", position: 3 },
        { item_key: "achievement_rate", display_name: "達成率", position: 4 },
      ],
    };

    const aggregatedData = [
      {
        customer_id: "cust_001",
        customer_name: "株式会社A",
        service_id: "svc_001",
        service_name: "営業代行サービス",
        project_name: "プロジェクトA",
        billing_amount: 500000,
        billing_date: "2024-01-31",
        payment_deadline: "2024-02-28",
        revenue: 1200000,
        profit_margin: 0.42,
        achievement_rate: 1.05,
      },
    ];

    expect(() =>
      generateBillingDocumentAndReportFromTemplate({
        billing_template: billingTemplate,
        report_template: reportTemplate,
        aggregated_data: aggregatedData,
        output_format_billing: "INVALID_FORMAT",
        output_format_report: "Excel",
        generation_date: "2024-02-01",
      })
    ).toThrow(/フォーマット/);
  });
});