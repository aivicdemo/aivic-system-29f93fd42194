import { validateSalesDataCompleteness } from '../../src/logic/it-1781935279444-2-2-1';

describe('営業データの完全性・正確性自動検証', () => {
  // SCEN-1338
  test('必須項目がすべて入力されたデータが完全性チェックを通過する', () => {
    const input = {
      customer_name: '株式会社ABC',
      product_name: '営業支援ツール',
      amount: 150000,
      transaction_date: '2024-01-15',
      sales_person: '田中太郎',
      quantity: 5,
    };

    const result = validateSalesDataCompleteness(input);

    expect(result.is_complete).toBe(true);
    expect(result.status).toBe('合格');
    expect(result.message).toBe('完全性チェック：合格');
    expect(result.missing_fields).toEqual([]);
    expect(result.validation_errors).toEqual([]);
  });

  test('必須項目が欠落したデータは完全性チェックで不合格となる', () => {
    const input = {
      customer_name: '株式会社ABC',
      product_name: '',
      amount: 150000,
      transaction_date: '2024-01-15',
      sales_person: '田中太郎',
      quantity: 5,
    };

    const result = validateSalesDataCompleteness(input);

    expect(result.is_complete).toBe(false);
    expect(result.status).toBe('不合格');
    expect(result.missing_fields).toContain('product_name');
  });

  test('金額がマイナス値の場合は正確性チェックで検出される', () => {
    const input = {
      customer_name: '株式会社ABC',
      product_name: '営業支援ツール',
      amount: -50000,
      transaction_date: '2024-01-15',
      sales_person: '田中太郎',
      quantity: 5,
    };

    const result = validateSalesDataCompleteness(input);

    expect(result.is_complete).toBe(true);
    expect(result.validation_errors).toContain('金額');
  });

  test('数量がゼロ以下の場合は正確性チェックで検出される', () => {
    const input = {
      customer_name: '株式会社ABC',
      product_name: '営業支援ツール',
      amount: 150000,
      transaction_date: '2024-01-15',
      sales_person: '田中太郎',
      quantity: 0,
    };

    const result = validateSalesDataCompleteness(input);

    expect(result.is_complete).toBe(true);
    expect(result.validation_errors).toContain('数量');
  });

  test('取引日が不正な形式の場合は正確性チェックで検出される', () => {
    const input = {
      customer_name: '株式会社ABC',
      product_name: '営業支援ツール',
      amount: 150000,
      transaction_date: '2024/01/15',
      sales_person: '田中太郎',
      quantity: 5,
    };

    const result = validateSalesDataCompleteness(input);

    expect(result.is_complete).toBe(true);
    expect(result.validation_errors).toContain('取引日');
  });

  test('複数の必須項目が欠落した場合はすべてが記録される', () => {
    const input = {
      customer_name: '',
      product_name: '',
      amount: 150000,
      transaction_date: '2024-01-15',
      sales_person: '',
      quantity: 5,
    };

    const result = validateSalesDataCompleteness(input);

    expect(result.is_complete).toBe(false);
    expect(result.missing_fields.length).toBe(3);
    expect(result.missing_fields).toContain('customer_name');
    expect(result.missing_fields).toContain('product_name');
    expect(result.missing_fields).toContain('sales_person');
  });

  test('営業担当者名が空文字列の場合は完全性チェックで検出される', () => {
    const input = {
      customer_name: '株式会社ABC',
      product_name: '営業支援ツール',
      amount: 150000,
      transaction_date: '2024-01-15',
      sales_person: '   ',
      quantity: 5,
    };

    const result = validateSalesDataCompleteness(input);

    expect(result.is_complete).toBe(false);
    expect(result.missing_fields).toContain('sales_person');
  });

  test('完全かつ正確なデータの場合はステータスが次プロセスへ進行可能である', () => {
    const input = {
      customer_name: '株式会社XYZ',
      product_name: 'クラウド管理システム',
      amount: 500000,
      transaction_date: '2024-02-20',
      sales_person: '山田花子',
      quantity: 10,
    };

    const result = validateSalesDataCompleteness(input);

    expect(result.is_complete).toBe(true);
    expect(result.status).toBe('合格');
    expect(result.can_proceed_to_next_process).toBe(true);
  });

  test('金額が整数でない場合は正確性チェックで許容される', () => {
    const input = {
      customer_name: '株式会社ABC',
      product_name: '営業支援ツール',
      amount: 150000.50,
      transaction_date: '2024-01-15',
      sales_person: '田中太郎',
      quantity: 5,
    };

    const result = validateSalesDataCompleteness(input);

    expect(result.is_complete).toBe(true);
    expect(result.status).toBe('合格');
    expect(result.validation_errors.length).toBe(0);
  });

  test('量が小数点第2位までの場合は正確性チェックで許容される', () => {
    const input = {
      customer_name: '株式会社ABC',
      product_name: '営業支援ツール',
      amount: 150000,
      transaction_date: '2024-01-15',
      sales_person: '田中太郎',
      quantity: 5.25,
    };

    const result = validateSalesDataCompleteness(input);

    expect(result.is_complete).toBe(true);
    expect(result.status).toBe('合格');
    expect(result.validation_errors.length).toBe(0);
  });
});