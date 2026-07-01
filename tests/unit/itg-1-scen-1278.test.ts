import { extractAndAggregateByCustomerService } from '../../src/logic/it-1-2-1';

describe('営業成果データから請求対象項目を自動抽出し、顧客ごと・サービスごとの請求額を集計する機能', () => {
  // SCEN-1278: [edge] 請求対象項目の自動抽出・顧客別サービス別請求額集計 - 複数顧客・複数サービスの営業データから各々の請求額を正確に集計・分離できる
  test('複数顧客・複数サービスの営業データから顧客別・サービス別請求額を正確に抽出・集計・分離', () => {
    const sales_data = [
      {
        customer_id: 'C001',
        customer_name: 'A社',
        service_id: 'S001',
        service_name: 'サービス1',
        quantity: 100,
        unit_price: 1000,
        discount_rate: 0.1,
        is_billable: true,
      },
      {
        customer_id: 'C001',
        customer_name: 'A社',
        service_id: 'S002',
        service_name: 'サービス2',
        quantity: 50,
        unit_price: 2000,
        discount_rate: 0.05,
        is_billable: true,
      },
      {
        customer_id: 'C002',
        customer_name: 'B社',
        service_id: 'S001',
        service_name: 'サービス1',
        quantity: 200,
        unit_price: 1000,
        discount_rate: 0.15,
        is_billable: true,
      },
      {
        customer_id: 'C002',
        customer_name: 'B社',
        service_id: 'S003',
        service_name: 'サービス3',
        quantity: 30,
        unit_price: 3000,
        discount_rate: 0.0,
        is_billable: true,
      },
      {
        customer_id: 'C003',
        customer_name: 'C社',
        service_id: 'S002',
        service_name: 'サービス2',
        quantity: 75,
        unit_price: 2000,
        discount_rate: 0.2,
        is_billable: true,
      },
      {
        customer_id: 'C003',
        customer_name: 'C社',
        service_id: 'S003',
        service_name: 'サービス3',
        quantity: 0,
        unit_price: 3000,
        discount_rate: 0.0,
        is_billable: true,
      },
      {
        customer_id: 'C001',
        customer_name: 'A社',
        service_id: 'S003',
        service_name: 'サービス3',
        quantity: 10,
        unit_price: 3000,
        discount_rate: -0.05,
        is_billable: true,
      },
      {
        customer_id: 'C002',
        customer_name: 'B社',
        service_id: 'S002',
        service_name: 'サービス2',
        quantity: 25.5,
        unit_price: 2000.5,
        discount_rate: 0.08,
        is_billable: true,
      },
    ];

    const result = extractAndAggregateByCustomerService(sales_data);

    // A社（C001）のサービス1: 100 * 1000 * (1 - 0.1) = 90,000
    expect(result.by_customer_service['C001_S001'].billing_amount).toBe(90000);

    // A社（C001）のサービス2: 50 * 2000 * (1 - 0.05) = 95,000
    expect(result.by_customer_service['C001_S002'].billing_amount).toBe(95000);

    // B社（C002）のサービス1: 200 * 1000 * (1 - 0.15) = 170,000
    expect(result.by_customer_service['C002_S001'].billing_amount).toBe(170000);

    // B社（C002）のサービス3: 30 * 3000 * (1 - 0.0) = 90,000
    expect(result.by_customer_service['C002_S003'].billing_amount).toBe(90000);

    // C社（C003）のサービス2: 75 * 2000 * (1 - 0.2) = 120,000
    expect(result.by_customer_service['C003_S002'].billing_amount).toBe(120000);

    // C社（C003）のサービス3（0円請求）: 0 * 3000 * (1 - 0.0) = 0
    expect(result.by_customer_service['C003_S003'].billing_amount).toBe(0);

    // A社（C001）のサービス3（負の調整額）: 10 * 3000 * (1 - (-0.05)) = 10 * 3000 * 1.05 = 31,500
    expect(result.by_customer_service['C001_S003'].billing_amount).toBe(31500);

    // B社（C002）のサービス2（小数点以下の金額）: 25.5 * 2000.5 * (1 - 0.08) = 47,002.46
    expect(result.by_customer_service['C002_S002'].billing_amount).toBeCloseTo(47002.46, 2);

    // 顧客別合計：A社（C001） = 90,000 + 95,000 + 31,500 = 216,500
    expect(result.by_customer['C001'].total_billing_amount).toBe(216500);

    // 顧客別合計：B社（C002） = 170,000 + 90,000 + 47,002.46 = 307,002.46
    expect(result.by_customer['C002'].total_billing_amount).toBeCloseTo(307002.46, 2);

    // 顧客別合計：C社（C003） = 120,000 + 0 = 120,000
    expect(result.by_customer['C003'].total_billing_amount).toBe(120000);

    // サービス別合計：サービス1（S001） = 90,000 + 170,000 = 260,000
    expect(result.by_service['S001'].total_billing_amount).toBe(260000);

    // サービス別合計：サービス2（S002） = 95,000 + 120,000 + 47,002.46 = 262,002.46
    expect(result.by_service['S002'].total_billing_amount).toBeCloseTo(262002.46, 2);

    // サービス別合計：サービス3（S003） = 31,500 + 90,000 + 0 = 121,500
    expect(result.by_service['S003'].total_billing_amount).toBe(121500);

    // 全体合計 = 216,500 + 307,002.46 + 120,000 = 643,502.46
    expect(result.grand_total).toBeCloseTo(643502.46, 2);

    // 抽出されたデータが顧客別・サービス別に正確に分類されていることを検証
    expect(result.by_customer_service['C001_S001'].customer_id).toBe('C001');
    expect(result.by_customer_service['C001_S001'].service_id).toBe('S001');
    expect(result.by_customer_service['C001_S001'].customer_name).toBe('A社');
    expect(result.by_customer_service['C001_S001'].service_name).toBe('サービス1');

    // 同一顧客の異なるサービス間で請求額が正確に分離されていることを確認
    expect(result.by_customer_service['C001_S001'].billing_amount).not.toBe(
      result.by_customer_service['C001_S002'].billing_amount
    );
    expect(result.by_customer_service['C001_S002'].billing_amount).not.toBe(
      result.by_customer_service['C001_S003'].billing_amount
    );

    // 同一サービスの異なる顧客間で請求額が正確に分離されていることを確認
    expect(result.by_customer_service['C001_S001'].billing_amount).not.toBe(
      result.by_customer_service['C002_S001'].billing_amount
    );

    // 各顧客のサービス数が正確であることを確認
    const c001_services = Object.keys(result.by_customer_service).filter((key) =>
      key.startsWith('C001_')
    );
    expect(c001_services.length).toBe(3);

    const c002_services = Object.keys(result.by_customer_service).filter((key) =>
      key.startsWith('C002_')
    );
    expect(c002_services.length).toBe(3);

    const c003_services = Object.keys(result.by_customer_service).filter((key) =>
      key.startsWith('C003_')
    );
    expect(c003_services.length).toBe(2);

    // 各サービスの顧客数が正確であることを確認
    const s001_customers = Object.keys(result.by_customer_service).filter((key) =>
      key.endsWith('_S001')
    );
    expect(s001_customers.length).toBe(2);

    const s002_customers = Object.keys(result.by_customer_service).filter((key) =>
      key.endsWith('_S002')
    );
    expect(s002_customers.length).toBe(3);

    const s003_customers = Object.keys(result.by_customer_service).filter((key) =>
      key.endsWith('_S003')
    );
    expect(s003_customers.length).toBe(3);

    // 手動計算による期待値と集計結果を突合せる - すべての計算が合致すること
    expect(result.by_customer_service).toBeDefined();
    expect(result.by_customer).toBeDefined();
    expect(result.by_service).toBeDefined();

    // is_billable フラグが true のものだけが含まれていることを確認
    const all_keys = Object.keys(result.by_customer_service);
    expect(all_keys.length).toBe(8);

    // 請求額がすべて 0 以上であることを確認（マイナスにならない）
    Object.values(result.by_customer_service).forEach((item) => {
      expect(item.billing_amount).toBeGreaterThanOrEqual(0);
    });

    // 顧客別の合計が、その顧客に属するすべてのサービス別請求額の合計と一致することを確認
    const calculated_c001_total = Object.keys(result.by_customer_service)
      .filter((key) => key.startsWith('C001_'))
      .reduce((sum, key) => sum + result.by_customer_service[key].billing_amount, 0);
    expect(result.by_customer['C001'].total_billing_amount).toBeCloseTo(calculated_c001_total, 2);

    const calculated_c002_total = Object.keys(result.by_customer_service)
      .filter((key) => key.startsWith('C002_'))
      .reduce((sum, key) => sum + result.by_customer_service[key].billing_amount, 0);
    expect(result.by_customer['C002'].total_billing_amount).toBeCloseTo(calculated_c002_total, 2);

    const calculated_c003_total = Object.keys(result.by_customer_service)
      .filter((key) => key.startsWith('C003_'))
      .reduce((sum, key) => sum + result.by_customer_service[key].billing_amount, 0);
    expect(result.by_customer['C003'].total_billing_amount).toBeCloseTo(calculated_c003_total, 2);

    // サービス別の合計が、そのサービスに属するすべての顧客別請求額の合計と一致することを確認
    const calculated_s001_total = Object.keys(result.by_customer_service)
      .filter((key) => key.endsWith('_S001'))
      .reduce((sum, key) => sum + result.by_customer_service[key].billing_amount, 0);
    expect(result.by_service['S001'].total_billing_amount).toBeCloseTo(calculated_s001_total, 2);

    const calculated_s002_total = Object.keys(result.by_customer_service)
      .filter((key) => key.endsWith('_S002'))
      .reduce((sum, key) => sum + result.by_customer_service[key].billing_amount, 0);
    expect(result.by_service['S002'].total_billing_amount).toBeCloseTo(calculated_s002_total, 2);

    const calculated_s003_total = Object.keys(result.by_customer_service)
      .filter((key) => key.endsWith('_S003'))
      .reduce((sum, key) => sum + result.by_customer_service[key].billing_amount, 0);
    expect(result.by_service['S003'].total_billing_amount).toBeCloseTo(calculated_s003_total, 2);

    // 全体合計が、すべての顧客別合計の合計と一致することを確認
    const calculated_grand_total_from_customer = Object.values(result.by_customer).reduce(
      (sum, customer) => sum + customer.total_billing_amount,
      0
    );
    expect(result.grand_total).toBeCloseTo(calculated_grand_total_from_customer, 2);

    // 全体合計が、すべてのサービス別合計の合計と一致することを確認
    const calculated_grand_total_from_service = Object.values(result.by_service).reduce(
      (sum, service) => sum + service.total_billing_amount,
      0
    );
    expect(result.grand_total).toBeCloseTo(calculated_grand_total_from_service, 2);
  });
});