import { validateSalesDataCompletion } from '../../src/logic/it-1781935279444-2-2-1';

describe('営業データの完全性・正確性を自動検証し、不足データ・誤りを検出・通知する機能', () => {
  // SCEN-885: [error] 営業データ品質チェック・必須項目検証 - 営業データの必須項目が1つ以上未入力の場合、未入力項目の詳細を含むエラーが返される
  test('必須項目が未入力の場合、未入力項目の詳細を含むエラーが返される', () => {
    // ハッピーパス: 必須項目すべてが入力されている場合
    const validSalesData = {
      customer_name: '株式会社テスト',
      amount: 100000,
      transaction_date: '2024-01-15',
      appointment_confirmed: true,
      service_type: 'standard',
    };

    const validResult = validateSalesDataCompletion(validSalesData);
    expect(validResult.status).toBe('success');
    expect(validResult.errors).toEqual([]);
    expect(validResult.data).toEqual(validSalesData);

    // エラーケース1: 顧客名が空文字列
    const missingCustomerName = {
      customer_name: '',
      amount: 100000,
      transaction_date: '2024-01-15',
      appointment_confirmed: true,
      service_type: 'standard',
    };

    const resultMissingCustomerName = validateSalesDataCompletion(missingCustomerName);
    expect(resultMissingCustomerName.status).toBe('error');
    expect(resultMissingCustomerName.errors.length).toBeGreaterThan(0);
    expect(resultMissingCustomerName.errors.some((e: any) => e.field === 'customer_name')).toBe(true);
    const customerNameError = resultMissingCustomerName.errors.find((e: any) => e.field === 'customer_name');
    expect(customerNameError?.message).toMatch(/顧客名/);

    // エラーケース2: 金額がnull
    const missingAmount = {
      customer_name: '株式会社テスト',
      amount: null,
      transaction_date: '2024-01-15',
      appointment_confirmed: true,
      service_type: 'standard',
    };

    const resultMissingAmount = validateSalesDataCompletion(missingAmount);
    expect(resultMissingAmount.status).toBe('error');
    expect(resultMissingAmount.errors.length).toBeGreaterThan(0);
    expect(resultMissingAmount.errors.some((e: any) => e.field === 'amount')).toBe(true);
    const amountError = resultMissingAmount.errors.find((e: any) => e.field === 'amount');
    expect(amountError?.message).toMatch(/金額/);

    // エラーケース3: 取引日が空文字列
    const missingTransactionDate = {
      customer_name: '株式会社テスト',
      amount: 100000,
      transaction_date: '',
      appointment_confirmed: true,
      service_type: 'standard',
    };

    const resultMissingTransactionDate = validateSalesDataCompletion(missingTransactionDate);
    expect(resultMissingTransactionDate.status).toBe('error');
    expect(resultMissingTransactionDate.errors.length).toBeGreaterThan(0);
    expect(resultMissingTransactionDate.errors.some((e: any) => e.field === 'transaction_date')).toBe(true);
    const transactionDateError = resultMissingTransactionDate.errors.find((e: any) => e.field === 'transaction_date');
    expect(transactionDateError?.message).toMatch(/取引日/);

    // エラーケース4: 複数の必須項目が未入力
    const multipleErrors = {
      customer_name: '',
      amount: null,
      transaction_date: '',
      appointment_confirmed: true,
      service_type: 'standard',
    };

    const resultMultipleErrors = validateSalesDataCompletion(multipleErrors);
    expect(resultMultipleErrors.status).toBe('error');
    expect(resultMultipleErrors.errors.length).toBe(3);
    expect(resultMultipleErrors.errors.some((e: any) => e.field === 'customer_name')).toBe(true);
    expect(resultMultipleErrors.errors.some((e: any) => e.field === 'amount')).toBe(true);
    expect(resultMultipleErrors.errors.some((e: any) => e.field === 'transaction_date')).toBe(true);

    // エラーケース5: service_typeがundefined
    const missingServiceType = {
      customer_name: '株式会社テスト',
      amount: 100000,
      transaction_date: '2024-01-15',
      appointment_confirmed: true,
      service_type: undefined,
    };

    const resultMissingServiceType = validateSalesDataCompletion(missingServiceType);
    expect(resultMissingServiceType.status).toBe('error');
    expect(resultMissingServiceType.errors.length).toBeGreaterThan(0);
    expect(resultMissingServiceType.errors.some((e: any) => e.field === 'service_type')).toBe(true);
    const serviceTypeError = resultMissingServiceType.errors.find((e: any) => e.field === 'service_type');
    expect(serviceTypeError?.message).toMatch(/サービス種別/);

    // エラーケース6: appointment_confirmedが未定義
    const missingAppointmentConfirmed = {
      customer_name: '株式会社テスト',
      amount: 100000,
      transaction_date: '2024-01-15',
      appointment_confirmed: undefined,
      service_type: 'standard',
    };

    const resultMissingAppointmentConfirmed = validateSalesDataCompletion(missingAppointmentConfirmed);
    expect(resultMissingAppointmentConfirmed.status).toBe('error');
    expect(resultMissingAppointmentConfirmed.errors.some((e: any) => e.field === 'appointment_confirmed')).toBe(true);
    const appointmentError = resultMissingAppointmentConfirmed.errors.find((e: any) => e.field === 'appointment_confirmed');
    expect(appointmentError?.message).toMatch(/アポ/);
  });
});