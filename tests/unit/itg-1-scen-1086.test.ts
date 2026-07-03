import { validateSalesDataPriority } from '../../src/logic/it-1781935279444-2-1-1';

describe('営業データ入力時の品質検証ルール定義・実行機能', () => {
  test('SCEN-1086: 優先度分類エラー時に無効な優先度値が検出される', () => {
    // テストケース1: 無効な優先度値（範囲外の数値）
    const invalidPriorityOutOfRange = {
      recordId: 'REC001',
      customerId: 'CUST001',
      activityDate: '2024-01-15',
      appointmentCount: 5,
      contractCount: 2,
      priority: 999, // 無効な優先度（許容範囲: 1-5）
    };

    const result1 = validateSalesDataPriority(invalidPriorityOutOfRange);
    expect(result1.isValid).toBe(false);
    expect(result1.errors).toContain(expect.objectContaining({
      field: 'priority',
      message: expect.stringMatching(/優先度/),
    }));
    expect(result1.recordId).toBe('REC001');

    // テストケース2: 無効な優先度値（負の数）
    const invalidPriorityNegative = {
      recordId: 'REC002',
      customerId: 'CUST002',
      activityDate: '2024-01-16',
      appointmentCount: 3,
      contractCount: 1,
      priority: -1, // 無効な優先度
    };

    const result2 = validateSalesDataPriority(invalidPriorityNegative);
    expect(result2.isValid).toBe(false);
    expect(result2.errors).toContain(expect.objectContaining({
      field: 'priority',
      message: expect.stringMatching(/優先度/),
    }));

    // テストケース3: 無効な優先度値（null）
    const invalidPriorityNull = {
      recordId: 'REC003',
      customerId: 'CUST003',
      activityDate: '2024-01-17',
      appointmentCount: 2,
      contractCount: 1,
      priority: null as any, // 無効な優先度
    };

    const result3 = validateSalesDataPriority(invalidPriorityNull);
    expect(result3.isValid).toBe(false);
    expect(result3.errors).toContain(expect.objectContaining({
      field: 'priority',
      message: expect.stringMatching(/優先度/),
    }));

    // テストケース4: 無効な優先度値（文字列）
    const invalidPriorityString = {
      recordId: 'REC004',
      customerId: 'CUST004',
      activityDate: '2024-01-18',
      appointmentCount: 4,
      contractCount: 2,
      priority: 'high' as any, // 無効な優先度形式
    };

    const result4 = validateSalesDataPriority(invalidPriorityString);
    expect(result4.isValid).toBe(false);
    expect(result4.errors).toContain(expect.objectContaining({
      field: 'priority',
      message: expect.stringMatching(/優先度/),
    }));

    // テストケース5: 有効な優先度値（境界値1）
    const validPriorityLower = {
      recordId: 'REC005',
      customerId: 'CUST005',
      activityDate: '2024-01-19',
      appointmentCount: 1,
      contractCount: 1,
      priority: 1, // 有効な優先度
    };

    const result5 = validateSalesDataPriority(validPriorityLower);
    expect(result5.isValid).toBe(true);
    expect(result5.errors).toEqual([]);

    // テストケース6: 有効な優先度値（中間値）
    const validPriorityMiddle = {
      recordId: 'REC006',
      customerId: 'CUST006',
      activityDate: '2024-01-20',
      appointmentCount: 3,
      contractCount: 2,
      priority: 3, // 有効な優先度
    };

    const result6 = validateSalesDataPriority(validPriorityMiddle);
    expect(result6.isValid).toBe(true);
    expect(result6.errors).toEqual([]);

    // テストケース7: 有効な優先度値（境界値5）
    const validPriorityUpper = {
      recordId: 'REC007',
      customerId: 'CUST007',
      activityDate: '2024-01-21',
      appointmentCount: 5,
      contractCount: 3,
      priority: 5, // 有効な優先度
    };

    const result7 = validateSalesDataPriority(validPriorityUpper);
    expect(result7.isValid).toBe(true);
    expect(result7.errors).toEqual([]);

    // テストケース8: 無効な優先度値（浮動小数点数）
    const invalidPriorityFloat = {
      recordId: 'REC008',
      customerId: 'CUST008',
      activityDate: '2024-01-22',
      appointmentCount: 2,
      contractCount: 1,
      priority: 2.5, // 無効な優先度（整数のみ許可）
    };

    const result8 = validateSalesDataPriority(invalidPriorityFloat);
    expect(result8.isValid).toBe(false);
    expect(result8.errors).toContain(expect.objectContaining({
      field: 'priority',
      message: expect.stringMatching(/優先度/),
    }));

    // テストケース9: エラーログが適切に記録されることを確認
    const invalidPriorityForLog = {
      recordId: 'REC009',
      customerId: 'CUST009',
      activityDate: '2024-01-23',
      appointmentCount: 1,
      contractCount: 1,
      priority: 0, // 無効な優先度
    };

    const result9 = validateSalesDataPriority(invalidPriorityForLog);
    expect(result9.isValid).toBe(false);
    expect(result9.recordId).toBe('REC009');
    expect(result9.errors.length).toBeGreaterThan(0);
    expect(result9.errors[0]).toHaveProperty('field');
    expect(result9.errors[0]).toHaveProperty('message');
    expect(result9.errors[0].field).toBe('priority');
  });
});