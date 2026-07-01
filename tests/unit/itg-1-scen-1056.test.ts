import { describe, it, expect, beforeEach } from '@jest/globals';
import { generateMonthlyReportFromTemplate } from '../../src/logic/it-1-br-1781935279444-1-2-1';

describe('月次サマリーテンプレート未定義エラーハンドリング', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // SCEN-1056
  it('レポートテンプレートが未定義の場合、エラーを返して処理が中断される', () => {
    const input_sales_data = [
      {
        customer_id: 'CUST001',
        service_id: 'SVC001',
        appointment_count: 5,
        contract_count: 2,
        customer_reaction: 'positive',
        reporting_period: '2024-01'
      }
    ];

    const input_template_id = undefined;

    const input_context = {
      user_id: 'USR001',
      execution_date: '2024-01-31T09:00:00Z',
      reporting_month: '2024-01'
    };

    expect(() =>
      generateMonthlyReportFromTemplate(
        input_sales_data,
        input_template_id,
        input_context
      )
    ).toThrow(/テンプレート/);
  });
});