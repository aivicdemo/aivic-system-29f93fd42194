import { validateSalesDataTypes } from '../../src/logic/it-1781935279444-2-2-1';

describe('営業データの型検証機能', () => {
  test('SCEN-1247: データ型が定義と異なる場合、型エラーを検出して通知する', () => {
    // 準備: 定義されたスキーマ
    const schema = {
      apptCount: { type: 'number', fieldName: 'アポイント数' },
      closedCount: { type: 'number', fieldName: '成約数' },
      customerReaction: { type: 'string', fieldName: '顧客反応' },
      amount: { type: 'number', fieldName: '金額' },
      contactDate: { type: 'string', fieldName: '接触日時' },
    };

    // テストデータ1: 金額フィールドに文字列値を設定（型エラー）
    const invalidDataWithStringAmount = {
      apptCount: 5,
      closedCount: 2,
      customerReaction: 'positive',
      amount: '15000', // エラー: number 型であるべき
      contactDate: '2024-01-15T10:00:00Z',
      customerId: 'C001',
      serviceType: 'standard',
    };

    // 実行: 型検証を実行
    const result1 = validateSalesDataTypes(invalidDataWithStringAmount, schema);

    // 検証: 型エラーが検出される
    expect(result1.isValid).toBe(false);
    expect(result1.errors).toHaveLength(1);
    expect(result1.errors[0]).toMatchObject({
      fieldName: '金額',
      field: 'amount',
      expectedType: 'number',
      actualType: 'string',
      actualValue: '15000',
    });
    expect(result1.errors[0].message).toMatch(/型不一致/);
    expect(result1.shouldNotifyUser).toBe(true);

    // テストデータ2: アポイント数フィールドに文字列値を設定（型エラー）
    const invalidDataWithStringAppt = {
      apptCount: 'five', // エラー: number 型であるべき
      closedCount: 2,
      customerReaction: 'positive',
      amount: 15000,
      contactDate: '2024-01-15T10:00:00Z',
      customerId: 'C002',
      serviceType: 'premium',
    };

    const result2 = validateSalesDataTypes(invalidDataWithStringAppt, schema);

    // 検証: 複数フィールドの型エラーが検出される（この場合は 1 件）
    expect(result2.isValid).toBe(false);
    expect(result2.errors).toHaveLength(1);
    expect(result2.errors[0]).toMatchObject({
      fieldName: 'アポイント数',
      field: 'apptCount',
      expectedType: 'number',
      actualType: 'string',
    });

    // テストデータ3: 複数フィールドに型エラー
    const invalidDataWithMultipleErrors = {
      apptCount: '5', // エラー: number 型であるべき
      closedCount: 'two', // エラー: number 型であるべき
      customerReaction: 'positive',
      amount: 15000,
      contactDate: '2024-01-15T10:00:00Z',
      customerId: 'C003',
      serviceType: 'standard',
    };

    const result3 = validateSalesDataTypes(invalidDataWithMultipleErrors, schema);

    // 検証: 複数の型エラーが検出される
    expect(result3.isValid).toBe(false);
    expect(result3.errors.length).toBeGreaterThanOrEqual(2);
    const apptError = result3.errors.find((e) => e.field === 'apptCount');
    const closedError = result3.errors.find((e) => e.field === 'closedCount');
    expect(apptError).toBeDefined();
    expect(closedError).toBeDefined();
    expect(result3.shouldNotifyUser).toBe(true);

    // テストデータ4: 正常なデータ（すべての型が正しい）
    const validData = {
      apptCount: 5,
      closedCount: 2,
      customerReaction: 'positive',
      amount: 15000,
      contactDate: '2024-01-15T10:00:00Z',
      customerId: 'C004',
      serviceType: 'standard',
    };

    const result4 = validateSalesDataTypes(validData, schema);

    // 検証: 型エラーがないことを確認
    expect(result4.isValid).toBe(true);
    expect(result4.errors).toHaveLength(0);
    expect(result4.shouldNotifyUser).toBe(false);

    // テストデータ5: 接触日時フィールドが数値型で渡される（型エラー）
    const invalidDataWithNumberDate = {
      apptCount: 5,
      closedCount: 2,
      customerReaction: 'positive',
      amount: 15000,
      contactDate: 1705316400, // エラー: string 型であるべき
      customerId: 'C005',
      serviceType: 'premium',
    };

    const result5 = validateSalesDataTypes(invalidDataWithNumberDate, schema);

    // 検証: 日時フィールドの型エラーが検出される
    expect(result5.isValid).toBe(false);
    expect(result5.errors).toHaveLength(1);
    expect(result5.errors[0]).toMatchObject({
      fieldName: '接触日時',
      field: 'contactDate',
      expectedType: 'string',
      actualType: 'number',
    });

    // 通知情報の検証
    expect(result5.notificationDetails).toBeDefined();
    expect(result5.notificationDetails.messageForUser).toContain('データ型');
    expect(result5.notificationDetails.shouldSendEmail).toBe(true);
    expect(result5.notificationDetails.shouldDisplayOnDashboard).toBe(true);
    expect(result5.notificationDetails.shouldLogError).toBe(true);

    // テストデータ6: null が渡される場合（型エラー）
    const invalidDataWithNull = {
      apptCount: null, // エラー: number 型であるべき
      closedCount: 2,
      customerReaction: 'positive',
      amount: 15000,
      contactDate: '2024-01-15T10:00:00Z',
      customerId: 'C006',
      serviceType: 'standard',
    };

    const result6 = validateSalesDataTypes(invalidDataWithNull, schema);

    // 検証: null 型のエラーが検出される
    expect(result6.isValid).toBe(false);
    expect(result6.errors).toHaveLength(1);
    expect(result6.errors[0]).toMatchObject({
      fieldName: 'アポイント数',
      field: 'apptCount',
      expectedType: 'number',
      actualType: 'null',
    });

    // エラーメッセージが具体的であることを確認
    expect(result6.errors[0].message).toMatch(/アポイント数/);
    expect(result6.errors[0].message).toMatch(/number/);
  });
});