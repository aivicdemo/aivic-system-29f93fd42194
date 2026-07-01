import { aggregateMonthlySalesReport } from '../../src/logic/it-1-br-1781935279444-1-2-1';

describe('月次サマリーテンプレートの定義・管理機能', () => {
  // SCEN-919: [normal] 営業報告書月次サマリー自動集計機能 - 複数の顧客・複数のサービス種別が混在したデータで、正しく分類集計される
  test('複数顧客・複数サービス種別の営業報告書を顧客別・サービス別・組み合わせ別に正しく集計する', () => {
    const input_records = [
      {
        customer_id: 'cust_A',
        customer_name: '顧客A',
        service_type: 'service_1',
        service_name: 'サービス種別1',
        sales_amount: 100000,
        appointment_count: 5,
        contract_count: 2,
      },
      {
        customer_id: 'cust_A',
        customer_name: '顧客A',
        service_type: 'service_2',
        service_name: 'サービス種別2',
        sales_amount: 150000,
        appointment_count: 8,
        contract_count: 3,
      },
      {
        customer_id: 'cust_B',
        customer_name: '顧客B',
        service_type: 'service_1',
        service_name: 'サービス種別1',
        sales_amount: 200000,
        appointment_count: 10,
        contract_count: 4,
      },
      {
        customer_id: 'cust_B',
        customer_name: '顧客B',
        service_type: 'service_3',
        service_name: 'サービス種別3',
        sales_amount: 80000,
        appointment_count: 4,
        contract_count: 1,
      },
      {
        customer_id: 'cust_C',
        customer_name: '顧客C',
        service_type: 'service_2',
        service_name: 'サービス種別2',
        sales_amount: 120000,
        appointment_count: 6,
        contract_count: 2,
      },
      {
        customer_id: 'cust_C',
        customer_name: '顧客C',
        service_type: 'service_3',
        service_name: 'サービス種別3',
        sales_amount: 70000,
        appointment_count: 3,
        contract_count: 1,
      },
    ];

    const result = aggregateMonthlySalesReport(input_records);

    const expected_total_sales = 720000;
    const expected_total_appointments = 36;
    const expected_total_contracts = 13;

    // 総合計の検証
    expect(result.total_sales_amount).toBe(expected_total_sales);
    expect(result.total_appointment_count).toBe(expected_total_appointments);
    expect(result.total_contract_count).toBe(expected_total_contracts);

    // 顧客別集計の検証
    const customer_summary = result.by_customer;
    expect(customer_summary).toHaveLength(3);

    const cust_a_summary = customer_summary.find(
      (c) => c.customer_id === 'cust_A'
    );
    expect(cust_a_summary).toBeDefined();
    expect(cust_a_summary?.sales_amount).toBe(250000);
    expect(cust_a_summary?.appointment_count).toBe(13);
    expect(cust_a_summary?.contract_count).toBe(5);

    const cust_b_summary = customer_summary.find(
      (c) => c.customer_id === 'cust_B'
    );
    expect(cust_b_summary).toBeDefined();
    expect(cust_b_summary?.sales_amount).toBe(280000);
    expect(cust_b_summary?.appointment_count).toBe(14);
    expect(cust_b_summary?.contract_count).toBe(5);

    const cust_c_summary = customer_summary.find(
      (c) => c.customer_id === 'cust_C'
    );
    expect(cust_c_summary).toBeDefined();
    expect(cust_c_summary?.sales_amount).toBe(190000);
    expect(cust_c_summary?.appointment_count).toBe(9);
    expect(cust_c_summary?.contract_count).toBe(3);

    // サービス種別別集計の検証
    const service_summary = result.by_service_type;
    expect(service_summary).toHaveLength(3);

    const service_1_summary = service_summary.find(
      (s) => s.service_type === 'service_1'
    );
    expect(service_1_summary).toBeDefined();
    expect(service_1_summary?.sales_amount).toBe(300000);
    expect(service_1_summary?.appointment_count).toBe(15);
    expect(service_1_summary?.contract_count).toBe(6);

    const service_2_summary = service_summary.find(
      (s) => s.service_type === 'service_2'
    );
    expect(service_2_summary).toBeDefined();
    expect(service_2_summary?.sales_amount).toBe(270000);
    expect(service_2_summary?.appointment_count).toBe(14);
    expect(service_2_summary?.contract_count).toBe(5);

    const service_3_summary = service_summary.find(
      (s) => s.service_type === 'service_3'
    );
    expect(service_3_summary).toBeDefined();
    expect(service_3_summary?.sales_amount).toBe(150000);
    expect(service_3_summary?.appointment_count).toBe(7);
    expect(service_3_summary?.contract_count).toBe(2);

    // 顧客×サービス種別の組み合わせ別集計の検証
    const combination_summary = result.by_customer_and_service;
    expect(combination_summary).toHaveLength(6);

    const cust_a_service_1 = combination_summary.find(
      (c) => c.customer_id === 'cust_A' && c.service_type === 'service_1'
    );
    expect(cust_a_service_1).toBeDefined();
    expect(cust_a_service_1?.sales_amount).toBe(100000);
    expect(cust_a_service_1?.appointment_count).toBe(5);
    expect(cust_a_service_1?.contract_count).toBe(2);

    const cust_a_service_2 = combination_summary.find(
      (c) => c.customer_id === 'cust_A' && c.service_type === 'service_2'
    );
    expect(cust_a_service_2).toBeDefined();
    expect(cust_a_service_2?.sales_amount).toBe(150000);
    expect(cust_a_service_2?.appointment_count).toBe(8);
    expect(cust_a_service_2?.contract_count).toBe(3);

    const cust_b_service_1 = combination_summary.find(
      (c) => c.customer_id === 'cust_B' && c.service_type === 'service_1'
    );
    expect(cust_b_service_1).toBeDefined();
    expect(cust_b_service_1?.sales_amount).toBe(200000);
    expect(cust_b_service_1?.appointment_count).toBe(10);
    expect(cust_b_service_1?.contract_count).toBe(4);

    const cust_b_service_3 = combination_summary.find(
      (c) => c.customer_id === 'cust_B' && c.service_type === 'service_3'
    );
    expect(cust_b_service_3).toBeDefined();
    expect(cust_b_service_3?.sales_amount).toBe(80000);
    expect(cust_b_service_3?.appointment_count).toBe(4);
    expect(cust_b_service_3?.contract_count).toBe(1);

    const cust_c_service_2 = combination_summary.find(
      (c) => c.customer_id === 'cust_C' && c.service_type === 'service_2'
    );
    expect(cust_c_service_2).toBeDefined();
    expect(cust_c_service_2?.sales_amount).toBe(120000);
    expect(cust_c_service_2?.appointment_count).toBe(6);
    expect(cust_c_service_2?.contract_count).toBe(2);

    const cust_c_service_3 = combination_summary.find(
      (c) => c.customer_id === 'cust_C' && c.service_type === 'service_3'
    );
    expect(cust_c_service_3).toBeDefined();
    expect(cust_c_service_3?.sales_amount).toBe(70000);
    expect(cust_c_service_3?.appointment_count).toBe(3);
    expect(cust_c_service_3?.contract_count).toBe(1);

    // 集計の合計値が入力データの総合計と一致することの検証
    const sum_by_customer = customer_summary.reduce(
      (acc, c) => acc + c.sales_amount,
      0
    );
    expect(sum_by_customer).toBe(expected_total_sales);

    const sum_by_service = service_summary.reduce(
      (acc, s) => acc + s.sales_amount,
      0
    );
    expect(sum_by_service).toBe(expected_total_sales);

    const sum_by_combination = combination_summary.reduce(
      (acc, comb) => acc + comb.sales_amount,
      0
    );
    expect(sum_by_combination).toBe(expected_total_sales);

    // 重複計上や漏れがないことの確認
    const combination_records_count = combination_summary.length;
    expect(combination_records_count).toBe(input_records.length);

    const all_appointments_sum =
      result.by_customer.reduce((acc, c) => acc + c.appointment_count, 0) +
      result.by_service_type.reduce((acc, s) => acc + s.appointment_count, 0) -
      result.total_appointment_count;
    const expected_appointments_double_count_excess =
      expected_total_appointments;
    expect(all_appointments_sum).toBe(expected_appointments_double_count_excess);
  });
});