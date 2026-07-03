import { mapSalesDataToMonthlySummary } from '../../src/logic/it-1-br-1781935279444-1-2-1';

describe('月次サマリーテンプレートの定義・管理機能', () => {
  // SCEN-1121: [normal] 営業データから月次サマリーへの自動マッピング
  test('営業データ項目が月次サマリーテンプレート定義に従って正確にマッピングされること', () => {
    // 正常値パターンのテスト
    const normal_sales_data = {
      sales_amount: 1500000,
      transaction_count: 25,
      customer_count: 8,
      service_type: 'premium',
      commission_rate: 0.15,
      discount_applied: 150000,
      net_amount: 1350000,
      reporting_period: '2024-01-01T00:00:00Z',
      created_by: 'user_001',
    };

    const normal_template_definition = {
      template_id: 'tpl_monthly_001',
      template_name: 'Monthly Summary Standard',
      field_mappings: [
        { source_field: 'sales_amount', target_field: 'gross_revenue', data_type: 'number', format_rule: 'round2' },
        { source_field: 'transaction_count', target_field: 'transaction_volume', data_type: 'integer', format_rule: 'none' },
        { source_field: 'customer_count', target_field: 'customer_base', data_type: 'integer', format_rule: 'none' },
        { source_field: 'service_type', target_field: 'service_category', data_type: 'string', format_rule: 'uppercase' },
        { source_field: 'commission_rate', target_field: 'commission_percentage', data_type: 'number', format_rule: 'percent2' },
        { source_field: 'discount_applied', target_field: 'total_discount', data_type: 'number', format_rule: 'round2' },
        { source_field: 'net_amount', target_field: 'net_revenue', data_type: 'number', format_rule: 'round2' },
        { source_field: 'reporting_period', target_field: 'report_date', data_type: 'string', format_rule: 'iso8601' },
      ],
      created_date: '2024-01-01T00:00:00Z',
      last_modified_date: '2024-01-01T00:00:00Z',
    };

    const normal_result = mapSalesDataToMonthlySummary(normal_sales_data, normal_template_definition);

    expect(normal_result.gross_revenue).toBe(1500000);
    expect(normal_result.transaction_volume).toBe(25);
    expect(normal_result.customer_base).toBe(8);
    expect(normal_result.service_category).toBe('PREMIUM');
    expect(normal_result.commission_percentage).toBe('15.00%');
    expect(normal_result.total_discount).toBe(150000);
    expect(normal_result.net_revenue).toBe(1350000);
    expect(normal_result.report_date).toBe('2024-01-01T00:00:00Z');
    expect(Object.keys(normal_result)).toHaveLength(8);
    expect(Object.keys(normal_result)).toEqual([
      'gross_revenue',
      'transaction_volume',
      'customer_base',
      'service_category',
      'commission_percentage',
      'total_discount',
      'net_revenue',
      'report_date',
    ]);

    // 境界値パターンのテスト
    const boundary_sales_data = {
      sales_amount: 0,
      transaction_count: 1,
      customer_count: 0,
      service_type: 'standard',
      commission_rate: 0.0,
      discount_applied: 0,
      net_amount: 0,
      reporting_period: '2024-12-31T23:59:59Z',
      created_by: 'user_002',
    };

    const boundary_result = mapSalesDataToMonthlySummary(boundary_sales_data, normal_template_definition);

    expect(boundary_result.gross_revenue).toBe(0);
    expect(boundary_result.transaction_volume).toBe(1);
    expect(boundary_result.customer_base).toBe(0);
    expect(boundary_result.service_category).toBe('STANDARD');
    expect(boundary_result.commission_percentage).toBe('0.00%');
    expect(boundary_result.total_discount).toBe(0);
    expect(boundary_result.net_revenue).toBe(0);
    expect(boundary_result.report_date).toBe('2024-12-31T23:59:59Z');

    // 異常値パターンのテスト（大規模データ）
    const large_sales_data = {
      sales_amount: 999999999.99,
      transaction_count: 100000,
      customer_count: 50000,
      service_type: 'enterprise',
      commission_rate: 0.25,
      discount_applied: 99999999.99,
      net_amount: 900000000.0,
      reporting_period: '2024-06-15T12:30:45Z',
      created_by: 'user_003',
    };

    const large_result = mapSalesDataToMonthlySummary(large_sales_data, normal_template_definition);

    expect(large_result.gross_revenue).toBe(999999999.99);
    expect(large_result.transaction_volume).toBe(100000);
    expect(large_result.customer_base).toBe(50000);
    expect(large_result.service_category).toBe('ENTERPRISE');
    expect(large_result.commission_percentage).toBe('25.00%');
    expect(large_result.total_discount).toBe(99999999.99);
    expect(large_result.net_revenue).toBe(900000000.0);
    expect(large_result.report_date).toBe('2024-06-15T12:30:45Z');

    // 出力形式の検証
    expect(typeof normal_result.gross_revenue).toBe('number');
    expect(typeof normal_result.transaction_volume).toBe('number');
    expect(typeof normal_result.customer_base).toBe('number');
    expect(typeof normal_result.service_category).toBe('string');
    expect(typeof normal_result.commission_percentage).toBe('string');
    expect(typeof normal_result.total_discount).toBe('number');
    expect(typeof normal_result.net_revenue).toBe('number');
    expect(typeof normal_result.report_date).toBe('string');

    // テンプレート定義の全フィールドがマッピング結果に含まれていることを検証
    const expected_field_count = normal_template_definition.field_mappings.length;
    expect(Object.keys(normal_result)).toHaveLength(expected_field_count);
  });
});