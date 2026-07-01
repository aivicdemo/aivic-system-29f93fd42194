import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { validateDocumentVersionMetadata } from '../../src/logic/it-1781935279444-1-1-1';

describe('営業データ項目メタデータ管理機能 - 文書バージョン自動判定・表示機能', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // SCEN-804
  test('バージョン情報が欠落または不正な場合にエラーハンドリングされる', () => {
    // ケース1: バージョン情報が完全に欠落した文書ファイル
    const documentWithMissingVersion = {
      documentId: 'doc_001',
      fileName: 'contract_sample.pdf',
      uploadedAt: '2024-01-15T10:30:00Z',
      uploadedBy: 'user_101',
      versionInfo: undefined,
      fileSize: 2048,
      fileType: 'application/pdf'
    };

    expect(() => {
      validateDocumentVersionMetadata(documentWithMissingVersion);
    }).toThrow(/バージョン情報/);

    // ケース2: バージョン情報が null の場合
    const documentWithNullVersion = {
      documentId: 'doc_002',
      fileName: 'proposal_sample.docx',
      uploadedAt: '2024-01-15T10:35:00Z',
      uploadedBy: 'user_102',
      versionInfo: null,
      fileSize: 3072,
      fileType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    };

    expect(() => {
      validateDocumentVersionMetadata(documentWithNullVersion);
    }).toThrow(/バージョン情報/);

    // ケース3: バージョン番号が不正な形式（文字列ではなく数値）
    const documentWithInvalidVersionType = {
      documentId: 'doc_003',
      fileName: 'contract_v2.pdf',
      uploadedAt: '2024-01-15T10:40:00Z',
      uploadedBy: 'user_103',
      versionInfo: {
        versionNumber: 'invalid-format',
        releaseDate: '2024-01-15',
        changeLog: 'Invalid version format'
      },
      fileSize: 2560,
      fileType: 'application/pdf'
    };

    expect(() => {
      validateDocumentVersionMetadata(documentWithInvalidVersionType);
    }).toThrow(/バージョン/);

    // ケース4: リリース日が不正な形式（ISO 8601 以外）
    const documentWithInvalidReleaseDate = {
      documentId: 'doc_004',
      fileName: 'proposal_v1.docx',
      uploadedAt: '2024-01-15T10:45:00Z',
      uploadedBy: 'user_104',
      versionInfo: {
        versionNumber: '1.0.0',
        releaseDate: '15/01/2024',
        changeLog: 'Initial release'
      },
      fileSize: 3584,
      fileType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    };

    expect(() => {
      validateDocumentVersionMetadata(documentWithInvalidReleaseDate);
    }).toThrow(/リリース日/);

    // ケース5: versionInfo オブジェクトが空の場合
    const documentWithEmptyVersionInfo = {
      documentId: 'doc_005',
      fileName: 'contract_empty.pdf',
      uploadedAt: '2024-01-15T10:50:00Z',
      uploadedBy: 'user_105',
      versionInfo: {},
      fileSize: 1024,
      fileType: 'application/pdf'
    };

    expect(() => {
      validateDocumentVersionMetadata(documentWithEmptyVersionInfo);
    }).toThrow(/versionNumber/);

    // ケース6: 正常なバージョン情報を持つ文書（成功ケース）
    const validDocument = {
      documentId: 'doc_006',
      fileName: 'contract_valid.pdf',
      uploadedAt: '2024-01-15T11:00:00Z',
      uploadedBy: 'user_106',
      versionInfo: {
        versionNumber: '2.1.0',
        releaseDate: '2024-01-15',
        changeLog: 'Updated payment terms'
      },
      fileSize: 2048,
      fileType: 'application/pdf'
    };

    const result = validateDocumentVersionMetadata(validDocument);

    expect(result).toEqual({
      isValid: true,
      documentId: 'doc_006',
      versionNumber: '2.1.0',
      releaseDate: '2024-01-15',
      validatedAt: expect.any(String),
      errorMessage: null
    });

    // ケース7: エラーハンドリング後にシステムが正常に動作することを確認
    // (前のエラーがシステム状態に影響しないことを確認)
    const anotherValidDocument = {
      documentId: 'doc_007',
      fileName: 'contract_another.pdf',
      uploadedAt: '2024-01-15T11:05:00Z',
      uploadedBy: 'user_107',
      versionInfo: {
        versionNumber: '1.0.0',
        releaseDate: '2024-01-10',
        changeLog: 'First version'
      },
      fileSize: 1536,
      fileType: 'application/pdf'
    };

    const secondResult = validateDocumentVersionMetadata(anotherValidDocument);

    expect(secondResult).toEqual({
      isValid: true,
      documentId: 'doc_007',
      versionNumber: '1.0.0',
      releaseDate: '2024-01-10',
      validatedAt: expect.any(String),
      errorMessage: null
    });

    // ケース8: changeLog が欠落している場合（オプション項目）
    const documentWithoutChangeLog = {
      documentId: 'doc_008',
      fileName: 'proposal_minimal.docx',
      uploadedAt: '2024-01-15T11:10:00Z',
      uploadedBy: 'user_108',
      versionInfo: {
        versionNumber: '3.0.0',
        releaseDate: '2024-01-12'
      },
      fileSize: 2816,
      fileType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    };

    const minimalResult = validateDocumentVersionMetadata(documentWithoutChangeLog);

    expect(minimalResult).toEqual({
      isValid: true,
      documentId: 'doc_008',
      versionNumber: '3.0.0',
      releaseDate: '2024-01-12',
      validatedAt: expect.any(String),
      errorMessage: null
    });
  });
});