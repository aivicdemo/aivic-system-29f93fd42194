import { determineLatestDocumentVersion } from "../../src/logic/it-1781935279444-1-1-1";

describe("営業データ項目のメタデータ管理機能 - 文書バージョン最新版自動判定", () => {
  test("SCEN-796: バージョン1つのみの文書が最新版として正しく判定される", () => {
    // Arrange: バージョン1つのみの文書データを準備
    const single_version_document = {
      document_id: "DOC-001",
      document_name: "営業データマッピング仕様書",
      document_type: "specification",
      versions: [
        {
          version_id: "VER-001",
          version_number: 1,
          created_at: new Date("2024-01-15T09:00:00Z"),
          created_by: "user_001",
          change_summary: "Initial version",
          is_active: true,
          effective_from: new Date("2024-01-15T00:00:00Z"),
          effective_to: null,
        },
      ],
    };

    // Act: 文書バージョン最新版自動判定機能を実行
    const judgment_result = determineLatestDocumentVersion(
      single_version_document
    );

    // Assert: 判定結果が『最新版』として正しく分類されている
    expect(judgment_result.is_latest_version).toBe(true);
    expect(judgment_result.version_id).toBe("VER-001");
    expect(judgment_result.version_number).toBe(1);

    // Assert: 旧版判定の対象がないことを確認
    expect(judgment_result.has_deprecated_versions).toBe(false);
    expect(judgment_result.deprecated_version_ids).toEqual([]);

    // Assert: 判定処理が正常に完了し、エラーが発生していないこと
    expect(judgment_result.judgment_status).toBe("completed");
    expect(judgment_result.error_occurred).toBe(false);
    expect(judgment_result.error_message).toBeNull();

    // Assert: システムログに判定処理が正常に完了したことが記録されている
    expect(judgment_result.system_log_entry).toBeDefined();
    expect(judgment_result.system_log_entry.log_level).toBe("INFO");
    expect(judgment_result.system_log_entry.log_message).toMatch(
      /document_id.*version_judgment.*completed/i
    );
    expect(judgment_result.system_log_entry.timestamp).toBeTruthy();
    expect(judgment_result.system_log_entry.document_id).toBe("DOC-001");

    // Assert: 返却結果の構造が完全であること
    expect(judgment_result).toHaveProperty("is_latest_version");
    expect(judgment_result).toHaveProperty("version_id");
    expect(judgment_result).toHaveProperty("version_number");
    expect(judgment_result).toHaveProperty("has_deprecated_versions");
    expect(judgment_result).toHaveProperty("deprecated_version_ids");
    expect(judgment_result).toHaveProperty("judgment_status");
    expect(judgment_result).toHaveProperty("error_occurred");
    expect(judgment_result).toHaveProperty("error_message");
    expect(judgment_result).toHaveProperty("system_log_entry");

    // Assert: 判定された『最新版』が active フラグを持っていること
    expect(judgment_result.is_active).toBe(true);
  });
});