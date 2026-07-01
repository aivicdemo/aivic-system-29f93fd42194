import { describe, test, expect, beforeEach } from '@jest/globals';
import {
  aggregateMonthlySalesReport,
} from '../../src/logic/it-1-br-1781935279444-1-2-1';

describe('Monthly Sales Report Aggregation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // SCEN-916: [normal] 営業報告書月次サマリー自動集計機能 - 営業データから顧客ごと・サービスごとの成果指標が集計され、標準化レポート形式で出力される
  test('should aggregate sales data by customer and service, calculate KPIs accurately, and generate standardized report', () => {
    // Arrange: テスト用営業データ（複数顧客・複数サービス）
    const salesData = [
      {
        customer_id: 'CUST_001',
        customer_name: 'CustomerA',
        service_id: 'SVC_001',
        service_name: 'ServiceX',
        transaction_date: '2024-01-15',
        appointment_count: 5,
        contract_count: 2,
        revenue: 100000,
        response_rate: 0.85,
      },
      {
        customer_id: 'CUST_001',
        customer_name: 'CustomerA',
        service_id: 'SVC_001',
        service_name: 'ServiceX',
        transaction_date: '2024-01-20',
        appointment_count: 3,
        contract_count: 1,
        revenue: 50000,
        response_rate: 0.75,
      },
      {
        customer_id: 'CUST_001',
        customer_name: 'CustomerA',
        service_id: 'SVC_002',
        service_name: 'ServiceY',
        transaction_date: '2024-01-25',
        appointment_count: 4,
        contract_count: 1,
        revenue: 60000,
        response_rate: 0.90,
      },
      {
        customer_id: 'CUST_002',
        customer_name: 'CustomerB',
        service_id: 'SVC_001',
        service_name: 'ServiceX',
        transaction_date: '2024-01-10',
        appointment_count: 6,
        contract_count: 3,
        revenue: 120000,
        response_rate: 0.80,
      },
      {
        customer_id: 'CUST_002',
        customer_name: 'CustomerB',
        service_id: 'SVC_001',
        service_name: 'ServiceX',
        transaction_date: '2024-01-28',
        appointment_count: 2,
        contract_count: 1,
        revenue: 40000,
        response_rate: 0.70,
      },
    ];

    const aggregation_month = '2024-01';
    const output_format = 'csv';

    // Act: 集計実行
    const result = aggregateMonthlySalesReport(salesData, aggregation_month, output_format);

    // Assert: 顧客ごとの集計結果を検証
    expect(result.customer_summaries).toBeDefined();
    expect(result.customer_summaries).toHaveLength(2);

    const customer_a_data = result.customer_summaries.find(
      (c: any) => c.customer_id === 'CUST_001'
    );
    expect(customer_a_data).toBeDefined();
    expect(customer_a_data.customer_name).toBe('CustomerA');
    expect(customer_a_data.total_appointments).toBe(12); // 5+3+4
    expect(customer_a_data.total_contracts).toBe(4); // 2+1+1
    expect(customer_a_data.total_revenue).toBe(210000); // 100000+50000+60000

    const customer_b_data = result.customer_summaries.find(
      (c: any) => c.customer_id === 'CUST_002'
    );
    expect(customer_b_data).toBeDefined();
    expect(customer_b_data.customer_name).toBe('CustomerB');
    expect(customer_b_data.total_appointments).toBe(8); // 6+2
    expect(customer_b_data.total_contracts).toBe(4); // 3+1
    expect(customer_b_data.total_revenue).toBe(160000); // 120000+40000

    // Assert: サービスごとの集計結果を検証
    expect(result.service_summaries).toBeDefined();
    expect(result.service_summaries).toHaveLength(2);

    const service_x_data = result.service_summaries.find(
      (s: any) => s.service_id === 'SVC_001'
    );
    expect(service_x_data).toBeDefined();
    expect(service_x_data.service_name).toBe('ServiceX');
    expect(service_x_data.total_appointments).toBe(16); // 5+3+6+2
    expect(service_x_data.total_contracts).toBe(7); // 2+1+3+1
    expect(service_x_data.total_revenue).toBe(310000); // 100000+50000+120000+40000

    const service_y_data = result.service_summaries.find(
      (s: any) => s.service_id === 'SVC_002'
    );
    expect(service_y_data).toBeDefined();
    expect(service_y_data.service_name).toBe('ServiceY');
    expect(service_y_data.total_appointments).toBe(4);
    expect(service_y_data.total_contracts).toBe(1);
    expect(service_y_data.total_revenue).toBe(60000);

    // Assert: KPI計算の検証（成約率、平均応答率など）
    expect(customer_a_data.contract_rate).toBeCloseTo(0.333, 2); // 4/12
    expect(customer_b_data.contract_rate).toBeCloseTo(0.5, 2); // 4/8
    expect(service_x_data.contract_rate).toBeCloseTo(0.438, 2); // 7/16

    // Assert: 応答率の平均値計算（加重平均または単純平均）
    const cust_a_avg_response = (0.85 + 0.75 + 0.90) / 3;
    expect(customer_a_data.average_response_rate).toBeCloseTo(
      cust_a_avg_response,
      2
    );

    const cust_b_avg_response = (0.80 + 0.70) / 2;
    expect(customer_b_data.average_response_rate).toBeCloseTo(
      cust_b_avg_response,
      2
    );

    // Assert: 標準化フォーマット準拠の検証
    expect(result.report_metadata).toBeDefined();
    expect(result.report_metadata.report_title).toBe('Monthly Sales Report');
    expect(result.report_metadata.aggregation_month).toBe('2024-01');
    expect(result.report_metadata.generated_at).toBeDefined();
    expect(result.report_metadata.generated_by).toBe('system');
    expect(result.report_metadata.format_version).toBe('1.0');

    // Assert: ヘッダー・フッター・フォント情報
    expect(result.report_metadata.header).toBeDefined();
    expect(result.report_metadata.header.company_name).toBeDefined();
    expect(result.report_metadata.header.report_period).toBe('2024-01');

    expect(result.report_metadata.footer).toBeDefined();
    expect(result.report_metadata.footer.page_numbering).toBe(true);
    expect(result.report_metadata.footer.generated_timestamp).toBeDefined();

    expect(result.report_metadata.formatting).toBeDefined();
    expect(result.report_metadata.formatting.font_family).toBe('Arial');
    expect(result.report_metadata.formatting.font_size).toBe(11);

    // Assert: 出力形式の検証（CSV形式が指定された場合）
    expect(result.output_format).toBe('csv');
    expect(result.file_content).toBeDefined();
    expect(typeof result.file_content).toBe('string');

    // Assert: CSVコンテンツ構造の検証
    const csv_lines = result.file_content.split('\n');
    expect(csv_lines.length).toBeGreaterThan(1); // ヘッダー + データ行
    expect(csv_lines[0]).toContain('customer_id'); // ヘッダー行
    expect(csv_lines[0]).toContain('customer_name');
    expect(csv_lines[0]).toContain('total_appointments');
    expect(csv_lines[0]).toContain('total_contracts');
    expect(csv_lines[0]).toContain('total_revenue');

    // Assert: ファイルメタデータ
    expect(result.file_metadata).toBeDefined();
    expect(result.file_metadata.file_name).toMatch(/sales_report_2024-01/);
    expect(result.file_metadata.file_extension).toBe('.csv');
    expect(result.file_metadata.file_size).toBeGreaterThan(0);
    expect(result.file_metadata.mime_type).toBe('text/csv');

    // Assert: 顧客別・サービス別クロス集計の検証
    expect(result.cross_summary).toBeDefined();
    const cross_cust_a_svc_x = result.cross_summary.find(
      (cs: any) =>
        cs.customer_id === 'CUST_001' && cs.service_id === 'SVC_001'
    );
    expect(cross_cust_a_svc_x).toBeDefined();
    expect(cross_cust_a_svc_x.total_appointments).toBe(8); // 5+3
    expect(cross_cust_a_svc_x.total_contracts).toBe(3); // 2+1
    expect(cross_cust_a_svc_x.total_revenue).toBe(150000); // 100000+50000

    // Assert: データ品質フラグ
    expect(result.data_quality).toBeDefined();
    expect(result.data_quality.completeness_rate).toBe(1.0); // 100%
    expect(result.data_quality.validation_passed).toBe(true);

    // Assert: 全社計の検証
    expect(result.grand_total).toBeDefined();
    expect(result.grand_total.total_appointments).toBe(20); // 12+8
    expect(result.grand_total.total_contracts).toBe(8); // 4+4
    expect(result.grand_total.total_revenue).toBe(370000); // 210000+160000
  });
});