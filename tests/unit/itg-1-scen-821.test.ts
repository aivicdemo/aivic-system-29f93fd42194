import { validateBillingData } from '../../src/logic/it-1781935279444-2-2-1';

describe('請求データ妥当性自動検証機能 - 空または不完全なデータの検証', () => {
  // SCEN-821
  test('空または不完全な請求データに対して検証が適切に失敗する', () => {
    // ========== Case 1: 空のデータオブジェクト ==========
    const emptyData = {};
    const emptyResult = validateBillingData(emptyData);

    expect(emptyResult.status).toMatch(/FAILED|INVALID/);
    expect(emptyResult.errors).toBeDefined();
    expect(emptyResult.errors.length).toBeGreaterThan(0);
    expect(emptyResult.errors.some((err: string) => err.match(/空|missing|required/i))).toBe(true);

    // ========== Case 2: 不完全なデータ（必須フィールド不足） ==========
    const incompleteData = {
      customerId: 'C001',
      // 金額（金額）が欠落
      // 請求日が欠落
    };
    const incompleteResult = validateBillingData(incompleteData);

    expect(incompleteResult.status).toMatch(/FAILED|INVALID/);
    expect(incompleteResult.errors).toBeDefined();
    expect(incompleteResult.errors.length).toBeGreaterThanOrEqual(2);
    
    // 不足フィールドに対応するエラーが個別に返されていることを確認
    const errorMessages = incompleteResult.errors.join('|');
    expect(errorMessages.match(/金額|amount/i)).toBeTruthy();
    expect(errorMessages.match(/請求日|billingDate/i)).toBeTruthy();

    // ========== Case 3: nullを含むデータ ==========
    const nullData = {
      customerId: null,
      amount: 50000,
      billingDate: '2024-01-15',
    };
    const nullResult = validateBillingData(nullData);

    expect(nullResult.status).toMatch(/FAILED|INVALID/);
    expect(nullResult.errors).toBeDefined();
    expect(nullResult.errors.length).toBeGreaterThan(0);
    expect(nullResult.errors.some((err: string) => err.match(/顧客ID|customerId|null|type/i))).toBe(true);

    // ========== Case 4: undefinedを含むデータ ==========
    const undefinedData = {
      customerId: 'C002',
      amount: undefined,
      billingDate: '2024-01-15',
    };
    const undefinedResult = validateBillingData(undefinedData);

    expect(undefinedResult.status).toMatch(/FAILED|INVALID/);
    expect(undefinedResult.errors).toBeDefined();
    expect(undefinedResult.errors.length).toBeGreaterThan(0);
    expect(undefinedResult.errors.some((err: string) => err.match(/金額|amount|undefined|type/i))).toBe(true);

    // ========== Case 5: 複数の必須フィールド欠落 ==========
    const multipleIncompleteData = {
      customerId: 'C003',
      // 金額欠落
      // 請求日欠落
      // サービス種別欠落
    };
    const multipleResult = validateBillingData(multipleIncompleteData);

    expect(multipleResult.status).toMatch(/FAILED|INVALID/);
    expect(multipleResult.errors).toBeDefined();
    expect(multipleResult.errors.length).toBeGreaterThanOrEqual(3);

    // すべての検証エラーがテスト内でキャッチでき、システムが正常に検証失敗を処理すること
    expect(multipleResult.errors).toEqual(
      expect.arrayContaining([
        expect.stringMatching(/金額|amount/i),
        expect.stringMatching(/請求日|billingDate/i),
        expect.stringMatching(/サービス|service/i),
      ])
    );
  });
});