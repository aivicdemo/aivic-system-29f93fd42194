import { defineMultipleExtractionRulesAndGenerateReport } from "../../src/logic/it-1-br-1781935279444-1-2-1";

describe("月次サマリーテンプレートの定義・管理機能", () => {
  test("SCEN-1024: 複数の抽出ルール・集計パターン・レポート形式が同時に定義され、テストレポート生成で全条件が反映される", () => {
    const extractionRule1 = {
      rule_id: "RULE_001",
      name: "直販売上抽出",
      filter_condition: { sales_category: "direct" },
      priority: 1,
    };

    const extractionRule2 = {
      rule_id: "RULE_002",
      name: "代理店売上抽出",
      filter_condition: { sales_category: "agency" },
      priority: 2,
    };

    const extractionRule3 = {
      rule_id: "RULE_003",
      name: "納期範囲抽出",
      filter_condition: {
        delivery_date_from: "2024-01-01",
        delivery_date_to: "2024-01-31",
      },
      priority: 3,
    };

    const aggregationPattern1 = {
      pattern_id: "AGG_001",
      name: "基本集計",
      aggregation_items: ["total_sales", "transaction_count", "avg_unit_price"],
      output_format: "summary",
    };

    const aggregationPattern2 = {
      pattern_id: "AGG_002",
      name: "部門別集計",
      aggregation_items: [
        "department_total_sales",
        "category_total_sales",
      ],
      output_format: "detail",
    };

    const reportFormat1 = {
      format_id: "FMT_001",
      name: "Excel形式_サマリー",
      file_type: "xlsx",
      layout_type: "summary",
      sheet_configuration: {
        include_headers: true,
        include_totals: true,
      },
    };

    const reportFormat2 = {
      format_id: "FMT_002",
      name: "PDF形式_詳細",
      file_type: "pdf",
      layout_type: "detail",
      page_configuration: {
        orientation: "landscape",
        font_size: 10,
      },
    };

    const result = defineMultipleExtractionRulesAndGenerateReport({
      extraction_rules: [extractionRule1, extractionRule2, extractionRule3],
      aggregation_patterns: [aggregationPattern1, aggregationPattern2],
      report_formats: [reportFormat1, reportFormat2],
      test_data: {
        sample_sales: [
          {
            id: "SALES_001",
            sales_category: "direct",
            amount: 100000,
            delivery_date: "2024-01-15",
            department: "Sales",
            category: "ProductA",
          },
          {
            id: "SALES_002",
            sales_category: "agency",
            amount: 150000,
            delivery_date: "2024-01-20",
            department: "Marketing",
            category: "ProductB",
          },
          {
            id: "SALES_003",
            sales_category: "direct",
            amount: 200000,
            delivery_date: "2024-01-25",
            department: "Sales",
            category: "ProductC",
          },
        ],
      },
    });

    expect(result).toBeDefined();
    expect(result.definitions_saved).toBe(true);
    expect(result.extraction_rules_count).toBe(3);
    expect(result.aggregation_patterns_count).toBe(2);
    expect(result.report_formats_count).toBe(2);

    expect(result.test_reports).toBeDefined();
    expect(Array.isArray(result.test_reports)).toBe(true);
    expect(result.test_reports.length).toBe(4);

    const excelSummaryReport = result.test_reports.find(
      (r: any) =>
        r.format_id === "FMT_001" && r.aggregation_pattern_id === "AGG_001"
    );
    expect(excelSummaryReport).toBeDefined();
    expect(excelSummaryReport.file_type).toBe("xlsx");
    expect(excelSummaryReport.layout_type).toBe("summary");
    expect(excelSummaryReport.extracted_data_count).toBe(3);
    expect(excelSummaryReport.total_sales).toBe(450000);
    expect(excelSummaryReport.transaction_count).toBe(3);
    expect(excelSummaryReport.avg_unit_price).toBe(150000);

    const excelDetailReport = result.test_reports.find(
      (r: any) =>
        r.format_id === "FMT_001" && r.aggregation_pattern_id === "AGG_002"
    );
    expect(excelDetailReport).toBeDefined();
    expect(excelDetailReport.department_aggregations).toEqual([
      { department: "Sales", total_sales: 300000 },
      { department: "Marketing", total_sales: 150000 },
    ]);
    expect(excelDetailReport.category_aggregations).toEqual([
      { category: "ProductA", total_sales: 100000 },
      { category: "ProductB", total_sales: 150000 },
      { category: "ProductC", total_sales: 200000 },
    ]);

    const pdfSummaryReport = result.test_reports.find(
      (r: any) =>
        r.format_id === "FMT_002" && r.aggregation_pattern_id === "AGG_001"
    );
    expect(pdfSummaryReport).toBeDefined();
    expect(pdfSummaryReport.file_type).toBe("pdf");
    expect(pdfSummaryReport.layout_type).toBe("detail");
    expect(pdfSummaryReport.page_orientation).toBe("landscape");
    expect(pdfSummaryReport.font_size).toBe(10);

    const pdfDetailReport = result.test_reports.find(
      (r: any) =>
        r.format_id === "FMT_002" && r.aggregation_pattern_id === "AGG_002"
    );
    expect(pdfDetailReport).toBeDefined();
    expect(pdfDetailReport.total_sales).toBe(450000);
    expect(pdfDetailReport.transaction_count).toBe(3);

    expect(result.data_consistency_validated).toBe(true);
    expect(result.no_conflicts_detected).toBe(true);
    expect(result.all_combinations_processed).toBe(true);

    expect(result.errors).toEqual([]);
    expect(result.validation_status).toBe("success");
  });
});