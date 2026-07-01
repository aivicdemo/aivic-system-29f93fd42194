import { generateMonthlySummary } from '../../src/logic/it-1-br-1781935279444-1-2-1';

describe('月次サマリーテンプレートの定義・管理機能', () => {
  // SCEN-613: [normal] 月次サマリー自動生成 - テンプレート定義に基づき月次サマリーが正確に自動生成される
  test('月次サマリー自動生成 - テンプレート定義に基づき月次サマリーが正確に自動生成される', () => {
    // テンプレート定義 - 売上・件数・平均値を含む基本テンプレート
    const template_001_def = {
      template_id: 'TMO_001',
      template_name: '基本月次サマリー',
      format_type: 'JSON',
      items: [
        {
          item_id: 'ITEM_001',
          item_name: '合計売上',
          field_name: 'total_sales',
          calculation_logic: 'SUM',
          decimal_places: 2,
          unit: 'JPY',
          display_order: 1,
        },
        {
          item_id: 'ITEM_002',
          item_name: '件数',
          field_name: 'transaction_count',
          calculation_logic: 'COUNT',
          decimal_places: 0,
          unit: 'count',
          display_order: 2,
        },
        {
          item_id: 'ITEM_003',
          item_name: '平均売上',
          field_name: 'average_sales',
          calculation_logic: 'AVERAGE',
          decimal_places: 2,
          unit: 'JPY',
          display_order: 3,
        },
        {
          item_id: 'ITEM_004',
          item_name: '顧客数',
          field_name: 'customer_count',
          calculation_logic: 'DISTINCT_COUNT',
          decimal_places: 0,
          unit: 'count',
          display_order: 4,
        },
      ],
      version: '1.0',
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
    };

    // テンプレート定義 - 詳細集計テンプレート（サービス別・顧客別）
    const template_002_def = {
      template_id: 'TMO_002',
      template_name: 'サービス別詳細サマリー',
      format_type: 'JSON',
      items: [
        {
          item_id: 'ITEM_101',
          item_name: 'サービスA売上',
          field_name: 'service_a_sales',
          calculation_logic: 'SUM_WITH_FILTER',
          filter_field: 'service_type',
          filter_value: 'ServiceA',
          decimal_places: 2,
          unit: 'JPY',
          display_order: 1,
        },
        {
          item_id: 'ITEM_102',
          item_name: 'サービスB売上',
          field_name: 'service_b_sales',
          calculation_logic: 'SUM_WITH_FILTER',
          filter_field: 'service_type',
          filter_value: 'ServiceB',
          decimal_places: 2,
          unit: 'JPY',
          display_order: 2,
        },
        {
          item_id: 'ITEM_103',
          item_name: 'サービスA件数',
          field_name: 'service_a_count',
          calculation_logic: 'COUNT_WITH_FILTER',
          filter_field: 'service_type',
          filter_value: 'ServiceA',
          decimal_places: 0,
          unit: 'count',
          display_order: 3,
        },
      ],
      version: '1.0',
      created_at: '2024-01-15T00:00:00Z',
      updated_at: '2024-01-15T00:00:00Z',
    };

    // 営業データセット 1（基本テンプレート用）
    const monthly_data_2024_01 = [
      {
        transaction_id: 'TXN_001',
        customer_id: 'CUST_001',
        service_type: 'ServiceA',
        sales_amount: 100000.50,
        transaction_date: '2024-01-10T10:00:00Z',
      },
      {
        transaction_id: 'TXN_002',
        customer_id: 'CUST_002',
        service_type: 'ServiceB',
        sales_amount: 250000.75,
        transaction_date: '2024-01-15T14:30:00Z',
      },
      {
        transaction_id: 'TXN_003',
        customer_id: 'CUST_001',
        service_type: 'ServiceA',
        sales_amount: 150000.25,
        transaction_date: '2024-01-20T09:15:00Z',
      },
      {
        transaction_id: 'TXN_004',
        customer_id: 'CUST_003',
        service_type: 'ServiceB',
        sales_amount: 300000.00,
        transaction_date: '2024-01-25T11:45:00Z',
      },
    ];

    // 月次サマリー自動生成実行 - テンプレート 001 用
    const result_001 = generateMonthlySummary({
      template_id: 'TMO_001',
      target_month: '2024-01',
      data: monthly_data_2024_01,
      template_definition: template_001_def,
    });

    // 期待値の計算
    // 合計売上: 100000.50 + 250000.75 + 150000.25 + 300000.00 = 800001.50
    // 件数: 4
    // 平均売上: 800001.50 / 4 = 200000.375 → 200000.38 (四捨五入)
    // 顧客数: CUST_001, CUST_002, CUST_003 = 3

    // テンプレート 001 出力フォーマット検証
    expect(result_001).toEqual({
      summary_id: expect.any(String),
      template_id: 'TMO_001',
      target_month: '2024-01',
      format_type: 'JSON',
      generated_at: expect.any(String),
      data: {
        total_sales: 800001.50,
        transaction_count: 4,
        average_sales: 200000.38,
        customer_count: 3,
      },
    });

    // テンプレート 001 個別項目検証
    expect(result_001.data.total_sales).toBe(800001.50);
    expect(result_001.data.transaction_count).toBe(4);
    expect(result_001.data.average_sales).toBe(200000.38);
    expect(result_001.data.customer_count).toBe(3);

    // テンプレート 001 データ型検証
    expect(typeof result_001.data.total_sales).toBe('number');
    expect(typeof result_001.data.transaction_count).toBe('number');
    expect(typeof result_001.data.average_sales).toBe('number');
    expect(typeof result_001.data.customer_count).toBe('number');

    // テンプレート 001 小数桁数検証
    expect(result_001.data.total_sales.toString().split('.')[1].length).toBeLessThanOrEqual(2);
    expect(result_001.data.average_sales.toString().split('.')[1].length).toBeLessThanOrEqual(2);

    // 月次サマリー自動生成実行 - テンプレート 002 用（サービス別詳細）
    const result_002 = generateMonthlySummary({
      template_id: 'TMO_002',
      target_month: '2024-01',
      data: monthly_data_2024_01,
      template_definition: template_002_def,
    });

    // 期待値の計算（テンプレート 002）
    // サービスA売上: 100000.50 + 150000.25 = 250000.75
    // サービスB売上: 250000.75 + 300000.00 = 550000.75
    // サービスA件数: 2

    // テンプレート 002 出力フォーマット検証
    expect(result_002).toEqual({
      summary_id: expect.any(String),
      template_id: 'TMO_002',
      target_month: '2024-01',
      format_type: 'JSON',
      generated_at: expect.any(String),
      data: {
        service_a_sales: 250000.75,
        service_b_sales: 550000.75,
        service_a_count: 2,
      },
    });

    // テンプレート 002 個別項目検証
    expect(result_002.data.service_a_sales).toBe(250000.75);
    expect(result_002.data.service_b_sales).toBe(550000.75);
    expect(result_002.data.service_a_count).toBe(2);

    // テンプレート 002 データ型検証
    expect(typeof result_002.data.service_a_sales).toBe('number');
    expect(typeof result_002.data.service_b_sales).toBe('number');
    expect(typeof result_002.data.service_a_count).toBe('number');

    // テンプレート 002 小数桁数検証
    expect(result_002.data.service_a_sales.toString().split('.')[1].length).toBeLessThanOrEqual(2);
    expect(result_002.data.service_b_sales.toString().split('.')[1].length).toBeLessThanOrEqual(2);

    // 生成されたサマリーメタデータ検証
    expect(result_001.template_id).toBe('TMO_001');
    expect(result_001.target_month).toBe('2024-01');
    expect(result_001.format_type).toBe('JSON');
    expect(result_001.generated_at).toBeDefined();

    expect(result_002.template_id).toBe('TMO_002');
    expect(result_002.target_month).toBe('2024-01');
    expect(result_002.format_type).toBe('JSON');
    expect(result_002.generated_at).toBeDefined();

    // テンプレート 001 で全項目が含まれているか検証
    const template_001_items = template_001_def.items.map((item) => item.field_name);
    template_001_items.forEach((field_name) => {
      expect(result_001.data).toHaveProperty(field_name);
    });

    // テンプレート 002 で全項目が含まれているか検証
    const template_002_items = template_002_def.items.map((item) => item.field_name);
    template_002_items.forEach((field_name) => {
      expect(result_002.data).toHaveProperty(field_name);
    });

    // テンプレート 001 で不要な項目が含まれていないか検証
    expect(Object.keys(result_001.data).length).toBe(template_001_items.length);

    // テンプレート 002 で不要な項目が含まれていないか検証
    expect(Object.keys(result_002.data).length).toBe(template_002_items.length);

    // 複数テンプレート出力の独立性検証（テンプレート 002 出力が 001 の項目を持たないこと）
    expect(result_002.data).not.toHaveProperty('transaction_count');
    expect(result_002.data).not.toHaveProperty('average_sales');

    // 複数テンプレート出力の独立性検証（テンプレート 001 出力が 002 の項目を持たないこと）
    expect(result_001.data).not.toHaveProperty('service_a_sales');
    expect(result_001.data).not.toHaveProperty('service_b_sales');
  });
});