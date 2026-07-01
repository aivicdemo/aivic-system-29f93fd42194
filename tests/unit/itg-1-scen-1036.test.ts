import { describe, test, expect, beforeEach } from '@jest/globals';
import {
  generateMonthlySummaryReport,
  validateReportContent,
  calculateSalesAggregation,
  calculateMonthlyComparison,
  formatReportOutput,
  generatePdfReport
} from '../../src/logic/it-1-br-1781935279444-1-2-1';

describe('月次サマリーテンプレートの定義・管理機能', () => {
  // SCEN-1036: [normal] 月次サマリーレポートの生成と内容確認 - 生成されたレポート内容の正確性が確認される
  test('月次サマリーレポート生成時にすべての集計値・請求情報・前月比較が正確に計算・表示される', () => {
    // =========== Test Setup ===========
    const targetMonth = '2024-01';
    const companyId = 'COMP-001';
    const companyName = '営業代行企業A';
    const generationDateTime = new Date('2024-02-01T09:00:00Z');

    // Source data from database
    const salesData = [
      { product_id: 'PROD-001', product_name: '商品A', sales_amount: 500000, sales_count: 10 },
      { product_id: 'PROD-002', product_name: '商品B', sales_amount: 300000, sales_count: 6 },
      { product_id: 'PROD-003', product_name: '商品C', sales_amount: 200000, sales_count: 4 }
    ];

    const billingData = [
      { customer_id: 'CUST-001', customer_name: '顧客A', billing_amount: 450000, billing_count: 1 },
      { customer_id: 'CUST-002', customer_name: '顧客B', billing_amount: 350000, billing_count: 1 },
      { customer_id: 'CUST-003', customer_name: '顧客C', billing_amount: 200000, billing_count: 1 }
    ];

    const previousMonthData = {
      total_sales: 700000,
      total_billing: 600000,
      total_sales_count: 15,
      total_billing_count: 3
    };

    // =========== Calculate Expected Values ===========
    // Total sales aggregation: 500000 + 300000 + 200000 = 1000000
    const expectedTotalSales = 1000000;
    // Total sales count: 10 + 6 + 4 = 20
    const expectedTotalSalesCount = 20;

    // Total billing aggregation: 450000 + 350000 + 200000 = 1000000
    const expectedTotalBilling = 1000000;
    // Total billing count: 1 + 1 + 1 = 3
    const expectedTotalBillingCount = 3;

    // Month-over-month comparison
    // Sales comparison: (1000000 - 700000) / 700000 * 100 = 42.857...% ≈ 42.86%
    const expectedSalesComparison = 42.86;
    // Billing comparison: (1000000 - 600000) / 600000 * 100 = 66.666...% ≈ 66.67%
    const expectedBillingComparison = 66.67;

    // Sales count comparison: (20 - 15) / 15 * 100 = 33.333...% ≈ 33.33%
    const expectedSalesCountComparison = 33.33;

    // =========== Test Execution ===========
    const reportInput = {
      target_month: targetMonth,
      company_id: companyId,
      company_name: companyName,
      generation_datetime: generationDateTime,
      sales_data: salesData,
      billing_data: billingData,
      previous_month_data: previousMonthData
    };

    // Step 1: Generate monthly summary report
    const generatedReport = generateMonthlySummaryReport(reportInput);

    // =========== Assertions ===========
    // Header information verification
    expect(generatedReport.header.target_month).toBe('2024-01');
    expect(generatedReport.header.company_id).toBe('COMP-001');
    expect(generatedReport.header.company_name).toBe('営業代行企業A');
    expect(generatedReport.header.generation_datetime).toEqual(generationDateTime);

    // Sales aggregation verification
    expect(generatedReport.sales_summary.total_sales_amount).toBe(1000000);
    expect(generatedReport.sales_summary.total_sales_count).toBe(20);

    // Sales breakdown by product verification
    expect(generatedReport.sales_summary.sales_by_product).toHaveLength(3);
    expect(generatedReport.sales_summary.sales_by_product[0]).toEqual({
      product_id: 'PROD-001',
      product_name: '商品A',
      sales_amount: 500000,
      sales_count: 10,
      percentage_of_total: 50.0
    });
    expect(generatedReport.sales_summary.sales_by_product[1]).toEqual({
      product_id: 'PROD-002',
      product_name: '商品B',
      sales_amount: 300000,
      sales_count: 6,
      percentage_of_total: 30.0
    });
    expect(generatedReport.sales_summary.sales_by_product[2]).toEqual({
      product_id: 'PROD-003',
      product_name: '商品C',
      sales_amount: 200000,
      sales_count: 4,
      percentage_of_total: 20.0
    });

    // Billing summary verification
    expect(generatedReport.billing_summary.total_billing_amount).toBe(1000000);
    expect(generatedReport.billing_summary.total_billing_count).toBe(3);

    // Billing breakdown by customer verification
    expect(generatedReport.billing_summary.billing_by_customer).toHaveLength(3);
    expect(generatedReport.billing_summary.billing_by_customer[0]).toEqual({
      customer_id: 'CUST-001',
      customer_name: '顧客A',
      billing_amount: 450000,
      billing_count: 1,
      percentage_of_total: 45.0
    });

    // Month-over-month comparison verification
    expect(generatedReport.comparison.sales_amount_comparison_percent).toBe(expectedSalesComparison);
    expect(generatedReport.comparison.billing_amount_comparison_percent).toBe(expectedBillingComparison);
    expect(generatedReport.comparison.sales_count_comparison_percent).toBe(expectedSalesCountComparison);
    expect(generatedReport.comparison.previous_month_total_sales).toBe(700000);
    expect(generatedReport.comparison.previous_month_total_billing).toBe(600000);

    // Format verification
    expect(generatedReport.format.decimal_places).toBe(2);
    expect(generatedReport.format.currency_symbol).toBe('¥');
    expect(generatedReport.format.thousands_separator).toBe(',');

    // Step 2: Validate report content structure
    const contentValidation = validateReportContent(generatedReport);
    expect(contentValidation.is_valid).toBe(true);
    expect(contentValidation.validation_errors).toEqual([]);

    // Step 3: Calculate sales aggregation separately
    const calculatedSalesAgg = calculateSalesAggregation(salesData);
    expect(calculatedSalesAgg.total_amount).toBe(expectedTotalSales);
    expect(calculatedSalesAgg.total_count).toBe(expectedTotalSalesCount);

    // Step 4: Calculate monthly comparison
    const calculatedComparison = calculateMonthlyComparison(
      {
        total_sales: expectedTotalSales,
        total_billing: expectedTotalBilling,
        total_sales_count: expectedTotalSalesCount,
        total_billing_count: expectedTotalBillingCount
      },
      previousMonthData
    );
    expect(calculatedComparison.sales_percent_change).toBe(expectedSalesComparison);
    expect(calculatedComparison.billing_percent_change).toBe(expectedBillingComparison);
    expect(calculatedComparison.sales_count_percent_change).toBe(expectedSalesCountComparison);

    // Step 5: Format report output
    const formattedReport = formatReportOutput(generatedReport);
    expect(formattedReport.sales_summary.total_sales_formatted).toBe('¥1,000,000.00');
    expect(formattedReport.billing_summary.total_billing_formatted).toBe('¥1,000,000.00');
    expect(formattedReport.comparison.sales_comparison_formatted).toBe('+42.86%');
    expect(formattedReport.comparison.billing_comparison_formatted).toBe('+66.67%');

    // Step 6: Generate PDF report
    const pdfReport = generatePdfReport(formattedReport);
    expect(pdfReport.status).toBe('generated');
    expect(pdfReport.pdf_content_hash).toBeDefined();
    expect(typeof pdfReport.pdf_content_hash).toBe('string');
    expect(pdfReport.pdf_content_hash.length).toBeGreaterThan(0);

    // Verify PDF content matches formatted report
    expect(pdfReport.embedded_data.header_target_month).toBe('2024-01');
    expect(pdfReport.embedded_data.header_company_name).toBe('営業代行企業A');
    expect(pdfReport.embedded_data.total_sales_amount).toBe('¥1,000,000.00');
    expect(pdfReport.embedded_data.total_billing_amount).toBe('¥1,000,000.00');
    expect(pdfReport.embedded_data.sales_comparison_percent).toBe('+42.86%');
    expect(pdfReport.embedded_data.billing_comparison_percent).toBe('+66.67%');

    // Verify generated report can be exported without errors
    expect(pdfReport.is_exportable).toBe(true);
    expect(pdfReport.generation_timestamp).toBeInstanceOf(Date);
  });
});