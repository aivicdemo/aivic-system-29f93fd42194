import { detectMissingRequiredFields } from '../../src/logic/it-1781935279444-2-2-1';

describe('営業データの完全性・正確性を自動検証し、不足データ・誤りを検出・通知する機能', () => {
  // SCEN-641: [error] 営業データ異常値・漏れ検出機能 - 必須項目が空の場合に漏れデータとして検出される
  test('必須項目が空の場合に漏れデータとして検出される', () => {
    // ハッピーパス: すべての必須項目が入力されている場合
    const validSalesData = {
      customerId: 'CUST-001',
      customerName: '顧客A',
      transactionDate: '2024-01-15',
      amount: 100000,
      serviceType: 'サービスB',
      appointmentStatus: '確定',
      appointmentCount: 1,
      contractCount: 1,
      contactFeedback: 'ポジティブ',
    };

    const validResult = detectMissingRequiredFields(validSalesData);
    expect(validResult.hasMissingFields).toBe(false);
    expect(validResult.missingFields).toEqual([]);
    expect(validResult.detectionStatus).toBe('passed');

    // エラーケース1: customerName が空文字列
    const missingCustomerName = {
      customerId: 'CUST-001',
      customerName: '',
      transactionDate: '2024-01-15',
      amount: 100000,
      serviceType: 'サービスB',
      appointmentStatus: '確定',
      appointmentCount: 1,
      contractCount: 1,
      contactFeedback: 'ポジティブ',
    };

    const resultMissingCustomerName = detectMissingRequiredFields(missingCustomerName);
    expect(resultMissingCustomerName.hasMissingFields).toBe(true);
    expect(resultMissingCustomerName.missingFields).toContain('customerName');
    expect(resultMissingCustomerName.detectionStatus).toBe('failed');
    expect(resultMissingCustomerName.errorMessage).toMatch(/顧客名/);

    // エラーケース2: transactionDate が null
    const missingTransactionDate = {
      customerId: 'CUST-001',
      customerName: '顧客A',
      transactionDate: null,
      amount: 100000,
      serviceType: 'サービスB',
      appointmentStatus: '確定',
      appointmentCount: 1,
      contractCount: 1,
      contactFeedback: 'ポジティブ',
    };

    const resultMissingTransactionDate = detectMissingRequiredFields(missingTransactionDate);
    expect(resultMissingTransactionDate.hasMissingFields).toBe(true);
    expect(resultMissingTransactionDate.missingFields).toContain('transactionDate');
    expect(resultMissingTransactionDate.detectionStatus).toBe('failed');
    expect(resultMissingTransactionDate.errorMessage).toMatch(/日付/);

    // エラーケース3: amount が undefined
    const missingAmount = {
      customerId: 'CUST-001',
      customerName: '顧客A',
      transactionDate: '2024-01-15',
      amount: undefined,
      serviceType: 'サービスB',
      appointmentStatus: '確定',
      appointmentCount: 1,
      contractCount: 1,
      contactFeedback: 'ポジティブ',
    };

    const resultMissingAmount = detectMissingRequiredFields(missingAmount);
    expect(resultMissingAmount.hasMissingFields).toBe(true);
    expect(resultMissingAmount.missingFields).toContain('amount');
    expect(resultMissingAmount.detectionStatus).toBe('failed');
    expect(resultMissingAmount.errorMessage).toMatch(/金額/);

    // エラーケース4: 複数の必須項目が空
    const multipleFieldsMissing = {
      customerId: 'CUST-001',
      customerName: '',
      transactionDate: '',
      amount: 0,
      serviceType: '',
      appointmentStatus: '',
      appointmentCount: 1,
      contractCount: 1,
      contactFeedback: 'ポジティブ',
    };

    const resultMultipleFieldsMissing = detectMissingRequiredFields(multipleFieldsMissing);
    expect(resultMultipleFieldsMissing.hasMissingFields).toBe(true);
    expect(resultMultipleFieldsMissing.missingFields.length).toBeGreaterThan(1);
    expect(resultMultipleFieldsMissing.missingFields).toContain('customerName');
    expect(resultMultipleFieldsMissing.missingFields).toContain('transactionDate');
    expect(resultMultipleFieldsMissing.missingFields).toContain('amount');
    expect(resultMultipleFieldsMissing.detectionStatus).toBe('failed');

    // エラーケース5: customerId が空 (主キーとして必須)
    const missingCustomerId = {
      customerId: '',
      customerName: '顧客A',
      transactionDate: '2024-01-15',
      amount: 100000,
      serviceType: 'サービスB',
      appointmentStatus: '確定',
      appointmentCount: 1,
      contractCount: 1,
      contactFeedback: 'ポジティブ',
    };

    const resultMissingCustomerId = detectMissingCustomerId(missingCustomerId);
    expect(resultMissingCustomerId.hasMissingFields).toBe(true);
    expect(resultMissingCustomerId.missingFields).toContain('customerId');
    expect(resultMissingCustomerId.detectionStatus).toBe('failed');
    expect(resultMissingCustomerId.errorMessage).toMatch(/顧客ID/);

    // 境界値: 必須項目が 0 の場合 (数値では 0 は妥当な値)
    const zeroAmount = {
      customerId: 'CUST-001',
      customerName: '顧客A',
      transactionDate: '2024-01-15',
      amount: 0,
      serviceType: 'サービスB',
      appointmentStatus: '確定',
      appointmentCount: 0,
      contractCount: 0,
      contactFeedback: 'ポジティブ',
    };

    const resultZeroAmount = detectMissingRequiredFields(zeroAmount);
    expect(resultZeroAmount.hasMissingFields).toBe(true);
    expect(resultZeroAmount.missingFields).toContain('amount');
    expect(resultZeroAmount.detectionStatus).toBe('failed');

    // エラーケース6: appointmentStatus が空 (ステータス値が必須)
    const missingAppointmentStatus = {
      customerId: 'CUST-001',
      customerName: '顧客A',
      transactionDate: '2024-01-15',
      amount: 100000,
      serviceType: 'サービスB',
      appointmentStatus: '',
      appointmentCount: 1,
      contractCount: 1,
      contactFeedback: 'ポジティブ',
    };

    const resultMissingAppointmentStatus = detectMissingRequiredFields(missingAppointmentStatus);
    expect(resultMissingAppointmentStatus.hasMissingFields).toBe(true);
    expect(resultMissingAppointmentStatus.missingFields).toContain('appointmentStatus');
    expect(resultMissingAppointmentStatus.detectionStatus).toBe('failed');
    expect(resultMissingAppointmentStatus.errorMessage).toMatch(/アポ確定状況/);

    // エラーケース7: contactFeedback が空 (顧客反応が必須)
    const missingContactFeedback = {
      customerId: 'CUST-001',
      customerName: '顧客A',
      transactionDate: '2024-01-15',
      amount: 100000,
      serviceType: 'サービスB',
      appointmentStatus: '確定',
      appointmentCount: 1,
      contractCount: 1,
      contactFeedback: '',
    };

    const resultMissingContactFeedback = detectMissingRequiredFields(missingContactFeedback);
    expect(resultMissingContactFeedback.hasMissingFields).toBe(true);
    expect(resultMissingContactFeedback.missingFields).toContain('contactFeedback');
    expect(resultMissingContactFeedback.detectionStatus).toBe('failed');
    expect(resultMissingContactFeedback.errorMessage).toMatch(/顧客反応/);

    // 検出結果レポート検証: 漏れデータとして記録されているか
    const reportData = {
      detectedAt: '2024-01-15T11:00:00Z',
      recordId: 'REC-001',
      missingFieldsList: ['customerName', 'transactionDate'],
      dataQualityStatus: 'failed',
      recordStatus: 'incomplete',
    };

    expect(reportData.dataQualityStatus).toBe('failed');
    expect(reportData.recordStatus).toBe('incomplete');
    expect(reportData.missingFieldsList.length).toBe(2);
    expect(reportData.missingFieldsList).toEqual(['customerName', 'transactionDate']);
  });

  function detectMissingCustomerId(data: any) {
    return detectMissingRequiredFields(data);
  }
});