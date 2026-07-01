import { selectLatestDocumentVersion } from '../../src/logic/it-1781935279444-1-1-1';

describe('営業データ項目のメタデータ管理機能 - 複数バージョン優先度ルール', () => {
  test('SCEN-797: 有効期限が今日より1日先の資料と無期限の資料が存在する場合、無期限の資料が優先度ルールに基づいて正しく選定される', () => {
    const today = new Date('2024-01-15');
    const tomorrowDate = new Date('2024-01-16');
    
    const version1 = {
      documentId: 'doc_001',
      versionNumber: 1,
      expirationDate: tomorrowDate,
      lastUpdatedAt: new Date('2024-01-10T09:00:00Z'),
      documentName: '提案資料_v1',
      isActive: true,
    };

    const version2 = {
      documentId: 'doc_001',
      versionNumber: 2,
      expirationDate: null,
      lastUpdatedAt: new Date('2024-01-14T15:30:00Z'),
      documentName: '提案資料_v2',
      isActive: true,
    };

    const documents = [version1, version2];

    const result = selectLatestDocumentVersion(documents, today);

    expect(result.versionNumber).toBe(2);
    expect(result.expirationDate).toBeNull();
    expect(result.lastUpdatedAt).toEqual(new Date('2024-01-14T15:30:00Z'));
    expect(result.documentName).toBe('提案資料_v2');
    expect(result.isActive).toBe(true);
  });
});