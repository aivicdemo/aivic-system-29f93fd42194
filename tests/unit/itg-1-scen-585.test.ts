import { validateSalesData } from '../../src/logic/it-1781935279444-2-2-1';

describe('営業データの品質検証', () => {
  // SCEN-585: [normal] 営業データの品質検証実行 - 検証ルール（必須項目・データ型・範囲・異常値）に基づき、営業データが全項目検証され合格/不合格が正確に判定される
  test('必須項目・データ型・範囲・異常値の検証ルールを適用し、合格/不合格を正確に判定する', () => {
    // === 必須項目検証 ===
    // 合格: 全必須項目が揃っている
    const valid_complete_data = {
      customer_name: 'テスト顧客A',
      order_number: 'ORD-20240115-001',
      amount: 150000,
      transaction_date: '2024-01-15',
      service_type: 'consulting',
      contact_person: '営業太郎'
    };
    const result_complete = validateSalesData(valid_complete_data);
    expect(result_complete.status).toBe('合格');
    expect(result_complete.errors).toEqual([]);

    // 不合格: 必須項目（顧客名）が空文字
    const invalid_missing_customer_name = {
      customer_name: '',
      order_number: 'ORD-20240115-002',
      amount: 200000,
      transaction_date: '2024-01-15',
      service_type: 'development',
      contact_person: '営業花子'
    };
    const result_missing_customer = validateSalesData(invalid_missing_customer_name);
    expect(result_missing_customer.status).toBe('不合格');
    expect(result_missing_customer.errors.length).toBeGreaterThan(0);
    expect(result_missing_customer.errors[0]).toMatchObject({
      field: 'customer_name',
      error_type: '必須項目',
      message: expect.stringContaining('顧客名')
    });

    // 不合格: 必須項目（受注番号）が未定義
    const invalid_missing_order_number = {
      customer_name: 'テスト顧客B',
      amount: 300000,
      transaction_date: '2024-01-16',
      service_type: 'support',
      contact_person: '営業次郎'
    };
    const result_missing_order = validateSalesData(invalid_missing_order_number);
    expect(result_missing_order.status).toBe('不合格');
    expect(result_missing_order.errors.some(e => e.field === 'order_number')).toBe(true);

    // === データ型検証 ===
    // 不合格: 金額がstring型（数値型でない）
    const invalid_amount_type = {
      customer_name: 'テスト顧客C',
      order_number: 'ORD-20240115-003',
      amount: '150000' as any,
      transaction_date: '2024-01-15',
      service_type: 'consulting',
      contact_person: '営業三郎'
    };
    const result_amount_type = validateSalesData(invalid_amount_type);
    expect(result_amount_type.status).toBe('不合格');
    expect(result_amount_type.errors.some(e => e.field === 'amount' && e.error_type === 'データ型')).toBe(true);

    // 不合格: 日付がISO8601形式でない
    const invalid_date_format = {
      customer_name: 'テスト顧客D',
      order_number: 'ORD-20240115-004',
      amount: 250000,
      transaction_date: '2024/01/15' as any,
      service_type: 'development',
      contact_person: '営業四郎'
    };
    const result_date_format = validateSalesData(invalid_date_format);
    expect(result_date_format.status).toBe('不合格');
    expect(result_date_format.errors.some(e => e.field === 'transaction_date' && e.error_type === 'データ型')).toBe(true);

    // 不合格: service_typeが定義済みの選択肢外
    const invalid_service_type = {
      customer_name: 'テスト顧客E',
      order_number: 'ORD-20240115-005',
      amount: 100000,
      transaction_date: '2024-01-15',
      service_type: 'unknown_service' as any,
      contact_person: '営業五郎'
    };
    const result_service_type = validateSalesData(invalid_service_type);
    expect(result_service_type.status).toBe('不合格');
    expect(result_service_type.errors.some(e => e.field === 'service_type' && e.error_type === 'データ型')).toBe(true);

    // === 範囲検証 ===
    // 不合格: 金額が下限（10000）未満
    const invalid_amount_below_min = {
      customer_name: 'テスト顧客F',
      order_number: 'ORD-20240115-006',
      amount: 5000,
      transaction_date: '2024-01-15',
      service_type: 'consulting',
      contact_person: '営業六郎'
    };
    const result_amount_below = validateSalesData(invalid_amount_below_min);
    expect(result_amount_below.status).toBe('不合格');
    expect(result_amount_below.errors.some(e => e.field === 'amount' && e.error_type === '範囲')).toBe(true);
    expect(result_amount_below.errors.find(e => e.field === 'amount')?.message).toContain('10000');

    // 不合格: 金額が上限（5000000）を超過
    const invalid_amount_above_max = {
      customer_name: 'テスト顧客G',
      order_number: 'ORD-20240115-007',
      amount: 10000000,
      transaction_date: '2024-01-15',
      service_type: 'development',
      contact_person: '営業七郎'
    };
    const result_amount_above = validateSalesData(invalid_amount_above_max);
    expect(result_amount_above.status).toBe('不合格');
    expect(result_amount_above.errors.some(e => e.field === 'amount' && e.error_type === '範囲')).toBe(true);
    expect(result_amount_above.errors.find(e => e.field === 'amount')?.message).toContain('5000000');

    // 合格: 金額が下限ちょうど（10000）
    const valid_amount_at_min = {
      customer_name: 'テスト顧客H',
      order_number: 'ORD-20240115-008',
      amount: 10000,
      transaction_date: '2024-01-15',
      service_type: 'support',
      contact_person: '営業八郎'
    };
    const result_amount_min = validateSalesData(valid_amount_at_min);
    expect(result_amount_min.status).toBe('合格');

    // 合格: 金額が上限ちょうど（5000000）
    const valid_amount_at_max = {
      customer_name: 'テスト顧客I',
      order_number: 'ORD-20240115-009',
      amount: 5000000,
      transaction_date: '2024-01-15',
      service_type: 'consulting',
      contact_person: '営業九郎'
    };
    const result_amount_max = validateSalesData(valid_amount_at_max);
    expect(result_amount_max.status).toBe('合格');

    // === 異常値検証 ===
    // 不合格: 金額が負数
    const invalid_negative_amount = {
      customer_name: 'テスト顧客J',
      order_number: 'ORD-20240115-010',
      amount: -100000,
      transaction_date: '2024-01-15',
      service_type: 'development',
      contact_person: '営業十郎'
    };
    const result_negative = validateSalesData(invalid_negative_amount);
    expect(result_negative.status).toBe('不合格');
    expect(result_negative.errors.some(e => e.field === 'amount' && e.error_type === '異常値')).toBe(true);

    // 不合格: 日付が未来日付（本日より90日以上先）
    const invalid_future_date = {
      customer_name: 'テスト顧客K',
      order_number: 'ORD-20240115-011',
      amount: 200000,
      transaction_date: '2024-06-01',
      service_type: 'consulting',
      contact_person: '営業十一郎'
    };
    const result_future_date = validateSalesData(invalid_future_date);
    expect(result_future_date.status).toBe('不合格');
    expect(result_future_date.errors.some(e => e.field === 'transaction_date' && e.error_type === '異常値')).toBe(true);

    // === 複合検証: 複数エラーが存在する場合 ===
    // 不合格: 複数項目に複数のエラーがある
    const invalid_multiple_errors = {
      customer_name: '',
      order_number: 'ORD-20240115-012',
      amount: -50000 as any,
      transaction_date: '2024-12-31',
      service_type: 'unknown' as any,
      contact_person: '営業十二郎'
    };
    const result_multiple = validateSalesData(invalid_multiple_errors);
    expect(result_multiple.status).toBe('不合格');
    expect(result_multiple.errors.length).toBeGreaterThanOrEqual(3);
    expect(result_multiple.errors.some(e => e.field === 'customer_name')).toBe(true);
    expect(result_multiple.errors.some(e => e.field === 'amount')).toBe(true);
    expect(result_multiple.errors.some(e => e.field === 'service_type' || e.field === 'transaction_date')).toBe(true);

    // === エラーメッセージの詳細確認 ===
    // 不合格時のエラーオブジェクトが正確な項目情報を含む
    const invalid_for_error_detail = {
      customer_name: 'テスト顧客L',
      order_number: 'ORD-20240115-013',
      amount: 1000,
      transaction_date: '2024-01-15',
      service_type: 'consulting',
      contact_person: '営業十三郎'
    };
    const result_error_detail = validateSalesData(invalid_for_error_detail);
    expect(result_error_detail.status).toBe('不合格');
    const amount_error = result_error_detail.errors.find(e => e.field === 'amount');
    expect(amount_error).toBeDefined();
    expect(amount_error?.field).toBe('amount');
    expect(amount_error?.error_type).toBe('範囲');
    expect(amount_error?.actual_value).toBe(1000);
    expect(amount_error?.message).toContain('1000');

    // === 境界値テスト ===
    // 合格: 金額が範囲内（中央値）
    const valid_middle_range = {
      customer_name: 'テスト顧客M',
      order_number: 'ORD-20240115-014',
      amount: 2505000,
      transaction_date: '2024-01-15',
      service_type: 'support',
      contact_person: '営業十四郎'
    };
    const result_middle = validateSalesData(valid_middle_range);
    expect(result_middle.status).toBe('合格');

    // 合格: 日付が本日
    const today_iso = new Date().toISOString().split('T')[0];
    const valid_today_date = {
      customer_name: 'テスト顧客N',
      order_number: 'ORD-20240115-015',
      amount: 300000,
      transaction_date: today_iso,
      service_type: 'consulting',
      contact_person: '営業十五郎'
    };
    const result_today = validateSalesData(valid_today_date);
    expect(result_today.status).toBe('合格');

    // 合格: 日付が過去（30日前）
    const past_date = new Date();
    past_date.setDate(past_date.getDate() - 30);
    const past_date_iso = past_date.toISOString().split('T')[0];
    const valid_past_date = {
      customer_name: 'テスト顧客O',
      order_number: 'ORD-20240115-016',
      amount: 150000,
      transaction_date: past_date_iso,
      service_type: 'development',
      contact_person: '営業十六郎'
    };
    const result_past = validateSalesData(valid_past_date);
    expect(result_past.status).toBe('合格');

    // 不合格: 日付が過去（400日以上前）
    const very_past_date = new Date();
    very_past_date.setDate(very_past_date.getDate() - 400);
    const very_past_date_iso = very_past_date.toISOString().split('T')[0];
    const invalid_very_past_date = {
      customer_name: 'テスト顧客P',
      order_number: 'ORD-20240115-017',
      amount: 100000,
      transaction_date: very_past_date_iso,
      service_type: 'consulting',
      contact_person: '営業十七郎'
    };
    const result_very_past = validateSalesData(invalid_very_past_date);
    expect(result_very_past.status).toBe('不合格');
    expect(result_very_past.errors.some(e => e.field === 'transaction_date' && e.error_type === '異常値')).toBe(true);

    // === 検証結果の詳細ログが取得可能 ===
    // 検証結果オブジェクトに必要な情報が全て含まれている
    const comprehensive_test = {
      customer_name: 'テスト顧客Q',
      order_number: 'ORD-20240115-018',
      amount: 450000,
      transaction_date: '2024-01-15',
      service_type: 'support',
      contact_person: '営業十八郎'
    };
    const result_comprehensive = validateSalesData(comprehensive_test);
    expect(result_comprehensive).toHaveProperty('status');
    expect(result_comprehensive).toHaveProperty('errors');
    expect(result_comprehensive).toHaveProperty('validated_at');
    expect(Array.isArray(result_comprehensive.errors)).toBe(true);
    expect(typeof result_comprehensive.validated_at).toBe('string');
  });
});