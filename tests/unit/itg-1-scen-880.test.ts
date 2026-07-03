import { detectAnomalies } from '../../src/logic/it-1781935279444-2-2-1';

describe('営業データの完全性・正確性を自動検証し、不足データ・誤りを検出・通知する機能', () => {
  // SCEN-880
  test('営業データ異常値自動検出機能 - 許容範囲の最小値・最大値での判定', () => {
    // 最小値（0円）のテストケース
    const min_value_data = {
      amount: 0,
      quantity: 1,
      contact_date: '2024-01-15',
      customer_id: 'CUST001',
      status: 'completed'
    };

    const min_value_result = detectAnomalies(min_value_data);

    expect(min_value_result.is_anomaly).toBe(false);
    expect(min_value_result.status).toBe('OK');
    expect(min_value_result.error_flag).toBe(false);
    expect(min_value_result.validation_message).toBe('正常');

    // 最大値（9,999,999円）のテストケース
    const max_value_data = {
      amount: 9999999,
      quantity: 1,
      contact_date: '2024-01-15',
      customer_id: 'CUST001',
      status: 'completed'
    };

    const max_value_result = detectAnomalies(max_value_data);

    expect(max_value_result.is_anomaly).toBe(false);
    expect(max_value_result.status).toBe('OK');
    expect(max_value_result.error_flag).toBe(false);
    expect(max_value_result.validation_message).toBe('正常');

    // 許容範囲外の値のエラーテストケース（最小値未満）
    const below_min_data = {
      amount: -1,
      quantity: 1,
      contact_date: '2024-01-15',
      customer_id: 'CUST001',
      status: 'completed'
    };

    expect(() => detectAnomalies(below_min_data)).toThrow(/金額/);

    // 許容範囲外の値のエラーテストケース（最大値超過）
    const above_max_data = {
      amount: 10000000,
      quantity: 1,
      contact_date: '2024-01-15',
      customer_id: 'CUST001',
      status: 'completed'
    };

    expect(() => detectAnomalies(above_max_data)).toThrow(/金額/);
  });
});