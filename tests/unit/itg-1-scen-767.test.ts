import { validateContractDocumentVersionExpiry } from '../../src/logic/it-1781935279444-2-2-1';

describe('契約書・提案資料バージョン履歴自動記録機能', () => {
  // SCEN-767: [error] 契約書・提案資料バージョン履歴自動記録機能 - 有効期限が過去日時の場合にエラーとして検出される
  test('有効期限が過去日時の場合、入力値検証エラーが発生し、適切なエラーメッセージが返される', () => {
    const now = new Date('2025-06-15T10:00:00Z');
    const pastExpiryDate = new Date('2020-01-01T00:00:00Z');

    const input = {
      documentId: 'DOC-20250615-001',
      documentType: 'contract',
      versionNumber: 2,
      fileName: 'contract_v2.pdf',
      uploadedAt: now,
      expiryDate: pastExpiryDate,
      updatedBy: 'user-12345',
      changeDescription: 'Updated contract terms',
    };

    expect(() =>
      validateContractDocumentVersionExpiry(input)
    ).toThrow(/有効期限/);
  });
});