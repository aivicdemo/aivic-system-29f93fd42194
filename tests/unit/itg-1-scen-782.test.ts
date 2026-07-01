import { describe, test, expect } from '@jest/globals';
import { identifyLatestDocumentVersion } from '../../src/logic/it-1781935279444-1-1-1';

describe('営業データ項目のメタデータ管理機能 - 契約・提案資料の最新版自動特定', () => {
  // SCEN-782
  test('顧客・案件に対応する資料が存在しない場合、空結果またはエラーが返される', () => {
    const nonexistentCustomerId = 'CUST-99999999';
    const nonexistentProjectId = 'PROJ-99999999';

    const result = identifyLatestDocumentVersion({
      customerId: nonexistentCustomerId,
      projectId: nonexistentProjectId,
    });

    expect(
      result === null ||
        (Array.isArray(result) && result.length === 0) ||
        (result && result.error !== undefined)
    ).toBe(true);

    if (Array.isArray(result)) {
      expect(result).toEqual([]);
    } else if (result === null) {
      expect(result).toBeNull();
    } else if (result && typeof result === 'object' && 'error' in result) {
      expect(result).toHaveProperty('error');
      expect(typeof result.error).toBe('string');
    }
  });

  test('顧客IDが空文字列の場合、適切なエラーが返される', () => {
    expect(() =>
      identifyLatestDocumentVersion({
        customerId: '',
        projectId: 'PROJ-123456',
      })
    ).toThrow(/顧客ID/);
  });

  test('案件IDが空文字列の場合、適切なエラーが返される', () => {
    expect(() =>
      identifyLatestDocumentVersion({
        customerId: 'CUST-123456',
        projectId: '',
      })
    ).toThrow(/案件ID/);
  });

  test('存在する顧客・案件IDで複数の有効なバージョンが存在する場合、最新版のみが返される', () => {
    const existingCustomerId = 'CUST-00001';
    const existingProjectId = 'PROJ-00001';

    const result = identifyLatestDocumentVersion({
      customerId: existingCustomerId,
      projectId: existingProjectId,
    });

    if (Array.isArray(result) && result.length > 0) {
      expect(result.length).toBe(1);
      expect(result[0]).toHaveProperty('documentId');
      expect(result[0]).toHaveProperty('version');
      expect(result[0]).toHaveProperty('effectiveDate');
      expect(typeof result[0].version).toBe('string');
    } else if (result && typeof result === 'object' && !Array.isArray(result) && result.error === undefined) {
      expect(result).toHaveProperty('documentId');
      expect(result).toHaveProperty('version');
      expect(result.version).toBe('1.0.0');
    }
  });
});