import { validateBillingDataAccuracy } from '../../src/logic/it-1781935279444-2-2-1';

describe('営業データの完全性・正確性を自動検証し、不足データ・誤りを検出・通知する機能', () => {
  test('SCEN-817: 請求データが営業成果データと完全に一致する場合に検証成功と判定される', () => {
    // 営業成果データの事前登録
    const salesData = {
      sales_data_id: 'SD001',
      customer_id: 'CUST001',
      product_id: 'PROD001',
      quantity: 10,
      unit_price: 5000,
      sales_amount: 50000,
      sales_date: '2024-01-15',
      service_type: 'service_A',
      status: 'completed'
    };

    // 請求データ作成（営業成果データと完全一致）
    const billingData = {
      billing_id: 'BILL001',
      customer_id: 'CUST001',
      product_id: 'PROD001',
      quantity: 10,
      unit_price: 5000,
      billing_amount: 50000,
      billing_date: '2024-01-15',
      service_type: 'service_A',
      related_sales_data_id: 'SD001'
    };

    // 検証関数を実行
    const validationResult = validateBillingDataAccuracy(
      billingData,
      salesData
    );

    // 検証ステータスが『成功』と判定されることを確認
    expect(validationResult.validation_status).toBe('success');

    // 検証ログに検証成功メッセージが記録されることを確認
    expect(validationResult.validation_log).toContain('検証成功');

    // 検証完了フラグが立つことを確認
    expect(validationResult.validation_completed_flag).toBe(true);

    // 請求データが承認可能な状態になることを確認
    expect(validationResult.approvable_status).toBe(true);

    // 検証ログの詳細情報を確認
    expect(validationResult.validation_details).toEqual({
      customer_match: true,
      product_match: true,
      quantity_match: true,
      unit_price_match: true,
      amount_match: true,
      date_match: true,
      service_type_match: true
    });

    // 検証時刻が記録されることを確認
    expect(validationResult.validation_timestamp).toBeDefined();
    expect(typeof validationResult.validation_timestamp).toBe('string');

    // 検証スコア（一致度）が 100% であることを確認
    expect(validationResult.validation_score).toBe(100);

    // エラーメッセージが空であることを確認
    expect(validationResult.error_messages).toEqual([]);

    // 警告メッセージが空であることを確認
    expect(validationResult.warning_messages).toEqual([]);
  });
});