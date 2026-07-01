import {
  applyAccessPermissionUnificationRule,
  type AccessPermissionUnificationRequest,
  type AccessPermissionUnificationResponse,
} from "../../src/logic/it-1-br-1781935279444-1-2-1";

describe("月次サマリーテンプレート定義・管理機能 - ドキュメント命名規則・アクセス権限競合解決", () => {
  // SCEN-1086: [edge] ドキュメント命名規則・フォルダ構成自動適用機能 - アクセス権限が既存ドキュメントと競合する場合に権限統一ルールが適用される
  test("既存ドキュメントのアクセス権限が競合する場合、権限統一ルール適用時に既存権限を上書きして統一される", () => {
    const existingDocument = {
      documentId: "doc-2024-001",
      documentName: "2024年度_営業実績.xlsx",
      folderPath: "/営業部門/月次集計/2024年度",
      currentAccessPermissions: [
        {
          principalId: "user-a",
          principalName: "テストユーザーA",
          permissionLevel: "READ_ONLY",
          appliedAt: "2024-01-01T09:00:00Z",
        },
        {
          principalId: "user-b",
          principalName: "テストユーザーB",
          permissionLevel: "NONE",
          appliedAt: "2024-01-01T09:00:00Z",
        },
      ],
      folderStructureMetadata: {
        parentFolderId: "folder-sales-2024",
        createdAt: "2024-01-01T08:00:00Z",
        lastModifiedAt: "2024-01-15T10:30:00Z",
      },
    };

    const unificationRuleRequest: AccessPermissionUnificationRequest = {
      documentId: existingDocument.documentId,
      documentName: existingDocument.documentName,
      folderPath: existingDocument.folderPath,
      unificationRuleId: "rule-sales-all-edit",
      unificationRuleName: "営業部門_全員編集可能",
      targetPermissionLevel: "EDIT",
      targetPrincipals: [
        { principalId: "user-a", principalName: "テストユーザーA" },
        { principalId: "user-b", principalName: "テストユーザーB" },
      ],
      conflictResolutionStrategy: "OVERRIDE_EXISTING",
      appliedBy: "system-admin",
      appliedAt: "2024-01-15T11:00:00Z",
      preserveFolderStructure: true,
    };

    const response = applyAccessPermissionUnificationRule(unificationRuleRequest);

    expect(response.success).toBe(true);
    expect(response.documentId).toBe("doc-2024-001");
    expect(response.documentName).toBe("2024年度_営業実績.xlsx");
    expect(response.folderPath).toBe("/営業部門/月次集計/2024年度");

    expect(response.updatedAccessPermissions).toHaveLength(2);
    expect(response.updatedAccessPermissions).toContainEqual({
      principalId: "user-a",
      principalName: "テストユーザーA",
      permissionLevel: "EDIT",
      previousPermissionLevel: "READ_ONLY",
      appliedAt: "2024-01-15T11:00:00Z",
    });
    expect(response.updatedAccessPermissions).toContainEqual({
      principalId: "user-b",
      principalName: "テストユーザーB",
      permissionLevel: "EDIT",
      previousPermissionLevel: "NONE",
      appliedAt: "2024-01-15T11:00:00Z",
    });

    expect(response.conflictDetected).toBe(true);
    expect(response.conflictsResolved).toEqual([
      {
        principalId: "user-a",
        conflictType: "PERMISSION_LEVEL_MISMATCH",
        previousState: "READ_ONLY",
        newState: "EDIT",
        resolutionApplied: "OVERRIDE_EXISTING",
      },
      {
        principalId: "user-b",
        conflictType: "PERMISSION_MISSING",
        previousState: "NONE",
        newState: "EDIT",
        resolutionApplied: "OVERRIDE_EXISTING",
      },
    ]);

    expect(response.folderStructurePreserved).toBe(true);
    expect(response.folderStructureMetadata).toEqual({
      parentFolderId: "folder-sales-2024",
      createdAt: "2024-01-01T08:00:00Z",
      lastModifiedAtBeforeUpdate: "2024-01-15T10:30:00Z",
      lastModifiedAtAfterUpdate: "2024-01-15T11:00:00Z",
    });

    expect(response.systemLogEntry).toBeDefined();
    expect(response.systemLogEntry.logId).toBeDefined();
    expect(response.systemLogEntry.timestamp).toBe("2024-01-15T11:00:00Z");
    expect(response.systemLogEntry.action).toBe(
      "APPLY_ACCESS_PERMISSION_UNIFICATION_RULE"
    );
    expect(response.systemLogEntry.documentId).toBe("doc-2024-001");
    expect(response.systemLogEntry.unificationRuleId).toBe("rule-sales-all-edit");
    expect(response.systemLogEntry.conflictResolutionStrategy).toBe(
      "OVERRIDE_EXISTING"
    );
    expect(response.systemLogEntry.conflictsResolvedCount).toBe(2);
    expect(response.systemLogEntry.operatedBy).toBe("system-admin");
    expect(response.systemLogEntry.status).toBe("SUCCESS");

    expect(response.userAccessibilityAfterUpdate).toBeDefined();
    expect(response.userAccessibilityAfterUpdate).toEqual([
      {
        principalId: "user-a",
        canAccess: true,
        canRead: true,
        canEdit: true,
        effectivePermissionLevel: "EDIT",
      },
      {
        principalId: "user-b",
        canAccess: true,
        canRead: true,
        canEdit: true,
        effectivePermissionLevel: "EDIT",
      },
    ]);

    expect(response.ruleApplicationSummary).toEqual({
      ruleId: "rule-sales-all-edit",
      ruleName: "営業部門_全員編集可能",
      documentsAffected: 1,
      principalsAffected: 2,
      permissionsUpdated: 2,
      conflictsDetected: 2,
      conflictsResolved: 2,
      folderStructuresPreserved: 1,
      operationDurationMs: expect.any(Number),
    });

    expect(response.ruleApplicationSummary.operationDurationMs).toBeGreaterThan(0);
    expect(response.ruleApplicationSummary.operationDurationMs).toBeLessThan(
      5000
    );

    expect(response.auditTrail).toBeDefined();
    expect(response.auditTrail).toHaveLength(3);
    expect(response.auditTrail[0].eventType).toBe("RULE_APPLICATION_INITIATED");
    expect(response.auditTrail[1].eventType).toBe("CONFLICT_RESOLUTION_EXECUTED");
    expect(response.auditTrail[2].eventType).toBe("PERMISSIONS_UPDATED");
  });
});