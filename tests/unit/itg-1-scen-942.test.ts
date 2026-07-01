import { validateSalesDataQuality } from '../../src/logic/it-1781935279444-2-2-1';

describe('営業データ品質検証・異常検出機能 - 金額の異常値検出と請求額計算ブロック', () => {
  test('SCEN-942: 金額の異常値が検出され、請求額計算への進行が防止される', () => {
    // ハッピーパス: 正常な営業データ
    const valid_sales_data = {
      sales_id: 'SLS-20240115-001',
      customer_id: 'CUST-001',
      service_type: 'appointment',
      amount: 50000,
      transaction_date: '2024-01-15',
      status: 'completed',
    };

    const valid_result = validateSalesDataQuality(valid_sales_data);
    expect(valid_result.is_valid).toBe(true);
    expect(valid_result.errors).toEqual([]);
    expect(valid_result.can_proceed_to_billing).toBe(true);

    // エラーケース 1: 負の金額
    const negative_amount_data = {
      sales_id: 'SLS-20240115-002',
      customer_id: 'CUST-001',
      service_type: 'appointment',
      amount: -10000,
      transaction_date: '2024-01-15',
      status: 'completed',
    };

    const negative_result = validateSalesDataQuality(negative_amount_data);
    expect(negative_result.is_valid).toBe(false);
    expect(negative_result.errors).toContainEqual(
      expect.objectContaining({
        error_type: 'negative_amount',
        field_name: 'amount',
        detected_value: -10000,
        message: expect.stringContaining('負数'),
      })
    );
    expect(negative_result.can_proceed_to_billing).toBe(false);

    // エラーケース 2: 極端に大きい金額
    const excessive_amount_data = {
      sales_id: 'SLS-20240115-003',
      customer_id: 'CUST-001',
      service_type: 'appointment',
      amount: 999999999,
      transaction_date: '2024-01-15',
      status: 'completed',
    };

    const excessive_result = validateSalesDataQuality(excessive_amount_data);
    expect(excessive_result.is_valid).toBe(false);
    expect(excessive_result.errors).toContainEqual(
      expect.objectContaining({
        error_type: 'amount_exceeds_threshold',
        field_name: 'amount',
        detected_value: 999999999,
        message: expect.stringContaining('上限'),
      })
    );
    expect(excessive_result.can_proceed_to_billing).toBe(false);

    // エラーケース 3: 不正なフォーマット（文字列が混在）
    const invalid_format_data = {
      sales_id: 'SLS-20240115-004',
      customer_id: 'CUST-001',
      service_type: 'appointment',
      amount: 'ABC50000' as any,
      transaction_date: '2024-01-15',
      status: 'completed',
    };

    const format_result = validateSalesDataQuality(invalid_format_data);
    expect(format_result.is_valid).toBe(false);
    expect(format_result.errors).toContainEqual(
      expect.objectContaining({
        error_type: 'invalid_format',
        field_name: 'amount',
        message: expect.stringContaining('形式'),
      })
    );
    expect(format_result.can_proceed_to_billing).toBe(false);

    // エラーケース 4: 小数点以下の不正な精度
    const precision_data = {
      sales_id: 'SLS-20240115-005',
      customer_id: 'CUST-001',
      service_type: 'appointment',
      amount: 50000.999,
      transaction_date: '2024-01-15',
      status: 'completed',
    };

    const precision_result = validateSalesDataQuality(precision_data);
    expect(precision_result.is_valid).toBe(false);
    expect(precision_result.errors).toContainEqual(
      expect.objectContaining({
        error_type: 'invalid_precision',
        field_name: 'amount',
        message: expect.stringContaining('精度'),
      })
    );
    expect(precision_result.can_proceed_to_billing).toBe(false);

    // エラーケース 5: 必須項目欠落
    const missing_amount_data = {
      sales_id: 'SLS-20240115-006',
      customer_id: 'CUST-001',
      service_type: 'appointment',
      amount: undefined,
      transaction_date: '2024-01-15',
      status: 'completed',
    };

    const missing_result = validateSalesDataQuality(missing_amount_data);
    expect(missing_result.is_valid).toBe(false);
    expect(missing_result.errors).toContainEqual(
      expect.objectContaining({
        error_type: 'missing_required_field',
        field_name: 'amount',
        message: expect.stringContaining('必須'),
      })
    );
    expect(missing_result.can_proceed_to_billing).toBe(false);

    // 複数の異常値が同時に存在する場合
    const multiple_errors_data = {
      sales_id: 'SLS-20240115-007',
      customer_id: 'CUST-001',
      service_type: 'appointment',
      amount: -50000.999,
      transaction_date: '2024-01-15',
      status: 'completed',
    };

    const multiple_result = validateSalesDataQuality(multiple_errors_data);
    expect(multiple_result.is_valid).toBe(false);
    expect(multiple_result.errors.length).toBeGreaterThanOrEqual(2);
    expect(multiple_result.can_proceed_to_billing).toBe(false);
    expect(multiple_result.errors).toContainEqual(
      expect.objectContaining({
        error_type: 'negative_amount',
      })
    );
    expect(multiple_result.errors).toContainEqual(
      expect.objectContaining({
        error_type: 'invalid_precision',
      })
    );

    // 異常値検出時に請求額計算処理への進行がブロックされることを確認
    expect(() => {
      if (!negative_result.can_proceed_to_billing) {
        throw new Error(/請求額計算へ進行不可/.test('') ? 'error' : '請求額計算へ進行不可');
      }
    }).toThrow(/請求額計算へ進行不可/);

    // データベースには異常なデータが保存されないことを確認
    expect(valid_result.database_saved).toBe(true);
    expect(negative_result.database_saved).toBe(false);
    expect(excessive_result.database_saved).toBe(false);
    expect(format_result.database_saved).toBe(false);
    expect(precision_result.database_saved).toBe(false);
  });
});