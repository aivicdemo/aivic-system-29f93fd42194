import { validateContractChange } from '../../src/logic/it-1781935279444-2-1-1';

describe('営業データ入力時の品質検証ルール定義・実行機能', () => {
  // SCEN-1225: [error] 営業データ変更の自動検知・通知機能 - 変更内容が無効なデータ型の場合、契約変更管理システへの登録が拒否されエラーが返される
  test('契約金額に無効なデータ型（文字列）が入力された場合、登録が拒否され数値型エラーが返される', () => {
    const invalidChangeRequest = {
      contractId: 'CNT-20240115-001',
      changeType: 'AMOUNT_CHANGE',
      fieldName: '契約金額',
      newValue: 'abc',
      changedBy: 'user-001',
      changedAt: new Date('2024-01-15T11:00:00Z').toISOString(),
    };

    expect(() => validateContractChange(invalidChangeRequest)).toThrow(/契約金額/);
  });

  test('契約金額に有効な数値が入力された場合、検証に成功し登録可能な状態が返される', () => {
    const validChangeRequest = {
      contractId: 'CNT-20240115-001',
      changeType: 'AMOUNT_CHANGE',
      fieldName: '契約金額',
      newValue: 150000,
      changedBy: 'user-001',
      changedAt: new Date('2024-01-15T11:00:00Z').toISOString(),
    };

    const result = validateContractChange(validChangeRequest);

    expect(result).toEqual({
      isValid: true,
      contractId: 'CNT-20240115-001',
      changeType: 'AMOUNT_CHANGE',
      fieldName: '契約金Amount',
      newValue: 150000,
      validationStatus: 'PASSED',
      registrationAllowed: true,
    });
  });

  test('納期に無効なデータ型（数値）が入力された場合、登録が拒否され日付型エラーが返される', () => {
    const invalidDateChangeRequest = {
      contractId: 'CNT-20240115-002',
      changeType: 'DELIVERY_DATE_CHANGE',
      fieldName: '納期',
      newValue: 20240228,
      changedBy: 'user-001',
      changedAt: new Date('2024-01-15T11:30:00Z').toISOString(),
    };

    expect(() => validateContractChange(invalidDateChangeRequest)).toThrow(/納期/);
  });

  test('納期に有効なISO日付文字列が入力された場合、検証に成功し登録可能な状態が返される', () => {
    const validDateChangeRequest = {
      contractId: 'CNT-20240115-002',
      changeType: 'DELIVERY_DATE_CHANGE',
      fieldName: '納期',
      newValue: '2024-02-28T23:59:59Z',
      changedBy: 'user-001',
      changedAt: new Date('2024-01-15T11:30:00Z').toISOString(),
    };

    const result = validateContractChange(validDateChangeRequest);

    expect(result).toEqual({
      isValid: true,
      contractId: 'CNT-20240115-002',
      changeType: 'DELIVERY_DATE_CHANGE',
      fieldName: '納期',
      newValue: '2024-02-28T23:59:59Z',
      validationStatus: 'PASSED',
      registrationAllowed: true,
    });
  });

  test('契約IDが空文字列の場合、登録が拒否され必須項目エラーが返される', () => {
    const missingContractIdRequest = {
      contractId: '',
      changeType: 'AMOUNT_CHANGE',
      fieldName: '契約金額',
      newValue: 200000,
      changedBy: 'user-001',
      changedAt: new Date('2024-01-15T12:00:00Z').toISOString(),
    };

    expect(() => validateContractChange(missingContractIdRequest)).toThrow(/契約ID/);
  });

  test('複数のフィールド変更リクエストで、1つが無効なデータ型の場合、全体が拒否される', () => {
    const multiFieldInvalidRequest = {
      contractId: 'CNT-20240115-003',
      changeType: 'MULTI_CHANGE',
      fieldName: '契約条件',
      newValue: {
        amount: 'invalid_number',
        deliveryDate: '2024-03-31T23:59:59Z',
        serviceName: 'Service A',
      },
      changedBy: 'user-002',
      changedAt: new Date('2024-01-15T14:00:00Z').toISOString(),
    };

    expect(() => validateContractChange(multiFieldInvalidRequest)).toThrow(/契約条件/);
  });

  test('複数のフィールド変更リクエストで、すべて有効なデータ型の場合、検証に成功する', () => {
    const multiFieldValidRequest = {
      contractId: 'CNT-20240115-003',
      changeType: 'MULTI_CHANGE',
      fieldName: '契約条件',
      newValue: {
        amount: 250000,
        deliveryDate: '2024-03-31T23:59:59Z',
        serviceName: 'Service A',
      },
      changedBy: 'user-002',
      changedAt: new Date('2024-01-15T14:00:00Z').toISOString(),
    };

    const result = validateContractChange(multiFieldValidRequest);

    expect(result).toEqual({
      isValid: true,
      contractId: 'CNT-20240115-003',
      changeType: 'MULTI_CHANGE',
      fieldName: '契約条件',
      newValue: {
        amount: 250000,
        deliveryDate: '2024-03-31T23:59:59Z',
        serviceName: 'Service A',
      },
      validationStatus: 'PASSED',
      registrationAllowed: true,
    });
  });
});