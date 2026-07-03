import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import {
  applyUnifiedNamingConvention,
  updateDocumentReferencePaths,
  recordAuditLog,
  verifyDocumentIntegrity,
} from '../../src/logic/it-1-br-1781935279444-1-2-1';

describe('月次サマリーテンプレート定義・管理機能 - ドキュメント統一命名規則適用', () => {
  // SCEN-1064
  it('既に異なる命名規則が適用されているドキュメントに対して、新しい統一命名規則が上書き適用され、参照パスが自動更新される', () => {
    // ========== Setup ==========
    // 既に異なる命名規則が適用されているドキュメント
    const existingDocumentId = 'doc-20240101-001';
    const existingDocumentName = 'Doc_20240101_Sales';
    const existingDocumentPath = '/documents/legacy/Doc_20240101_Sales.pdf';

    // ドキュメントを参照している関連データ（複数の参照先）
    const referenceRecord1 = {
      id: 'ref-001',
      sourceDocumentId: 'doc-scenario-001',
      referencedDocumentPath: '/documents/legacy/Doc_20240101_Sales.pdf',
      referenceType: 'monthly_report',
    };

    const referenceRecord2 = {
      id: 'ref-002',
      sourceDocumentId: 'doc-scenario-002',
      referencedDocumentPath: '/documents/legacy/Doc_20240101_Sales.pdf',
      referenceType: 'contract_attachment',
    };

    const externalSystemReference = {
      id: 'ext-ref-001',
      systemName: 'accounting_system',
      referencedDocumentPath: '/documents/legacy/Doc_20240101_Sales.pdf',
    };

    // 新しい統一命名規則
    const unifiedNamingRule = {
      format: 'YYYYMMDDxx_DocumentType_DepartmentCode',
      dateFormat: 'YYYYMMDD',
      documentTypeCode: 'DQM', // Data Quality Management
      departmentCode: 'BO',    // Back Office
      appliedDate: new Date('2024-12-01T09:00:00Z'),
    };

    // 期待される新しいドキュメント名（YYYYMMDDxx_DQM_BO の形式）
    const expectedNewDocumentName = '20240101SL_DQM_BO';
    const expectedNewDocumentPath = '/documents/unified/20240101SL_DQM_BO.pdf';

    // ========== Execute Part 1: 統一命名規則の上書き適用 ==========
    const applyResult = applyUnifiedNamingConvention(
      {
        documentId: existingDocumentId,
        currentName: existingDocumentName,
        currentPath: existingDocumentPath,
      },
      unifiedNamingRule
    );

    // 期待値
    expect(applyResult.documentId).toBe(existingDocumentId);
    expect(applyResult.newName).toBe(expectedNewDocumentName);
    expect(applyResult.newPath).toBe(expectedNewDocumentPath);
    expect(applyResult.previousName).toBe(existingDocumentName);
    expect(applyResult.previousPath).toBe(existingDocumentPath);
    expect(applyResult.appliedAt).toEqual(new Date('2024-12-01T09:00:00Z'));

    // ========== Execute Part 2: 参照パスの自動更新 ==========
    const updateRefResult = updateDocumentReferencePaths(
      {
        oldPath: existingDocumentPath,
        newPath: expectedNewDocumentPath,
        documentId: existingDocumentId,
      },
      [referenceRecord1, referenceRecord2, externalSystemReference]
    );

    // 参照パスが更新されたことを検証
    expect(updateRefResult.updatedCount).toBe(3);
    expect(updateRefResult.failedCount).toBe(0);

    // 各参照が正しく更新されたことを確認
    expect(updateRefResult.updates).toContainEqual(
      expect.objectContaining({
        referenceId: 'ref-001',
        oldPath: existingDocumentPath,
        newPath: expectedNewDocumentPath,
        status: 'success',
      })
    );

    expect(updateRefResult.updates).toContainEqual(
      expect.objectContaining({
        referenceId: 'ref-002',
        oldPath: existingDocumentPath,
        newPath: expectedNewDocumentPath,
        status: 'success',
      })
    );

    expect(updateRefResult.updates).toContainEqual(
      expect.objectContaining({
        referenceId: 'ext-ref-001',
        oldPath: existingDocumentPath,
        newPath: expectedNewDocumentPath,
        status: 'success',
      })
    );

    // ========== Execute Part 3: 参照の整合性検証 ==========
    const integrityResult = verifyDocumentIntegrity(
      {
        documentId: existingDocumentId,
        documentPath: expectedNewDocumentPath,
      },
      [
        {
          ...referenceRecord1,
          referencedDocumentPath: expectedNewDocumentPath,
        },
        {
          ...referenceRecord2,
          referencedDocumentPath: expectedNewDocumentPath,
        },
        {
          ...externalSystemReference,
          referencedDocumentPath: expectedNewDocumentPath,
        },
      ]
    );

    // 参照整合性が保たれていることを確認
    expect(integrityResult.isIntact).toBe(true);
    expect(integrityResult.brokenLinksCount).toBe(0);
    expect(integrityResult.validReferencesCount).toBe(3);
    expect(integrityResult.allReferencesResolved).toBe(true);

    // ========== Execute Part 4: 監査ログ記録 ==========
    const auditLogResult = recordAuditLog(
      {
        action: 'APPLY_UNIFIED_NAMING_CONVENTION',
        documentId: existingDocumentId,
        previousName: existingDocumentName,
        newName: expectedNewDocumentName,
        previousPath: existingDocumentPath,
        newPath: expectedNewDocumentPath,
        affectedReferencesCount: 3,
        namingRuleFormat: unifiedNamingRule.format,
        executedBy: 'admin_user_001',
        executedAt: new Date('2024-12-01T09:00:00Z'),
      }
    );

    // 監査ログが正しく記録されたことを確認
    expect(auditLogResult.logId).toMatch(/^audit-log-\d+$/);
    expect(auditLogResult.action).toBe('APPLY_UNIFIED_NAMING_CONVENTION');
    expect(auditLogResult.documentId).toBe(existingDocumentId);
    expect(auditLogResult.previousName).toBe(existingDocumentName);
    expect(auditLogResult.newName).toBe(expectedNewDocumentName);
    expect(auditLogResult.referencesUpdatedCount).toBe(3);
    expect(auditLogResult.recordedAt).toEqual(new Date('2024-12-01T09:00:00Z'));
    expect(auditLogResult.status).toBe('recorded');

    // ========== Validation: 全体的な整合性 ==========
    // 1. ドキュメント名が正しく変更されている
    expect(applyResult.newName).toBe(expectedNewDocumentName);

    // 2. ドキュメントパスが正しく更新されている
    expect(applyResult.newPath).toBe(expectedNewDocumentPath);

    // 3. すべての参照パスが自動更新されている
    expect(updateRefResult.updatedCount).toBe(3);

    // 4. 更新後も参照が正常に機能している（リンク切れなし）
    expect(integrityResult.isIntact).toBe(true);
    expect(integrityResult.brokenLinksCount).toBe(0);

    // 5. 監査ログに命名規則上書き適用と参照パス自動更新の履歴が記録されている
    expect(auditLogResult.status).toBe('recorded');
    expect(auditLogResult.referencesUpdatedCount).toBe(3);
  });
});