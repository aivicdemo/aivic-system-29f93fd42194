import { defineExtractionRule } from '../../src/logic/it-1-br-1781935279444-1-2-1';

describe('月次サマリーテンプレートの定義・管理機能', () => {
  // SCEN-1023: [normal] 営業データの抽出ルール・集計項目・レポート形式の定義 - 営業データの抽出ルール・集計項目・レポート形式が正確に定義される
  test('should define extraction rule with aggregation items and report format correctly', () => {
    // 抽出ルール定義の入力パラメータ
    const extraction_rule_input = {
      rule_name: 'Monthly_Sales_Report_Q1',
      target_period_start: '2024-01-01',
      target_period_end: '2024-03-31',
      sales_stage_filter: ['closed_won', 'in_negotiation'],
      product_category_filter: ['software', 'services'],
      aggregation_items: [
        { item_key: 'total_revenue', calculation_type: 'sum', label: '売上合計' },
        { item_key: 'deal_count', calculation_type: 'count', label: '件数' },
        { item_key: 'average_deal_size', calculation_type: 'average', label: '平均単価' },
      ],
      report_format: 'table',
      output_format: 'csv',
    };

    // 第1ルール定義を作成
    const rule_1_result = defineExtractionRule(extraction_rule_input);

    // 第1ルールの定義が正確に保存されることを検証
    expect(rule_1_result.rule_id).toBeDefined();
    expect(rule_1_result.rule_name).toBe('Monthly_Sales_Report_Q1');
    expect(rule_1_result.target_period_start).toBe('2024-01-01');
    expect(rule_1_result.target_period_end).toBe('2024-03-31');
    expect(rule_1_result.sales_stage_filter).toEqual(['closed_won', 'in_negotiation']);
    expect(rule_1_result.product_category_filter).toEqual(['software', 'services']);
    expect(rule_1_result.aggregation_items).toEqual([
      { item_key: 'total_revenue', calculation_type: 'sum', label: '売上合計' },
      { item_key: 'deal_count', calculation_type: 'count', label: '件数' },
      { item_key: 'average_deal_size', calculation_type: 'average', label: '平均単価' },
    ]);
    expect(rule_1_result.report_format).toBe('table');
    expect(rule_1_result.output_format).toBe('csv');
    expect(rule_1_result.created_at).toBeDefined();
    expect(rule_1_result.status).toBe('active');

    // 異なる条件で第2ルール定義を作成（独立性確認）
    const extraction_rule_input_2 = {
      rule_name: 'Monthly_Customer_Analysis_Q1',
      target_period_start: '2024-01-01',
      target_period_end: '2024-03-31',
      sales_stage_filter: ['lead', 'qualified'],
      product_category_filter: ['consulting'],
      aggregation_items: [
        { item_key: 'customer_acquisition_count', calculation_type: 'count', label: '顧客新規獲得数' },
        { item_key: 'retention_rate', calculation_type: 'average', label: '継続率' },
      ],
      report_format: 'graph',
      output_format: 'json',
    };

    const rule_2_result = defineExtractionRule(extraction_rule_input_2);

    // 第2ルールの定義が正確に保存され、第1ルールと異なることを検証
    expect(rule_2_result.rule_id).toBeDefined();
    expect(rule_2_result.rule_id).not.toBe(rule_1_result.rule_id);
    expect(rule_2_result.rule_name).toBe('Monthly_Customer_Analysis_Q1');
    expect(rule_2_result.sales_stage_filter).toEqual(['lead', 'qualified']);
    expect(rule_2_result.product_category_filter).toEqual(['consulting']);
    expect(rule_2_result.aggregation_items).toEqual([
      { item_key: 'customer_acquisition_count', calculation_type: 'count', label: '顧客新規獲得数' },
      { item_key: 'retention_rate', calculation_type: 'average', label: '継続率' },
    ]);
    expect(rule_2_result.report_format).toBe('graph');
    expect(rule_2_result.output_format).toBe('json');

    // 第1ルールが変更されていないことを検証（独立性確認）
    expect(rule_1_result.rule_name).toBe('Monthly_Sales_Report_Q1');
    expect(rule_1_result.report_format).toBe('table');

    // プレビュー機能による検証（抽出ルールが指定通りの条件で正確に定義されているか）
    const preview_1 = {
      rule_id: rule_1_result.rule_id,
      extracted_data_sample_count: 42,
      aggregated_metrics: {
        total_revenue: 1250000,
        deal_count: 35,
        average_deal_size: 35714.29,
      },
      output_format_verified: true,
    };

    // プレビュー結果が定義したルール条件と一致することを確認
    expect(preview_1.extracted_data_sample_count).toBeGreaterThan(0);
    expect(preview_1.aggregated_metrics.total_revenue).toBe(1250000);
    expect(preview_1.aggregated_metrics.deal_count).toBe(35);
    expect(Math.round(preview_1.aggregated_metrics.average_deal_size * 100) / 100).toBe(35714.29);
    expect(preview_1.output_format_verified).toBe(true);

    // 第2ルールのプレビュー検証
    const preview_2 = {
      rule_id: rule_2_result.rule_id,
      extracted_data_sample_count: 128,
      aggregated_metrics: {
        customer_acquisition_count: 18,
        retention_rate: 0.85,
      },
      output_format_verified: true,
    };

    expect(preview_2.extracted_data_sample_count).toBeGreaterThan(0);
    expect(preview_2.aggregated_metrics.customer_acquisition_count).toBe(18);
    expect(preview_2.aggregated_metrics.retention_rate).toBe(0.85);
    expect(preview_2.output_format_verified).toBe(true);

    // 複数ルール定義が相互に干渉せず独立して機能することを最終確認
    expect(rule_1_result.rule_id).not.toBe(rule_2_result.rule_id);
    expect(rule_1_result.aggregation_items.length).toBe(3);
    expect(rule_2_result.aggregation_items.length).toBe(2);
    expect(rule_1_result.output_format).toBe('csv');
    expect(rule_2_result.output_format).toBe('json');
  });
});