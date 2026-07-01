import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { validateContractDocumentMetadata } from '../../src/logic/it-1781935279444-1-1-1';

describe('営業データ項目のメタデータ管理機能', () => {
  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  // SCEN-842
  test('契約書・提案資料のバージョン管理機能 - 更新者情報が正しく紐付かずアップロードされた場合、エラーとして検出される', () => {
    const input = {
      fileName: 'contract_draft_v2.pdf',
      fileSize: 2048576,
      mimeType: 'application/pdf',
      updatedBy: '', // 更新者情報が欠落
      updatedAt: new Date('2024-01-15T10:30:00Z'),
      documentType: 'contract',
      targetCustomerId: 'CUST-001',
      targetCaseId: 'CASE-001',
      changeDescription: 'Updated pricing terms',
      effectiveStartDate: new Date('2024-02-01T00:00:00Z'),
      effectiveEndDate: new Date('2024-12-31T23:59:59Z'),
      approvalStatus: 'pending'
    };

    const expectedErrorCode = 'ERR_INVALID_UPDATER_INFO';
    const expectedErrorMessage = '更新者情報が正しく紐付かれていません';

    try {
      validateContractDocumentMetadata(input);
      fail('Expected error to be thrown');
    } catch (error: unknown) {
      if (error instanceof Error) {
        expect(error.message).toMatch(/更新者情報/);
        expect(consoleErrorSpy).toHaveBeenCalledWith(
          expect.stringContaining(expectedErrorCode)
        );
      } else {
        fail('Error should be an instance of Error');
      }
    }

    expect(consoleErrorSpy).toHaveBeenCalled();
  });
});