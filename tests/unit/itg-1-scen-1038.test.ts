import { generateMonthlySummaryReport } from '../../src/logic/it-1-br-1781935279444-1-2-1';

describe('月次サマリーテンプレートの定義・管理機能', () => {
  test('SCEN-1038: 営業データが空の状態で空のレポートが生成される', () => {
    const targetMonth = '2024-01';
    const generatedAt = new Date('2024-02-01T09:00:00Z');

    const result = generateMonthlySummaryReport({
      targetMonth,
      generatedAt,
      salesData: [],
      templateId: 'tmpl_001',
    });

    expect(result).toEqual({
      reportId: expect.any(String),
      targetMonth: '2024-01',
      generatedAt: new Date('2024-02-01T09:00:00Z'),
      headers: [
        'customer_name',
        'service_type',
        'appointment_count',
        'contract_count',
        'total_amount',
        'status',
      ],
      dataRows: [],
      aggregates: {
        totalRecords: 0,
        totalAmount: 0,
        totalAppointments: 0,
        totalContracts: 0,
        averageAmount: 'NA',
      },
      metadata: {
        period_start: '2024-01-01',
        period_end: '2024-01-31',
        generation_timestamp: new Date('2024-02-01T09:00:00Z'),
        data_row_count: 0,
        status: 'completed',
      },
    });

    expect(result.headers).toHaveLength(6);
    expect(result.dataRows).toHaveLength(0);
    expect(result.aggregates.totalRecords).toBe(0);
    expect(result.aggregates.totalAmount).toBe(0);
    expect(result.aggregates.totalAppointments).toBe(0);
    expect(result.aggregates.totalContracts).toBe(0);
    expect(result.aggregates.averageAmount).toBe('NA');
    expect(result.metadata.data_row_count).toBe(0);
    expect(result.metadata.status).toBe('completed');
  });
});