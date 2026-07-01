import { describe, test, expect } from "@jest/globals";
import { lockDeprecatedDocumentVersion } from "../../src/logic/it-1781935279444-1-1-1";

describe("営業データ項目のメタデータ管理機能", () => {
  test("SCEN-786: [error] 非推奨版資料の自動検出・警告機能 - 最新版が1つだけ存在する場合、旧バージョンのロック処理が実行されエラーが返される", () => {
    // Arrange: テスト用の旧バージョン資料と最新版資料のデータを準備
    const old_document_version = {
      document_id: "DOC-001",
      version_number: "1.0",
      is_deprecated: false,
      is_locked: false,
      created_date: new Date("2024-01-01T09:00:00Z"),
      updated_date: new Date("2024-01-01T09:00:00Z"),
    };

    const latest_document_version = {
      document_id: "DOC-001",
      version_number: "2.0",
      is_deprecated: false,
      is_locked: false,
      is_latest: true,
      created_date: new Date("2024-02-01T10:00:00Z"),
      updated_date: new Date("2024-02-01T10:00:00Z"),
    };

    const all_versions = [old_document_version, latest_document_version];

    // Act: 旧バージョンのロック処理を実行
    const lock_result = lockDeprecatedDocumentVersion({
      document_id: "DOC-001",
      target_version: "1.0",
      all_document_versions: all_versions,
      operator_id: "OPE-001",
      timestamp: new Date("2024-02-15T14:30:00Z"),
    });

    // Assert: エラーが返されることを確認
    expect(() => {
      if (lock_result.status === "error") {
        throw new Error(lock_result.error_message);
      }
    }).toThrow(/最新版/);

    // Assert: 旧バージョンが自動検出され、警告が返されることを確認
    expect(lock_result).toEqual({
      status: "error",
      error_message:
        "最新版が存在するため、旧バージョンをロック処理できません",
      deprecated_versions: [
        {
          version_number: "1.0",
          is_locked: true,
          locked_timestamp: new Date("2024-02-15T14:30:00Z"),
          lock_reason: "自動検出された非推奨版",
        },
      ],
      warning_flag: true,
      warning_message: "バージョン1.0は非推奨版として自動検出されました",
      latest_version_count: 1,
    });

    // Assert: 旧バージョンがロック状態に変更されていることを確認
    expect(lock_result.deprecated_versions[0].is_locked).toBe(true);

    // Assert: 警告フラグが立っていることを確認
    expect(lock_result.warning_flag).toBe(true);

    // Assert: 最新版の数が1つであることを確認
    expect(lock_result.latest_version_count).toBe(1);
  });
});