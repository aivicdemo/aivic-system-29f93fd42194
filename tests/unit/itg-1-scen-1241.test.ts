import { validateContractChangeCompliance } from '../../src/logic/it-1781935279444-2-1-1';

describe('営業データ入力時の品質検証ルール定義・実行機能', () => {
  test('SCEN-1241: 契約変更内容のルール適合性判定機能 - 変更内容の納期が境界値（契約上の最大納期延長日数）の場合、適合判定される', () => {
    // Arrange: テストデータの準備
    const contractMaxExtensionDays = 30;
    const originalDeliveryDate = new Date('2024-02-15T00:00:00Z');
    const changeDeliveryDate = new Date('2024-03-16T00:00:00Z'); // 30日延長
    const contractChangeData = {
      contractId: 'CONTRACT-001',
      originalDeliveryDate: originalDeliveryDate.toISOString(),
      changeDeliveryDate: changeDeliveryDate.toISOString(),
      contractMaxExtensionDays: contractMaxExtensionDays,
      changeReason: '顧客要望による納期延長',
      changeType: 'delivery_extension',
    };

    // Act: ルール適合性判定機能を実行
    const result = validateContractChangeCompliance(contractChangeData);

    // Assert: 判定結果を検証
    expect(result).toEqual({
      complianceStatus: '適合',
      isValid: true,
      extensionDays: 30,
      maxAllowedDays: 30,
      errorMessage: null,
    });
    expect(result.complianceStatus).toBe('適合');
    expect(result.isValid).toBe(true);
    expect(result.extensionDays).toBe(30);
  });
});