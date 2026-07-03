import { validateReportValidity } from '../../src/logic/it-1-1-1';

describe('営業成果レポート内容妥当性判定機能', () => {
  // SCEN-1012
  test('レポート内のすべての数値が営業データと一致し、妥当性判定が正常に完了する', () => {
    const sales_amount = 1500000;
    const transaction_count = 45;
    const customer_count = 12;
    const service_fee = 75000;
    const discount_amount = 0;
    const final_amount = 1425000;

    const sales_data = {
      sales_amount: sales_amount,
      transaction_count: transaction_count,
      customer_count: customer_count,
      service_fee: service_fee,
      discount_amount: discount_amount,
      final_amount: final_amount,
    };

    const report_data = {
      sales_amount: 1500000,
      transaction_count: 45,
      customer_count: 12,
      service_fee: 75000,
      discount_amount: 0,
      final_amount: 1425000,
    };

    const result = validateReportValidity({
      sales_data: sales_data,
      report_data: report_data,
    });

    expect(result.is_valid).toBe(true);
    expect(result.status).toBe('妥当');
    expect(result.mismatch_count).toBe(0);
    expect(result.warnings).toEqual([]);
    expect(result.error_message).toBeNull();

    expect(result.validation_details).toEqual({
      sales_amount_match: true,
      transaction_count_match: true,
      customer_count_match: true,
      service_fee_match: true,
      discount_amount_match: true,
      final_amount_match: true,
    });
  });

  test('レポート内の売上金額が営業データと不一致の場合、妥当性判定が失敗する', () => {
    const sales_data = {
      sales_amount: 1500000,
      transaction_count: 45,
      customer_count: 12,
      service_fee: 75000,
      discount_amount: 0,
      final_amount: 1425000,
    };

    const report_data = {
      sales_amount: 1400000,
      transaction_count: 45,
      customer_count: 12,
      service_fee: 75000,
      discount_amount: 0,
      final_amount: 1325000,
    };

    const result = validateReportValidity({
      sales_data: sales_data,
      report_data: report_data,
    });

    expect(result.is_valid).toBe(false);
    expect(result.status).toBe('不妥当');
    expect(result.mismatch_count).toBe(2);
    expect(result.warnings).toContain('sales_amount');
    expect(result.warnings).toContain('final_amount');
  });

  test('レポート内の取引件数が営業データと不一致の場合、警告が記録される', () => {
    const sales_data = {
      sales_amount: 1500000,
      transaction_count: 45,
      customer_count: 12,
      service_fee: 75000,
      discount_amount: 0,
      final_amount: 1425000,
    };

    const report_data = {
      sales_amount: 1500000,
      transaction_count: 40,
      customer_count: 12,
      service_fee: 75000,
      discount_amount: 0,
      final_amount: 1425000,
    };

    const result = validateReportValidity({
      sales_data: sales_data,
      report_data: report_data,
    });

    expect(result.is_valid).toBe(false);
    expect(result.mismatch_count).toBe(1);
    expect(result.warnings).toContain('transaction_count');
  });

  test('営業データがnullの場合、エラーが発生する', () => {
    const report_data = {
      sales_amount: 1500000,
      transaction_count: 45,
      customer_count: 12,
      service_fee: 75000,
      discount_amount: 0,
      final_amount: 1425000,
    };

    expect(() => {
      validateReportValidity({
        sales_data: null,
        report_data: report_data,
      });
    }).toThrow(/営業データ/);
  });

  test('レポートデータがnullの場合、エラーが発生する', () => {
    const sales_data = {
      sales_amount: 1500000,
      transaction_count: 45,
      customer_count: 12,
      service_fee: 75000,
      discount_amount: 0,
      final_amount: 1425000,
    };

    expect(() => {
      validateReportValidity({
        sales_data: sales_data,
        report_data: null,
      });
    }).toThrow(/レポートデータ/);
  });

  test('複数の項目が不一致の場合、すべての不一致が検出される', () => {
    const sales_data = {
      sales_amount: 1500000,
      transaction_count: 45,
      customer_count: 12,
      service_fee: 75000,
      discount_amount: 0,
      final_amount: 1425000,
    };

    const report_data = {
      sales_amount: 1400000,
      transaction_count: 40,
      customer_count: 10,
      service_fee: 70000,
      discount_amount: 0,
      final_amount: 1330000,
    };

    const result = validateReportValidity({
      sales_data: sales_data,
      report_data: report_data,
    });

    expect(result.is_valid).toBe(false);
    expect(result.mismatch_count).toBe(5);
    expect(result.status).toBe('不妥当');
  });
});