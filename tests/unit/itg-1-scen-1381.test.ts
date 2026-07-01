import { extractAndAggregateBillingItems } from '../../src/logic/it-1-2-1';

describe('営業成果データから請求対象項目を自動抽出し、顧客ごと・サービスごとの請求額を集計する機能', () => {
  // SCEN-1381: [normal] 請求対象項目自動抽出・集計機能 - 顧客ごと・サービスごとの請求額が正確に計算される
  test('複数顧客・複数サービスの営業データから請求対象項目を抽出し、顧客ごと・サービスごとの請求額を正確に集計する', () => {
    // テストデータ: 複数顧客・複数サービス・異なる料金体系・割引パターン
    const salesData = [
      // 顧客A・サービス1: 固定料金 50,000円 + 従量料金（アポ数5件 × 1,000円/件 = 5,000円）
      {
        customer_id: 'CUST_A',
        service_id: 'SVC_1',
        service_name: 'Basic Plan',
        appointment_count: 5,
        contract_count: 3,
        base_price: 50000,
        unit_price_per_appointment: 1000,
        discount_rate: 0,
        tax_rate: 0.1,
        handling_fee_rate: 0.05,
      },
      // 顧客A・サービス2: 固定料金 30,000円 + 従量料金（成約数3件 × 2,000円/件 = 6,000円）割引10%
      {
        customer_id: 'CUST_A',
        service_id: 'SVC_2',
        service_name: 'Premium Plan',
        appointment_count: 0,
        contract_count: 3,
        base_price: 30000,
        unit_price_per_contract: 2000,
        discount_rate: 0.1,
        tax_rate: 0.1,
        handling_fee_rate: 0.05,
      },
      // 顧客B・サービス1: 固定料金 50,000円 + 従量料金（アポ数8件 × 1,000円/件 = 8,000円）キャンペーン割引5%
      {
        customer_id: 'CUST_B',
        service_id: 'SVC_1',
        service_name: 'Basic Plan',
        appointment_count: 8,
        contract_count: 2,
        base_price: 50000,
        unit_price_per_appointment: 1000,
        discount_rate: 0.05,
        tax_rate: 0.1,
        handling_fee_rate: 0.05,
      },
      // 顧客B・サービス2: 固定料金 20,000円 + 従量料金（成約数5件 × 1,500円/件 = 7,500円）割引0%
      {
        customer_id: 'CUST_B',
        service_id: 'SVC_2',
        service_name: 'Standard Plan',
        appointment_count: 0,
        contract_count: 5,
        base_price: 20000,
        unit_price_per_contract: 1500,
        discount_rate: 0,
        tax_rate: 0.1,
        handling_fee_rate: 0.05,
      },
    ];

    // 請求対象項目自動抽出・集計を実行
    const result = extractAndAggregateBillingItems(salesData);

    // ===== 顧客A・サービス1の請求額検証 =====
    // 計算: (50,000 + 5,000) × (1 - 0) = 55,000 (割引前)
    // 税金: 55,000 × 0.1 = 5,500
    // 手数料: 55,000 × 0.05 = 2,750
    // 合計: 55,000 + 5,500 + 2,750 = 63,250
    const cust_a_svc_1 = result.details.find(
      (d) => d.customer_id === 'CUST_A' && d.service_id === 'SVC_1'
    );
    expect(cust_a_svc_1).toBeDefined();
    expect(cust_a_svc_1?.base_amount).toBe(55000);
    expect(cust_a_svc_1?.discount_amount).toBe(0);
    expect(cust_a_svc_1?.subtotal).toBe(55000);
    expect(cust_a_svc_1?.tax_amount).toBe(5500);
    expect(cust_a_svc_1?.handling_fee_amount).toBe(2750);
    expect(cust_a_svc_1?.total_billing_amount).toBe(63250);

    // ===== 顧客A・サービス2の請求額検証 =====
    // 計算: (30,000 + 6,000) = 36,000 (割引前)
    // 割引: 36,000 × 0.1 = 3,600
    // 割引後: 36,000 - 3,600 = 32,400
    // 税金: 32,400 × 0.1 = 3,240
    // 手数料: 32,400 × 0.05 = 1,620
    // 合計: 32,400 + 3,240 + 1,620 = 37,260
    const cust_a_svc_2 = result.details.find(
      (d) => d.customer_id === 'CUST_A' && d.service_id === 'SVC_2'
    );
    expect(cust_a_svc_2).toBeDefined();
    expect(cust_a_svc_2?.base_amount).toBe(36000);
    expect(cust_a_svc_2?.discount_amount).toBe(3600);
    expect(cust_a_svc_2?.subtotal).toBe(32400);
    expect(cust_a_svc_2?.tax_amount).toBe(3240);
    expect(cust_a_svc_2?.handling_fee_amount).toBe(1620);
    expect(cust_a_svc_2?.total_billing_amount).toBe(37260);

    // ===== 顧客B・サービス1の請求額検証 =====
    // 計算: (50,000 + 8,000) = 58,000 (割引前)
    // 割引: 58,000 × 0.05 = 2,900
    // 割引後: 58,000 - 2,900 = 55,100
    // 税金: 55,100 × 0.1 = 5,510
    // 手数料: 55,100 × 0.05 = 2,755
    // 合計: 55,100 + 5,510 + 2,755 = 63,365
    const cust_b_svc_1 = result.details.find(
      (d) => d.customer_id === 'CUST_B' && d.service_id === 'SVC_1'
    );
    expect(cust_b_svc_1).toBeDefined();
    expect(cust_b_svc_1?.base_amount).toBe(58000);
    expect(cust_b_svc_1?.discount_amount).toBe(2900);
    expect(cust_b_svc_1?.subtotal).toBe(55100);
    expect(cust_b_svc_1?.tax_amount).toBe(5510);
    expect(cust_b_svc_1?.handling_fee_amount).toBe(2755);
    expect(cust_b_svc_1?.total_billing_amount).toBe(63365);

    // ===== 顧客B・サービス2の請求額検証 =====
    // 計算: (20,000 + 7,500) = 27,500 (割引前)
    // 割引: 27,500 × 0 = 0
    // 割引後: 27,500
    // 税金: 27,500 × 0.1 = 2,750
    // 手数料: 27,500 × 0.05 = 1,375
    // 合計: 27,500 + 2,750 + 1,375 = 31,625
    const cust_b_svc_2 = result.details.find(
      (d) => d.customer_id === 'CUST_B' && d.service_id === 'SVC_2'
    );
    expect(cust_b_svc_2).toBeDefined();
    expect(cust_b_svc_2?.base_amount).toBe(27500);
    expect(cust_b_svc_2?.discount_amount).toBe(0);
    expect(cust_b_svc_2?.subtotal).toBe(27500);
    expect(cust_b_svc_2?.tax_amount).toBe(2750);
    expect(cust_b_svc_2?.handling_fee_amount).toBe(1375);
    expect(cust_b_svc_2?.total_billing_amount).toBe(31625);

    // ===== 顧客ごとの複数サービス合計請求額検証 =====
    // 顧客A合計: 63,250 + 37,260 = 100,510
    // 顧客B合計: 63,365 + 31,625 = 94,990
    const cust_a_summary = result.by_customer.find(
      (c) => c.customer_id === 'CUST_A'
    );
    expect(cust_a_summary).toBeDefined();
    expect(cust_a_summary?.total_amount).toBe(100510);
    expect(cust_a_summary?.service_count).toBe(2);

    const cust_b_summary = result.by_customer.find(
      (c) => c.customer_id === 'CUST_B'
    );
    expect(cust_b_summary).toBeDefined();
    expect(cust_b_summary?.total_amount).toBe(94990);
    expect(cust_b_summary?.service_count).toBe(2);

    // ===== サービスごとの合計請求額検証 =====
    // サービス1合計: 63,250 + 63,365 = 126,615
    // サービス2合計: 37,260 + 31,625 = 68,885
    const svc_1_summary = result.by_service.find(
      (s) => s.service_id === 'SVC_1'
    );
    expect(svc_1_summary).toBeDefined();
    expect(svc_1_summary?.total_amount).toBe(126615);
    expect(svc_1_summary?.customer_count).toBe(2);

    const svc_2_summary = result.by_service.find(
      (s) => s.service_id === 'SVC_2'
    );
    expect(svc_2_summary).toBeDefined();
    expect(svc_2_summary?.total_amount).toBe(68885);
    expect(svc_2_summary?.customer_count).toBe(2);

    // ===== 全体合計請求額検証 =====
    // 総合計: 100,510 + 94,990 = 195,500
    expect(result.total_billing_amount).toBe(195500);
    expect(result.details.length).toBe(4);

    // ===== 請求内訳の詳細構造検証 =====
    result.details.forEach((detail) => {
      expect(detail.customer_id).toBeDefined();
      expect(detail.service_id).toBeDefined();
      expect(detail.service_name).toBeDefined();
      expect(detail.base_amount).toBeGreaterThanOrEqual(0);
      expect(detail.discount_amount).toBeGreaterThanOrEqual(0);
      expect(detail.subtotal).toBeGreaterThanOrEqual(0);
      expect(detail.tax_amount).toBeGreaterThanOrEqual(0);
      expect(detail.handling_fee_amount).toBeGreaterThanOrEqual(0);
      expect(detail.total_billing_amount).toBeGreaterThanOrEqual(0);
      // 合計 = 小計 + 税金 + 手数料
      expect(detail.total_billing_amount).toBe(
        detail.subtotal + detail.tax_amount + detail.handling_fee_amount
      );
    });
  });
});