import { recordVersionHistory } from '../../src/logic/it-1781935279444-2-2-1';

describe('営業データの完全性・正確性を自動検証し、不足データ・誤りを検出・通知する機能', () => {
  // SCEN-766
  test('更新者情報が欠落している場合にエラーとして検出される', () => {
    const input = {
      documentId: 'DOC-20240115-001',
      documentType: 'contract',
      documentName: '基本契約書_2024年版',
      fileUrl: 'https://storage.example.com/contracts/basic-2024.pdf',
      updatedBy: '',
      updatedAt: new Date('2024-01-15T10:30:00Z'),
      changeDescription: 'クライアント名表記修正、有効期限延長'
    };

    expect(() => recordVersionHistory(input)).toThrow(/更新者/);
  });
});