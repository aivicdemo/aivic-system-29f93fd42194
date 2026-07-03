import {
  calculateReportLineItems,
} from '../../src/logic/it-1-br-1781935279444-1-2-1';

describe('月次サマリーテンプレートの定義・管理機能', () => {
  // SCEN-609: [normal] 請求書・成果レポート自動生成機能 - テンプレートの計算ロジック・レポートマッピング定義に基づきレポート内容が正確に生成される
  test('should generate accurate report with correct calculations based on template logic and mapping definitions', () => {
    // Setup: 顧客情報、売上データ、手数料マスタの事前登録
    const templateDefinition = {
      template_id: 'TMPL_STD_001',
      template_name: '標準請求書テンプレート',
      calculation_logic: {
        commission: 'sales_amount * commission_rate',
        consumption_tax: '(sales_amount + commission) * 0.10',
        total_amount: 'sales_amount + commission + consumption_tax',
      },
      report_mapping: {
        sales_amount_field: 'revenue',
        commission_field: 'fee',
        consumption_tax_field: 'tax',
        total_amount_field: 'grand_total',
      },
    };

    const commission_rate_master = {
      standard: 0.08,
      premium: 0.05,
      enterprise: 0.03,
    };

    // Test Pattern 1: 少額取引（売上額: 100,000円、標準手数料率 8%）
    const small_transaction_input = {
      sales_amount: 100000,
      commission_rate: commission_rate_master.standard,
      period_start: '2024-01-01',
      period_end: '2024-01-31',
      customer_id: 'CUST_001',
      template_id: 'TMPL_STD_001',
    };

    const small_transaction_result = calculateReportLineItems(
      small_transaction_input
    );

    // 期待値の計算：
    // 手数料 = 100,000 × 0.08 = 8,000
    // 消費税 = (100,000 + 8,000) × 0.10 = 10,800
    // 合計額 = 100,000 + 8,000 + 10,800 = 118,800
    expect(small_transaction_result.sales_amount).toBe(100000);
    expect(small_transaction_result.commission).toBe(8000);
    expect(small_transaction_result.consumption_tax).toBe(10800);
    expect(small_transaction_result.total_amount).toBe(118800);
    expect(small_transaction_result.template_id).toBe('TMPL_STD_001');
    expect(small_transaction_result.customer_id).toBe('CUST_001');

    // Test Pattern 2: 高額取引（売上額: 1,000,000円、プレミアム手数料率 5%）
    const high_transaction_input = {
      sales_amount: 1000000,
      commission_rate: commission_rate_master.premium,
      period_start: '2024-01-01',
      period_end: '2024-01-31',
      customer_id: 'CUST_002',
      template_id: 'TMPL_STD_001',
    };

    const high_transaction_result = calculateReportLineItems(
      high_transaction_input
    );

    // 期待値の計算：
    // 手数料 = 1,000,000 × 0.05 = 50,000
    // 消費税 = (1,000,000 + 50,000) × 0.10 = 105,000
    // 合計額 = 1,000,000 + 50,000 + 105,000 = 1,155,000
    expect(high_transaction_result.sales_amount).toBe(1000000);
    expect(high_transaction_result.commission).toBe(50000);
    expect(high_transaction_result.consumption_tax).toBe(105000);
    expect(high_transaction_result.total_amount).toBe(1155000);

    // Test Pattern 3: 複数取引集計（複数取引の合計売上: 500,000円、エンタープライズ手数料率 3%）
    const multiple_transaction_input = {
      sales_amount: 500000,
      commission_rate: commission_rate_master.enterprise,
      period_start: '2024-01-01',
      period_end: '2024-01-31',
      customer_id: 'CUST_003',
      template_id: 'TMPL_STD_001',
    };

    const multiple_transaction_result = calculateReportLineItems(
      multiple_transaction_input
    );

    // 期待値の計算：
    // 手数料 = 500,000 × 0.03 = 15,000
    // 消費税 = (500,000 + 15,000) × 0.10 = 51,500
    // 合計額 = 500,000 + 15,000 + 51,500 = 566,500
    expect(multiple_transaction_result.sales_amount).toBe(500000);
    expect(multiple_transaction_result.commission).toBe(15000);
    expect(multiple_transaction_result.consumption_tax).toBe(51500);
    expect(multiple_transaction_result.total_amount).toBe(566500);

    // Test Pattern 4: 手数料率変更後の再生成（売上額: 100,000円、手数料率を8%から5%に変更）
    const modified_rate_input = {
      sales_amount: 100000,
      commission_rate: 0.05,
      period_start: '2024-02-01',
      period_end: '2024-02-29',
      customer_id: 'CUST_001',
      template_id: 'TMPL_STD_001',
    };

    const modified_rate_result = calculateReportLineItems(
      modified_rate_input
    );

    // 期待値の計算：
    // 手数料 = 100,000 × 0.05 = 5,000
    // 消費税 = (100,000 + 5,000) × 0.10 = 10,500
    // 合計額 = 100,000 + 5,000 + 10,500 = 115,500
    expect(modified_rate_result.sales_amount).toBe(100000);
    expect(modified_rate_result.commission).toBe(5000);
    expect(modified_rate_result.consumption_tax).toBe(10500);
    expect(modified_rate_result.total_amount).toBe(115500);

    // Verify: レポートマッピング定義に基づくフィールド名の正確性
    expect(modified_rate_result).toHaveProperty('sales_amount');
    expect(modified_rate_result).toHaveProperty('commission');
    expect(modified_rate_result).toHaveProperty('consumption_tax');
    expect(modified_rate_result).toHaveProperty('total_amount');

    // Verify: テンプレートメタデータが正確に保持されている
    expect(modified_rate_result.template_id).toBe('TMPL_STD_001');
    expect(modified_rate_result.period_start).toBe('2024-02-01');
    expect(modified_rate_result.period_end).toBe('2024-02-29');
  });
});