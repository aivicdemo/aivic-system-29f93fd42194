import { validateContractVersionConsistency } from '../../src/logic/it-1781935279444-1-1-1';

describe('営業データ項目のメタデータ管理機能 - 契約書バージョン管理検証', () => {
  // SCEN-1080
  test('バージョン管理に不整合がある場合に不合格判定される', () => {
    // Arrange: バージョン番号が不整合な契約書データを準備
    const contractDataWithVersionMismatch = {
      contractId: 'CT-2024-001',
      headerVersion: '1.0',
      detailVersion: '1.1',
      contractName: 'テスト契約書',
      lastUpdatedAt: '2024-01-15T10:00:00Z',
      updatedBy: 'user-123',
    };

    // Act: 検証処理を実行
    const validationResult = validateContractVersionConsistency(
      contractDataWithVersionMismatch
    );

    // Assert: 検証結果が『不合格』と判定されること
    expect(validationResult.isValid).toBe(false);
    expect(validationResult.status).toBe('不合格');

    // バージョン不整合の詳細がエラーメッセージに含まれていること
    expect(validationResult.errorMessage).toMatch(/バージョン/);
    expect(validationResult.errorMessage).toMatch(/1\.0/);
    expect(validationResult.errorMessage).toMatch(/1\.1/);

    // エラー詳細に具体的なバージョン番号の不一致内容が記録されること
    expect(validationResult.details).toBeDefined();
    expect(validationResult.details.headerVersionValue).toBe('1.0');
    expect(validationResult.details.detailVersionValue).toBe('1.1');
    expect(validationResult.details.mismatchDetected).toBe(true);
  });
});