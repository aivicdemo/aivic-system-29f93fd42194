import { validateBillingInfo } from '../../src/logic/it-1781935279444-2-1-1';

describe('営業データ入力時の品質検証ルール定義・実行機能', () => {
  // SCEN-1256
  test('[normal] 請求情報検証機能 - 抽出された請求情報が契約内容・顧客別ルール・過去パターンと照合され、異常値が検出される', () => {
    // テストデータ準備: 請求情報レコード
    const billingInfos = [
      {
        billing_id: 'B001',
        contract_id: 'C001',
        customer_id: 'CUST001',
        billing_amount: 150000,
        billing_date: '2024-01-15',
      },
      {
        billing_id: 'B002',
        contract_id: 'C001',
        customer_id: 'CUST001',
        billing_amount: 5000000, // 異常値: 過去パターンから大幅に乖離
        billing_date: '2024-02-15',
      },
      {
        billing_id: 'B003',
        contract_id: 'C002',
        customer_id: 'CUST002',
        billing_amount: 200000,
        billing_date: '2024-01-10', // 異常値: 契約で定義された請求日（15日）に違反
      },
      {
        billing_id: 'B004',
        contract_id: 'C003',
        customer_id: 'CUST003',
        billing_amount: 100000,
        billing_date: '2024-01-15',
      },
    ];

    // 契約マスタ: 対象顧客の契約内容
    const contracts = [
      {
        contract_id: 'C001',
        customer_id: 'CUST001',
        contract_amount: 150000,
        billing_frequency: 'monthly',
        contract_start_date: '2023-01-01',
        contract_end_date: '2024-12-31',
        billing_day: 15,
      },
      {
        contract_id: 'C002',
        customer_id: 'CUST002',
        contract_amount: 200000,
        billing_frequency: 'monthly',
        contract_start_date: '2023-06-01',
        contract_end_date: '2024-12-31',
        billing_day: 15,
      },
      {
        contract_id: 'C003',
        customer_id: 'CUST003',
        contract_amount: 100000,
        billing_frequency: 'monthly',
        contract_start_date: '2023-01-01',
        contract_end_date: '2024-12-31',
        billing_day: 15,
      },
    ];

    // 顧客別ルール定義
    const customerRules = [
      {
        customer_id: 'CUST001',
        min_billing_amount: 100000,
        max_billing_amount: 200000,
        allowed_billing_days: [15],
        billing_tolerance_percentage: 10,
      },
      {
        customer_id: 'CUST002',
        min_billing_amount: 150000,
        max_billing_amount: 250000,
        allowed_billing_days: [15],
        billing_tolerance_percentage: 10,
      },
      {
        customer_id: 'CUST003',
        min_billing_amount: 80000,
        max_billing_amount: 120000,
        allowed_billing_days: [15],
        billing_tolerance_percentage: 10,
      },
    ];

    // 過去12ヶ月の請求履歴パターン
    const historicalBillings = [
      { customer_id: 'CUST001', billing_amount: 150000, billing_date: '2023-01-15' },
      { customer_id: 'CUST001', billing_amount: 150000, billing_date: '2023-02-15' },
      { customer_id: 'CUST001', billing_amount: 150000, billing_date: '2023-03-15' },
      { customer_id: 'CUST001', billing_amount: 150000, billing_date: '2023-04-15' },
      { customer_id: 'CUST001', billing_amount: 150000, billing_date: '2023-05-15' },
      { customer_id: 'CUST001', billing_amount: 150000, billing_date: '2023-06-15' },
      { customer_id: 'CUST001', billing_amount: 150000, billing_date: '2023-07-15' },
      { customer_id: 'CUST001', billing_amount: 150000, billing_date: '2023-08-15' },
      { customer_id: 'CUST001', billing_amount: 150000, billing_date: '2023-09-15' },
      { customer_id: 'CUST001', billing_amount: 150000, billing_date: '2023-10-15' },
      { customer_id: 'CUST001', billing_amount: 150000, billing_date: '2023-11-15' },
      { customer_id: 'CUST001', billing_amount: 150000, billing_date: '2023-12-15' },
      { customer_id: 'CUST002', billing_amount: 200000, billing_date: '2023-06-15' },
      { customer_id: 'CUST002', billing_amount: 200000, billing_date: '2023-07-15' },
      { customer_id: 'CUST002', billing_amount: 200000, billing_date: '2023-08-15' },
      { customer_id: 'CUST003', billing_amount: 100000, billing_date: '2023-01-15' },
      { customer_id: 'CUST003', billing_amount: 100000, billing_date: '2023-02-15' },
    ];

    // 請求情報検証機能を実行
    const result = validateBillingInfo(
      billingInfos,
      contracts,
      customerRules,
      historicalBillings
    );

    // 期待結果の検証: 複数の異常検出結果が集約される

    // B001: 正常（契約内容・ルール・過去パターンすべて合致）
    expect(result.validations[0].billing_id).toBe('B001');
    expect(result.validations[0].is_anomaly).toBe(false);
    expect(result.validations[0].anomaly_details).toEqual([]);

    // B002: 異常（過去パターンから大幅乖離: 5,000,000は150,000の33倍）
    expect(result.validations[1].billing_id).toBe('B002');
    expect(result.validations[1].is_anomaly).toBe(true);
    expect(result.validations[1].anomaly_details).toContainEqual(
      expect.objectContaining({
        anomaly_type: 'statistical_outlier',
        description: expect.stringMatching(/統計的外れ値|異常値/),
        severity: 'high',
      })
    );
    // ルール違反も検出: 5,000,000 > max_billing_amount(200,000)
    expect(result.validations[1].anomaly_details).toContainEqual(
      expect.objectContaining({
        anomaly_type: 'rule_violation',
        description: expect.stringMatching(/ルール|範囲外/),
      })
    );

    // B003: 異常（請求日が10日で、契約で定義された15日に違反）
    expect(result.validations[2].billing_id).toBe('B003');
    expect(result.validations[2].is_anomaly).toBe(true);
    expect(result.validations[2].anomaly_details).toContainEqual(
      expect.objectContaining({
        anomaly_type: 'contract_violation',
        description: expect.stringMatching(/契約|請求日/),
        severity: 'medium',
      })
    );

    // B004: 正常（契約内容・ルール・過去パターンすべて合致）
    expect(result.validations[3].billing_id).toBe('B004');
    expect(result.validations[3].is_anomaly).toBe(false);
    expect(result.validations[3].anomaly_details).toEqual([]);

    // 集計結果の検証
    expect(result.summary.total_records).toBe(4);
    expect(result.summary.normal_count).toBe(2);
    expect(result.summary.anomaly_count).toBe(2);
    expect(result.summary.anomaly_rate).toBe(0.5);
    expect(result.summary.anomalies_by_type).toEqual(
      expect.objectContaining({
        contract_violation: 1,
        rule_violation: 1,
        statistical_outlier: 1,
      })
    );

    // 複数異常の検出確認: B002は複数の異常を持つ
    expect(result.validations[1].anomaly_details.length).toBeGreaterThanOrEqual(2);

    // エラー検証: 無効な入力
    expect(() =>
      validateBillingInfo(null as any, contracts, customerRules, historicalBillings)
    ).toThrow(/請求情報/);

    expect(() =>
      validateBillingInfo(billingInfos, null as any, customerRules, historicalBillings)
    ).toThrow(/契約/);

    expect(() =>
      validateBillingInfo(billingInfos, contracts, null as any, historicalBillings)
    ).toThrow(/ルール/);

    expect(() =>
      validateBillingInfo(billingInfos, contracts, customerRules, null as any)
    ).toThrow(/履歴/);
  });
});