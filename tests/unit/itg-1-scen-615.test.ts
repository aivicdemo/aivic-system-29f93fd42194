import { generateMonthlySummary } from '../../src/logic/it-1-br-1781935279444-1-2-1';

describe('月次サマリーテンプレートの定義・管理機能', () => {
  // SCEN-615: [error] 月次サマリー自動生成 - テンプレート定義が欠落している場合にサマリー生成が失敗する
  test('テンプレート定義が欠落している場合、サマリー生成が失敗しエラーメッセージが表示される', () => {
    const input_monthly_summary_data = {
      period_start_date: new Date('2024-01-01'),
      period_end_date: new Date('2024-01-31'),
      total_sales_amount: 1500000,
      total_deals_count: 25,
      customer_count: 8,
      service_breakdown: [
        {
          service_id: 'SVC001',
          service_name: 'Basic Plan',
          sales_amount: 900000,
          deal_count: 15,
        },
        {
          service_id: 'SVC002',
          service_name: 'Premium Plan',
          sales_amount: 600000,
          deal_count: 10,
        },
      ],
      quality_check_status: 'PASSED',
      billing_confirmation_status: 'CONFIRMED',
    };

    const input_template_config = {
      template_id: null,
      template_name: null,
      template_items: [],
      is_active: false,
    };

    expect(() =>
      generateMonthlySummary(input_monthly_summary_data, input_template_config)
    ).toThrow(/テンプレート定義/);
  });
});