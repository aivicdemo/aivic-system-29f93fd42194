import { describe, test, expect, beforeEach } from '@jest/globals';
import {
  registerDocumentVersion,
  retrieveDocumentVersionHistory,
} from '../../src/logic/it-1781935279444-1-1-1';

describe('営業データ項目のメタデータ管理機能 - 契約書バージョン管理', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('SCEN-829: 同一ファイルが連続して複数回アップロードされたとき、各更新が個別バージョンとして記録される', () => {
    // === Precondition: テスト用契約書ファイルを準備 ===
    const contractFileName = 'contract.pdf';
    const customerId = 'CUST-12345';
    const uploadedBy = 'user-001';

    // === 1回目アップロード: v1 として記録 ===
    const fileContent_v1 = 'Initial contract content - Date: 2024-01-15';
    const uploadTimestamp_v1 = new Date('2024-01-15T09:00:00Z');

    const result_v1 = registerDocumentVersion({
      fileName: contractFileName,
      customerId: customerId,
      fileContent: fileContent_v1,
      uploadedBy: uploadedBy,
      uploadedAt: uploadTimestamp_v1,
      documentType: 'CONTRACT',
    });

    expect(result_v1.versionNumber).toBe(1);
    expect(result_v1.fileName).toBe(contractFileName);
    expect(result_v1.customerId).toBe(customerId);
    expect(result_v1.uploadedAt).toEqual(uploadTimestamp_v1);
    expect(result_v1.fileContent).toBe(fileContent_v1);

    // === 2回目アップロード: v2 として記録 ===
    const fileContent_v2 = 'Updated contract content - Date: 2024-01-16';
    const uploadTimestamp_v2 = new Date('2024-01-16T10:30:00Z');

    const result_v2 = registerDocumentVersion({
      fileName: contractFileName,
      customerId: customerId,
      fileContent: fileContent_v2,
      uploadedBy: uploadedBy,
      uploadedAt: uploadTimestamp_v2,
      documentType: 'CONTRACT',
    });

    expect(result_v2.versionNumber).toBe(2);
    expect(result_v2.fileName).toBe(contractFileName);
    expect(result_v2.customerId).toBe(customerId);
    expect(result_v2.uploadedAt).toEqual(uploadTimestamp_v2);
    expect(result_v2.fileContent).toBe(fileContent_v2);

    // === 3回目アップロード: v3 として記録 ===
    const fileContent_v3 = 'Final contract content - Date: 2024-01-17';
    const uploadTimestamp_v3 = new Date('2024-01-17T14:15:00Z');

    const result_v3 = registerDocumentVersion({
      fileName: contractFileName,
      customerId: customerId,
      fileContent: fileContent_v3,
      uploadedBy: uploadedBy,
      uploadedAt: uploadTimestamp_v3,
      documentType: 'CONTRACT',
    });

    expect(result_v3.versionNumber).toBe(3);
    expect(result_v3.fileName).toBe(contractFileName);
    expect(result_v3.customerId).toBe(customerId);
    expect(result_v3.uploadedAt).toEqual(uploadTimestamp_v3);
    expect(result_v3.fileContent).toBe(fileContent_v3);

    // === バージョン履歴を取得 ===
    const versionHistory = retrieveDocumentVersionHistory({
      fileName: contractFileName,
      customerId: customerId,
    });

    // === バージョン履歴に全3つのバージョンが表示される ===
    expect(versionHistory).toHaveLength(3);

    // === v1 の検証 ===
    expect(versionHistory[0].versionNumber).toBe(1);
    expect(versionHistory[0].fileName).toBe(contractFileName);
    expect(versionHistory[0].customerId).toBe(customerId);
    expect(versionHistory[0].uploadedAt).toEqual(uploadTimestamp_v1);
    expect(versionHistory[0].fileContent).toBe(fileContent_v1);

    // === v2 の検証 ===
    expect(versionHistory[1].versionNumber).toBe(2);
    expect(versionHistory[1].fileName).toBe(contractFileName);
    expect(versionHistory[1].customerId).toBe(customerId);
    expect(versionHistory[1].uploadedAt).toEqual(uploadTimestamp_v2);
    expect(versionHistory[1].fileContent).toBe(fileContent_v2);

    // === v3 の検証 ===
    expect(versionHistory[2].versionNumber).toBe(3);
    expect(versionHistory[2].fileName).toBe(contractFileName);
    expect(versionHistory[2].customerId).toBe(customerId);
    expect(versionHistory[2].uploadedAt).toEqual(uploadTimestamp_v3);
    expect(versionHistory[2].fileContent).toBe(fileContent_v3);

    // === 各バージョンのアップロード日時が異なることを確認 ===
    expect(versionHistory[0].uploadedAt.getTime()).not.toBe(
      versionHistory[1].uploadedAt.getTime()
    );
    expect(versionHistory[1].uploadedAt.getTime()).not.toBe(
      versionHistory[2].uploadedAt.getTime()
    );
    expect(versionHistory[0].uploadedAt.getTime()).not.toBe(
      versionHistory[2].uploadedAt.getTime()
    );

    // === 各バージョンのファイル内容が異なることを確認 ===
    expect(versionHistory[0].fileContent).not.toBe(versionHistory[1].fileContent);
    expect(versionHistory[1].fileContent).not.toBe(versionHistory[2].fileContent);
    expect(versionHistory[0].fileContent).not.toBe(versionHistory[2].fileContent);

    // === 時系列順序が正しい（昇順）ことを確認 ===
    for (let i = 0; i < versionHistory.length - 1; i++) {
      expect(versionHistory[i].uploadedAt.getTime()).toBeLessThan(
        versionHistory[i + 1].uploadedAt.getTime()
      );
    }
  });
});