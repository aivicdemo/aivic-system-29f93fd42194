import { validateAndApproveQualityCheckedData } from '../../src/logic/it-1781935279444-2-2-1';

describe('営業データ品質基準チェック・承認機能', () => {
  // SCEN-726
  test('修正済みデータがすべての品質基準をパスし、確定・承認ステータスへ遷移する', () => {
    // Arrange: 修正済みの営業データを準備
    const correctedSalesData = {
      id: 'sales_data_001',
      customerId: 'cust_12345',
      contactDate: '2024-01-15',
      contactTime: '10:30',
      customerName: 'テスト顧客',
      appointmentCount: 5,
      contractCount: 2,
      serviceType: 'service_A',
      amount: 150000,
      status: 'pending_approval',
      dataFormat: 'valid',
      requiredFieldsComplete: true,
      valueWithinRange: true,
      consistencyCheck: true,
    };

    const expectedResult = {
      id: 'sales_data_001',
      customerId: 'cust_12345',
      contactDate: '2024-01-15',
      contactTime: '10:30',
      customerName: 'テスト顧客',
      appointmentCount: 5,
      contractCount: 2,
      serviceType: 'service_A',
      amount: 150000,
      status: 'approved_confirmed',
      qualityCheckResult: {
        dataFormatCheck: true,
        requiredFieldsCheck: true,
        valueRangeCheck: true,
        consistencyCheck: true,
        overallResult: true,
      },
      approvalTimestamp: '2024-01-15T10:30:00Z',
      approvedBy: 'operator_001',
    };

    // Act: 品質基準チェック・承認機能を実行
    const result = validateAndApproveQualityCheckedData(
      correctedSalesData,
      'operator_001',
      '2024-01-15T10:30:00Z'
    );

    // Assert: すべての品質基準がパスし、ステータスが「確定・承認」に遷移したことを検証
    expect(result.status).toBe('approved_confirmed');
    expect(result.qualityCheckResult.dataFormatCheck).toBe(true);
    expect(result.qualityCheckResult.requiredFieldsCheck).toBe(true);
    expect(result.qualityCheckResult.valueRangeCheck).toBe(true);
    expect(result.qualityCheckResult.consistencyCheck).toBe(true);
    expect(result.qualityCheckResult.overallResult).toBe(true);
    expect(result.approvalTimestamp).toBe('2024-01-15T10:30:00Z');
    expect(result.approvedBy).toBe('operator_001');
    expect(result.id).toBe('sales_data_001');
    expect(result.customerId).toBe('cust_12345');
    expect(result.amount).toBe(150000);
  });

  // 追加: 必須項目欠落時にエラーを検出
  test('必須項目が欠落している場合、エラーを検出して承認を拒否', () => {
    const incompleteSalesData = {
      id: 'sales_data_002',
      customerId: 'cust_12346',
      contactDate: '2024-01-16',
      customerName: 'テスト顧客2',
      appointmentCount: 3,
      // contractCount が欠落
      serviceType: 'service_B',
      amount: 100000,
      status: 'pending_approval',
      dataFormat: 'valid',
      requiredFieldsComplete: false,
      valueWithinRange: true,
      consistencyCheck: true,
    };

    expect(() =>
      validateAndApproveQualityCheckedData(
        incompleteSalesData,
        'operator_001',
        '2024-01-16T10:30:00Z'
      )
    ).toThrow(/必須項目/);
  });

  // 追加: 値域範囲外の場合にエラーを検出
  test('値が許容範囲を超過している場合、エラーを検出して承認を拒否', () => {
    const outOfRangeSalesData = {
      id: 'sales_data_003',
      customerId: 'cust_12347',
      contactDate: '2024-01-17',
      contactTime: '10:30',
      customerName: 'テスト顧客3',
      appointmentCount: 500,
      contractCount: 250,
      serviceType: 'service_C',
      amount: 99999999,
      status: 'pending_approval',
      dataFormat: 'valid',
      requiredFieldsComplete: true,
      valueWithinRange: false,
      consistencyCheck: true,
    };

    expect(() =>
      validateAndApproveQualityCheckedData(
        outOfRangeSalesData,
        'operator_001',
        '2024-01-17T10:30:00Z'
      )
    ).toThrow(/値域/);
  });

  // 追加: データ形式が不正な場合にエラーを検出
  test('データ形式が不正な場合、エラーを検出して承認を拒否', () => {
    const invalidFormatSalesData = {
      id: 'sales_data_004',
      customerId: 'cust_12348',
      contactDate: 'invalid-date',
      contactTime: '25:99',
      customerName: 'テスト顧客4',
      appointmentCount: 5,
      contractCount: 2,
      serviceType: 'service_D',
      amount: 150000,
      status: 'pending_approval',
      dataFormat: 'invalid',
      requiredFieldsComplete: true,
      valueWithinRange: true,
      consistencyCheck: true,
    };

    expect(() =>
      validateAndApproveQualityCheckedData(
        invalidFormatSalesData,
        'operator_001',
        '2024-01-17T10:30:00Z'
      )
    ).toThrow(/形式/);
  });

  // 追加: 一貫性チェック失敗の場合にエラーを検出
  test('データ項目間の一貫性が失われている場合、エラーを検出して承認を拒否', () => {
    const inconsistentSalesData = {
      id: 'sales_data_005',
      customerId: 'cust_12349',
      contactDate: '2024-01-18',
      contactTime: '10:30',
      customerName: 'テスト顧客5',
      appointmentCount: 2,
      contractCount: 5,
      serviceType: 'service_E',
      amount: 150000,
      status: 'pending_approval',
      dataFormat: 'valid',
      requiredFieldsComplete: true,
      valueWithinRange: true,
      consistencyCheck: false,
    };

    expect(() =>
      validateAndApproveQualityCheckedData(
        inconsistentSalesData,
        'operator_001',
        '2024-01-18T10:30:00Z'
      )
    ).toThrow(/一貫性/);
  });
});