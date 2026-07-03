import { describe, test, expect, beforeEach } from "@jest/globals";
import {
  applyDocumentNamingConvention,
  validateNamingConventionApplication,
  checkAccessPermissionByRole,
  getDocumentMetadataAfterApplication,
  verifySystemLogEntry,
} from "../../src/logic/it-1-br-1781935279444-1-2-1";

describe("月次サマリーテンプレートの定義・管理機能 - ドキュメント統一命名規則適用", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // SCEN-1062
  test("複数の標準手順書に統一命名規則、フォルダ構成、アクセス権限が正しく適用される", () => {
    // Arrange: テスト対象の複数ドキュメント（最低3件以上）を準備
    const input_documents = [
      {
        document_id: "DOC-001",
        current_name: "営業担当向けバックオフィス手順書_v1_final",
        current_folder_path: "/Shared Drives/営業部/ドキュメント/手順書",
        current_permissions: [
          { role: "admin", access: "edit" },
          { role: "operator", access: "view" },
        ],
      },
      {
        document_id: "DOC-002",
        current_name: "請求書作成_マニュアル（最新）",
        current_folder_path: "/My Drive/バックオフィス",
        current_permissions: [
          { role: "admin", access: "edit" },
          { role: "viewer", access: "view" },
        ],
      },
      {
        document_id: "DOC-003",
        current_name: "営業報告書 集計 手順書",
        current_folder_path: "/Shared Drives/本社/マニュアル",
        current_permissions: [
          { role: "admin", access: "edit" },
          { role: "operator", access: "comment" },
        ],
      },
      {
        document_id: "DOC-004",
        current_name: "契約書管理業務_SOP_ver2",
        current_folder_path: "/Shared Drives/営業部/契約管理",
        current_permissions: [
          { role: "admin", access: "edit" },
          { role: "manager", access: "edit" },
        ],
      },
    ];

    const input_naming_template = {
      template_id: "TMPL-NAMING-001",
      naming_pattern: "BP-{document_type}-{version_number}",
      version_number: "001",
      folder_structure: "/Shared Drives/営業代行/バックオフィス/{document_category}/{document_type}",
      access_permission_rules: {
        admin: "edit",
        manager: "edit",
        operator: "view",
        viewer: "view",
      },
      applied_timestamp: "2024-01-15T09:00:00Z",
    };

    const input_user_role = "admin";

    // Act: 統一命名規則適用関数を呼び出す
    const result_application = applyDocumentNamingConvention({
      documents: input_documents,
      naming_template: input_naming_template,
      user_role: input_user_role,
    });

    // Assert: 適用結果の基本構造を確認
    expect(result_application.success).toBe(true);
    expect(result_application.applied_document_count).toBe(4);
    expect(result_application.total_document_count).toBe(4);

    // Act & Assert: 各ドキュメントのファイル名が統一命名規則に従っているか確認
    const validation_naming = validateNamingConventionApplication({
      applied_documents: result_application.applied_documents,
      naming_pattern: input_naming_template.naming_pattern,
    });

    expect(validation_naming.all_names_compliant).toBe(true);
    expect(validation_naming.compliant_count).toBe(4);
    expect(validation_naming.non_compliant_count).toBe(0);
    expect(validation_naming.compliant_documents).toContainEqual(
      expect.objectContaining({
        document_id: "DOC-001",
        new_name: expect.stringMatching(/^BP-/),
      })
    );

    // Assert: 適用後のファイル名が正しいパターンで検証
    const doc_001_new_name = result_application.applied_documents.find(
      (d) => d.document_id === "DOC-001"
    )?.new_name;
    expect(doc_001_new_name).toMatch(/^BP-[a-zA-Z0-9-]+-001$/);

    const doc_002_new_name = result_application.applied_documents.find(
      (d) => d.document_id === "DOC-002"
    )?.new_name;
    expect(doc_002_new_name).toMatch(/^BP-[a-zA-Z0-9-]+-001$/);

    // Act & Assert: 各ドキュメントのフォルダ構成が統一されているか確認
    result_application.applied_documents.forEach((doc) => {
      expect(doc.new_folder_path).toContain(
        "/Shared Drives/営業代行/バックオフィス/"
      );
    });

    const folder_structure_valid = result_application.applied_documents.every(
      (doc) => doc.new_folder_path.startsWith("/Shared Drives/営業代行/バックオフィス/")
    );
    expect(folder_structure_valid).toBe(true);

    // Act & Assert: 管理者ロールのアクセス権限検証
    const admin_permission_check = checkAccessPermissionByRole({
      document_id: "DOC-001",
      user_role: "admin",
      applied_permissions: result_application.applied_documents[0]
        .new_permissions,
    });

    expect(admin_permission_check.has_access).toBe(true);
    expect(admin_permission_check.permission_level).toBe("edit");

    // Act & Assert: 一般ユーザー（operator）ロールのアクセス権限検証
    const operator_permission_check = checkAccessPermissionByRole({
      document_id: "DOC-001",
      user_role: "operator",
      applied_permissions: result_application.applied_documents[0]
        .new_permissions,
    });

    expect(operator_permission_check.has_access).toBe(true);
    expect(operator_permission_check.permission_level).toBe("view");

    // Act & Assert: 閲覧者ロールのアクセス権限検証
    const viewer_permission_check = checkAccessPermissionByRole({
      document_id: "DOC-001",
      user_role: "viewer",
      applied_permissions: result_application.applied_documents[0]
        .new_permissions,
    });

    expect(viewer_permission_check.has_access).toBe(true);
    expect(viewer_permission_check.permission_level).toBe("view");

    // Act & Assert: 権限なしのロール（unauthorized）のアクセス権限検証
    const unauthorized_permission_check = checkAccessPermissionByRole({
      document_id: "DOC-001",
      user_role: "unauthorized",
      applied_permissions: result_application.applied_documents[0]
        .new_permissions,
    });

    expect(unauthorized_permission_check.has_access).toBe(false);

    // Act & Assert: 適用されたドキュメントのメタデータ情報を確認
    const metadata_check = getDocumentMetadataAfterApplication({
      document_id: "DOC-001",
      applied_documents: result_application.applied_documents,
    });

    expect(metadata_check.document_id).toBe("DOC-001");
    expect(metadata_check.applied_at).toBe("2024-01-15T09:00:00Z");
    expect(metadata_check.applied_by_role).toBe("admin");
    expect(metadata_check.naming_template_id).toBe("TMPL-NAMING-001");
    expect(metadata_check.new_name).toBeDefined();
    expect(metadata_check.new_folder_path).toBeDefined();
    expect(metadata_check.new_permissions).toBeDefined();

    // Act & Assert: システムログに命名規則適用の成功記録が保存されていることを確認
    const log_entry = verifySystemLogEntry({
      applied_documents_count: result_application.applied_document_count,
      naming_template_id: input_naming_template.template_id,
      applied_by_role: input_user_role,
      applied_timestamp: input_naming_template.applied_timestamp,
    });

    expect(log_entry.log_created).toBe(true);
    expect(log_entry.log_entry_id).toBeDefined();
    expect(log_entry.log_entry_id).toMatch(/^LOG-NAMING-/);
    expect(log_entry.action_type).toBe("NAMING_CONVENTION_APPLIED");
    expect(log_entry.status).toBe("SUCCESS");
    expect(log_entry.document_count).toBe(4);
    expect(log_entry.template_id_in_log).toBe("TMPL-NAMING-001");
    expect(log_entry.executed_by_role).toBe("admin");
    expect(log_entry.execution_timestamp).toBe("2024-01-15T09:00:00Z");

    // Assert: 全体的な適用成功の総合判定
    expect(result_application.success).toBe(true);
    expect(validation_naming.all_names_compliant).toBe(true);
    expect(folder_structure_valid).toBe(true);
    expect(admin_permission_check.has_access).toBe(true);
    expect(operator_permission_check.has_access).toBe(true);
    expect(viewer_permission_check.has_access).toBe(true);
    expect(log_entry.log_created).toBe(true);
  });
});