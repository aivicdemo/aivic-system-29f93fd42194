import { extractBillingTargetByCustomerService } from '../../src/logic/it-1781935279444-1-1-1';

describe('営業データ項目のメタデータ管理機能 - 品質チェック未完了データの除外', () => {
  // SCEN-648: 顧客別・サービス別請求対象抽出集計機能 - 品質チェック未完了のデータが請求対象から除外される
  test('品質チェック完了したレコードのみが顧客別・サービス別に集計されて請求対象として抽出される', () => {
    // 前提条件: テストデータベースに複数の顧客レコードを作成
    const input_sales_data = [
      {
        id: 'sales_001',
        customer_id: 'cust_A',
        service_id: 'svc_basic',
        appointment_count: 5,
        contract_count: 2,
        quality_check_status: 'complete',
        billing_target_flag: true,
      },
      {
        id: 'sales_002',
        customer_id: 'cust_A',
        service_id: 'svc_basic',
        appointment_count: 3,
        contract_count: 1,
        quality_check_status: 'incomplete',
        billing_target_flag: true,
      },
      {
        id: 'sales_003',
        customer_id: 'cust_A',
        service_id: 'svc_premium',
        appointment_count: 8,
        contract_count: 4,
        quality_check_status: 'complete',
        billing_target_flag: true,
      },
      {
        id: 'sales_004',
        customer_id: 'cust_B',
        service_id: 'svc_basic',
        appointment_count: 2,
        contract_count: 1,
        quality_check_status: 'incomplete',
        billing_target_flag: true,
      },
      {
        id: 'sales_005',
        customer_id: 'cust_B',
        service_id: 'svc_premium',
        appointment_count: 6,
        contract_count: 3,
        quality_check_status: 'complete',
        billing_target_flag: true,
      },
      {
        id: 'sales_006',
        customer_id: 'cust_C',
        service_id: 'svc_basic',
        appointment_count: 4,
        contract_count: 2,
        quality_check_status: 'complete',
        billing_target_flag: true,
      },
    ];

    // 手順: 顧客別・サービス別請求対象抽出集計機能を実行
    const result = extractBillingTargetByCustomerService(input_sales_data);

    // 期待結果1: 品質チェック未完了のレコードが除外されている
    // sales_002（cust_A/svc_basic/incomplete）と sales_004（cust_B/svc_basic/incomplete）は除外されるべき
    const extracted_ids = result.map((item: any) => item.source_id);
    expect(extracted_ids).not.toContain('sales_002');
    expect(extracted_ids).not.toContain('sales_004');

    // 期待結果2: 品質チェック完了のレコードのみが抽出されている
    // sales_001, sales_003, sales_005, sales_006 が抽出されるべき
    expect(extracted_ids).toContain('sales_001');
    expect(extracted_ids).toContain('sales_003');
    expect(extracted_ids).toContain('sales_005');
    expect(extracted_ids).toContain('sales_006');

    // 期待結果3: 顧客別・サービス別の集計結果が正確である
    // cust_A/svc_basic: sales_001 のみ（sales_002は完了していないため除外）
    const cust_a_basic = result.find(
      (item: any) => item.customer_id === 'cust_A' && item.service_id === 'svc_basic'
    );
    expect(cust_a_basic).toBeDefined();
    expect(cust_a_basic.total_appointment_count).toBe(5);
    expect(cust_a_basic.total_contract_count).toBe(2);
    expect(cust_a_basic.record_count).toBe(1);

    // cust_A/svc_premium: sales_003 のみ
    const cust_a_premium = result.find(
      (item: any) => item.customer_id === 'cust_A' && item.service_id === 'svc_premium'
    );
    expect(cust_a_premium).toBeDefined();
    expect(cust_a_premium.total_appointment_count).toBe(8);
    expect(cust_a_premium.total_contract_count).toBe(4);
    expect(cust_a_premium.record_count).toBe(1);

    // cust_B/svc_basic: 除外（sales_004は未完了）
    const cust_b_basic = result.find(
      (item: any) => item.customer_id === 'cust_B' && item.service_id === 'svc_basic'
    );
    expect(cust_b_basic).toBeUndefined();

    // cust_B/svc_premium: sales_005 のみ
    const cust_b_premium = result.find(
      (item: any) => item.customer_id === 'cust_B' && item.service_id === 'svc_premium'
    );
    expect(cust_b_premium).toBeDefined();
    expect(cust_b_premium.total_appointment_count).toBe(6);
    expect(cust_b_premium.total_contract_count).toBe(3);
    expect(cust_b_premium.record_count).toBe(1);

    // cust_C/svc_basic: sales_006 のみ
    const cust_c_basic = result.find(
      (item: any) => item.customer_id === 'cust_C' && item.service_id === 'svc_basic'
    );
    expect(cust_c_basic).toBeDefined();
    expect(cust_c_basic.total_appointment_count).toBe(4);
    expect(cust_c_basic.total_contract_count).toBe(2);
    expect(cust_c_basic.record_count).toBe(1);

    // 期待結果4: 抽出されたデータセットの総数が正確である
    // 入力6件中、完了済み4件が抽出されて顧客別・サービス別に集計される
    expect(result.length).toBe(4);

    // 期待結果5: 各集計レコードに billing_target_flag が true で設定されている
    result.forEach((item: any) => {
      expect(item.billing_target_flag).toBe(true);
      expect(item.quality_check_status).toBe('complete');
    });
  });
});