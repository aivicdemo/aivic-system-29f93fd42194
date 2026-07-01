import { describe, test, expect, beforeEach } from '@jest/globals';
import {
  generateStandardizedReport,
  validateReportData,
  exportReportToFormat,
} from '../../src/logic/it-1-br-1781935279444-1-2-1';

describe('月次サマリーテンプレートの定義・管理機能', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // SCEN-1055: [normal] 営業データ抽出・レポート自動生成機能 - 定義されたテンプレートに基づいて営業活動データから標準化レポートが正常に生成される
  test('定義されたテンプレートに基づいて営業活動データから標準化レポートが正常に生成される', () => {
    // Setup: テンプレート定義
    const templateId = 'tmpl-standard-monthly-001';
    const templateName = '標準月次営業成果レポート';
    const templateItems = [
      { item_id: 'item-001', item_name: '売上金額', display_order: 1, calc_logic: 'SUM(revenue)' },
      { item_id: 'item-002', item_name: '案件数', display_order: 2, calc_logic: 'COUNT(deal_id)' },
      { item_id: 'item-003', item_name: '成約率', display_order: 3, calc_logic: 'COUNT(closed_deal_id)/COUNT(deal_id)*100' },
    ];

    // Setup: 営業活動データソース
    const dataSourceType = 'sales_db';
    const reportPeriodStart = new Date('2024-01-01T00:00:00Z');
    const reportPeriodEnd = new Date('2024-01-31T23:59:59Z');
    const reportPeriodDays = 30;

    // Setup: 営業活動データ（ソースデータ）
    const salesActivityData = [
      { activity_id: 'act-001', customer_id: 'cust-A', service_id: 'srv-001', deal_amount: 100000, deal_status: 'closed', activity_date: '2024-01-05' },
      { activity_id: 'act-002', customer_id: 'cust-A', service_id: 'srv-002', deal_amount: 150000, deal_status: 'closed', activity_date: '2024-01-10' },
      { activity_id: 'act-003', customer_id: 'cust-B', service_id: 'srv-001', deal_amount: 0, deal_status: 'open', activity_date: '2024-01-15' },
      { activity_id: 'act-004', customer_id: 'cust-B', service_id: 'srv-003', deal_amount: 200000, deal_status: 'closed', activity_date: '2024-01-20' },
      { activity_id: 'act-005', customer_id: 'cust-C', service_id: 'srv-002', deal_amount: 75000, deal_status: 'closed', activity_date: '2024-01-25' },
    ];

    // Expect: 集計結果の具体値計算
    // 売上金額: 100000 + 150000 + 200000 + 75000 = 525000
    const expectedTotalRevenue = 525000;
    // 案件数: 5件
    const expectedTotalDeals = 5;
    // 成約件数: 4件（closed_deal_id count）
    const expectedClosedDeals = 4;
    // 成約率: 4/5 * 100 = 80
    const expectedClosingRate = 80;

    // Step 1: レポート生成関数を呼び出す
    const generatedReport = generateStandardizedReport({
      template_id: templateId,
      template_name: templateName,
      template_items: templateItems,
      data_source_type: dataSourceType,
      sales_activity_data: salesActivityData,
      report_period_start: reportPeriodStart,
      report_period_end: reportPeriodEnd,
      report_period_days: reportPeriodDays,
    });

    // Step 2: レポート生成が成功し、必須フィールドが存在することを検証
    expect(generatedReport).toBeDefined();
    expect(generatedReport.report_id).toBeDefined();
    expect(generatedReport.template_id).toBe(templateId);
    expect(generatedReport.report_name).toBe(templateName);
    expect(generatedReport.generation_status).toBe('completed');
    expect(generatedReport.generation_timestamp).toBeDefined();

    // Step 3: レポート集計データが正確に計算されていることを検証
    expect(generatedReport.report_data).toBeDefined();
    expect(generatedReport.report_data.total_revenue).toBe(expectedTotalRevenue);
    expect(generatedReport.report_data.total_deals).toBe(expectedTotalDeals);
    expect(generatedReport.report_data.closed_deals).toBe(expectedClosedDeals);
    expect(generatedReport.report_data.closing_rate).toBe(expectedClosingRate);

    // Step 4: レポート形式が正確に整形されていることを検証
    expect(generatedReport.report_format).toBe('standard');
    expect(generatedReport.report_items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ item_id: 'item-001', item_name: '売上金額', display_order: 1 }),
        expect.objectContaining({ item_id: 'item-002', item_name: '案件数', display_order: 2 }),
        expect.objectContaining({ item_id: 'item-003', item_name: '成約率', display_order: 3 }),
      ])
    );

    // Step 5: データ品質検証を実行
    const validationResult = validateReportData({
      report_id: generatedReport.report_id,
      report_data: generatedReport.report_data,
      template_items: generatedReport.report_items,
    });

    // Step 6: 検証結果が合格であることを確認
    expect(validationResult).toBeDefined();
    expect(validationResult.validation_status).toBe('passed');
    expect(validationResult.has_errors).toBe(false);
    expect(validationResult.error_count).toBe(0);

    // Step 7: レポートのエクスポート機能を実行（PDF形式）
    const exportResultPdf = exportReportToFormat({
      report_id: generatedReport.report_id,
      report_data: generatedReport.report_data,
      export_format: 'pdf',
      file_encoding: 'utf-8',
    });

    // Step 8: PDF エクスポート結果が成功することを検証
    expect(exportResultPdf).toBeDefined();
    expect(exportResultPdf.export_status).toBe('success');
    expect(exportResultPdf.export_format).toBe('pdf');
    expect(exportResultPdf.file_name).toMatch(/report.*\.pdf$/);
    expect(exportResultPdf.file_size).toBeGreaterThan(0);
    expect(exportResultPdf.download_url).toBeDefined();

    // Step 9: レポートのエクスポート機能を実行（Excel形式）
    const exportResultExcel = exportReportToFormat({
      report_id: generatedReport.report_id,
      report_data: generatedReport.report_data,
      export_format: 'excel',
      file_encoding: 'utf-8',
    });

    // Step 10: Excel エクスポート結果が成功することを検証
    expect(exportResultExcel).toBeDefined();
    expect(exportResultExcel.export_status).toBe('success');
    expect(exportResultExcel.export_format).toBe('excel');
    expect(exportResultExcel.file_name).toMatch(/report.*\.xlsx$/);
    expect(exportResultExcel.file_size).toBeGreaterThan(0);
    expect(exportResultExcel.download_url).toBeDefined();

    // Step 11: 生成レポートが複数顧客・複数サービスの集計に対応していることを検証
    expect(generatedReport.customer_service_breakdown).toBeDefined();
    expect(generatedReport.customer_service_breakdown.length).toBeGreaterThan(0);
    expect(generatedReport.customer_service_breakdown).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          customer_id: expect.any(String),
          service_id: expect.any(String),
          revenue_by_item: expect.any(Number),
          deal_count_by_item: expect.any(Number),
        }),
      ])
    );

    // Step 12: レポート生成完了の最終確認
    expect(generatedReport.report_status).toBe('ready_for_export');
    expect(generatedReport.is_exportable).toBe(true);
  });
});