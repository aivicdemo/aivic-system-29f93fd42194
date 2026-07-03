import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { generateMonthlySummaryReport } from '../../src/logic/it-1-br-1781935279444-1-2-1';

describe('月次サマリーテンプレートの定義・管理機能', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // SCEN-1279
  test('品質検証完了・最終承認済みの営業データから月次サマリーレポートが定義済みテンプレートに基づき自動生成される', () => {
    // Arrange: テストデータベースに品質検証完了ステータスの営業データを準備
    const sales_data_id = 'sales_20240131001';
    const business_activity_data = {
      sales_data_id: sales_data_id,
      customer_id: 'cust_A001',
      service_id: 'svc_001',
      activity_date: '2024-01-15',
      appointment_count: 5,
      contract_count: 2,
      customer_response: 'positive',
      quality_status: 'completed_verification',
      final_approval_flag: true,
      created_at: '2024-01-20T10:00:00Z',
      updated_at: '2024-01-20T10:00:00Z',
    };

    // 月次サマリーテンプレート定義
    const monthly_summary_template = {
      template_id: 'tpl_001',
      template_name: '2024年1月月次営業成果レポート',
      fiscal_year: 2024,
      fiscal_month: 1,
      period_start_date: '2024-01-01',
      period_end_date: '2024-01-31',
      header_section: {
        title: '月次営業成果サマリー',
        company_name: '営業代行企業',
        report_date: '2024-02-01',
      },
      body_sections: [
        {
          section_id: 'sec_001',
          section_name: '顧客別成果指標',
          section_order: 1,
          items: [
            {
              item_id: 'item_001',
              item_name: '顧客名',
              item_order: 1,
              data_source_field: 'customer_id',
              calculation_logic: 'direct_mapping',
            },
            {
              item_id: 'item_002',
              item_name: 'アポ数',
              item_order: 2,
              data_source_field: 'appointment_count',
              calculation_logic: 'sum',
            },
            {
              item_id: 'item_003',
              item_name: '成約数',
              item_order: 3,
              data_source_field: 'contract_count',
              calculation_logic: 'sum',
            },
          ],
        },
        {
          section_id: 'sec_002',
          section_name: 'サービス別成果指標',
          section_order: 2,
          items: [
            {
              item_id: 'item_004',
              item_name: 'サービス名',
              item_order: 1,
              data_source_field: 'service_id',
              calculation_logic: 'direct_mapping',
            },
            {
              item_id: 'item_005',
              item_name: '顧客反応',
              item_order: 2,
              data_source_field: 'customer_response',
              calculation_logic: 'direct_mapping',
            },
          ],
        },
      ],
      footer_section: {
        footer_text: '本レポートは営業成果データの自動集計に基づいています。',
        generated_timestamp: true,
      },
      output_format: 'pdf',
      created_at: '2024-01-10T09:00:00Z',
      updated_at: '2024-01-10T09:00:00Z',
    };

    // Act: 月次サマリーレポート自動生成機能を実行
    const generated_report = generateMonthlySummaryReport({
      sales_data: business_activity_data,
      template_definition: monthly_summary_template,
      aggregation_period: {
        start_date: '2024-01-01',
        end_date: '2024-01-31',
      },
    });

    // Assert: テンプレートが正しく適用されていることを確認
    expect(generated_report).toBeDefined();
    expect(generated_report.report_id).toBeDefined();

    // レポートのヘッダーセクション確認
    expect(generated_report.header).toEqual({
      title: '月次営業成果サマリー',
      company_name: '営業代行企業',
      report_date: '2024-02-01',
      fiscal_year: 2024,
      fiscal_month: 1,
    });

    // レポートのセクション構成確認（テンプレート定義と一致）
    expect(generated_report.sections).toHaveLength(2);
    expect(generated_report.sections[0].section_name).toBe('顧客別成果指標');
    expect(generated_report.sections[0].section_order).toBe(1);
    expect(generated_report.sections[1].section_name).toBe('サービス別成果指標');
    expect(generated_report.sections[1].section_order).toBe(2);

    // 第1セクション（顧客別成果指標）のデータ反映確認
    expect(generated_report.sections[0].data).toEqual({
      customer_id: 'cust_A001',
      appointment_count: 5,
      contract_count: 2,
    });

    // 第2セクション（サービス別成果指標）のデータ反映確認
    expect(generated_report.sections[1].data).toEqual({
      service_id: 'svc_001',
      customer_response: 'positive',
    });

    // レポートのフッターセクション確認
    expect(generated_report.footer).toEqual({
      footer_text: '本レポートは営業成果データの自動集計に基づいています。',
      generated_timestamp: expect.stringMatching(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z/),
    });

    // 日付・集計期間の正確性確認
    expect(generated_report.aggregation_info).toEqual({
      period_start_date: '2024-01-01',
      period_end_date: '2024-01-31',
      fiscal_year: 2024,
      fiscal_month: 1,
      report_generation_date: '2024-02-01',
    });

    // 出力ファイル形式の確認
    expect(generated_report.output_format).toBe('pdf');
    expect(generated_report.file_name).toMatch(/^monthly_summary_report_2024_01_\d+\.pdf$/);

    // 生成されたレポートが正常なファイルサイズを持つことを確認
    expect(generated_report.file_size_bytes).toBeGreaterThan(0);

    // 品質検証ステータスと最終承認フラグが保持されていることを確認
    expect(generated_report.source_data_quality_status).toBe('completed_verification');
    expect(generated_report.source_data_final_approval).toBe(true);

    // テンプレート適用情報の確認
    expect(generated_report.template_applied).toEqual({
      template_id: 'tpl_001',
      template_name: '2024年1月月次営業成果レポート',
      applied_at: expect.stringMatching(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z/),
    });
  });
});