import { validateContractChangeContent } from '../../src/logic/it-1781935279444-2-2-1';

describe('契約書・提案資料変更内容妥当性判定機能', () => {
  // SCEN-764: [edge] 契約書・提案資料変更内容妥当性判定機能 - 変更内容が空文字列またはnullの場合にエラーとして検出される
  test('変更内容が空文字列またはnullの場合にエラーとして検出される', () => {
    // 空文字列のケース
    const emptyStringResult = validateContractChangeContent({
      changeContent: '',
      contractId: 'CONTRACT-001',
      documentType: 'CONTRACT',
      applicableCustomers: ['CUST-001'],
      appliedCases: ['CASE-001'],
    });

    expect(emptyStringResult.isValid).toBe(false);
    expect(emptyStringResult.errorCode).toBe('VALIDATION_ERROR_001');
    expect(emptyStringResult.errorMessage).toMatch(/変更内容|必須/);

    // nullのケース
    const nullResult = validateContractChangeContent({
      changeContent: null as any,
      contractId: 'CONTRACT-001',
      documentType: 'CONTRACT',
      applicableCustomers: ['CUST-001'],
      appliedCases: ['CASE-001'],
    });

    expect(nullResult.isValid).toBe(false);
    expect(nullResult.errorCode).toBe('VALIDATION_ERROR_001');
    expect(nullResult.errorMessage).toMatch(/変更内容|必須/);

    // 両ケースでエラーコードが一致していることを確認
    expect(emptyStringResult.errorCode).toBe(nullResult.errorCode);

    // 有効な変更内容の場合は成功
    const validResult = validateContractChangeContent({
      changeContent: '料金体系を改定しました',
      contractId: 'CONTRACT-001',
      documentType: 'CONTRACT',
      applicableCustomers: ['CUST-001'],
      appliedCases: ['CASE-001'],
    });

    expect(validResult.isValid).toBe(true);
    expect(validResult.errorCode).toBeUndefined();
    expect(validResult.errorMessage).toBeUndefined();
  });
});