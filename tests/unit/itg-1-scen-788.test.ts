import { describe, test, expect } from "@jest/globals";
import {
  markObsoleteDocumentVersion,
} from "../../src/logic/it-1781935279444-1-1-1";

describe("営業データ項目メタデータ管理 - 旧版資料の自動廃棄マーキング機能", () => {
  // SCEN-788
  test("新バージョンリリース時に旧バージョン資料が廃棄対象にマークされること", () => {
    // 事前条件: 旧バージョン資料が『有効』ステータスで存在
    const oldDocumentVersion = {
      version_id: "doc_v1_0_0",
      document_id: "doc_123",
      version_number: "1.0.0",
      status: "active",
      released_at: new Date("2024-01-01T10:00:00Z"),
      created_by: "user_001",
      effective_from: new Date("2024-01-01T00:00:00Z"),
      effective_to: null,
      is_obsolete_marked: false,
      obsolete_mark_date: null,
      planned_disposal_date: null,
    };

    // 新バージョン資料がリリースされた時点
    const newDocumentVersion = {
      version_id: "doc_v1_1_0",
      document_id: "doc_123",
      version_number: "1.1.0",
      status: "active",
      released_at: new Date("2024-01-15T14:30:00Z"),
      created_by: "user_002",
      effective_from: new Date("2024-01-15T00:00:00Z"),
      effective_to: null,
      is_obsolete_marked: false,
      obsolete_mark_date: null,
      planned_disposal_date: null,
    };

    // 廃棄マーク処理実行
    const result = markObsoleteDocumentVersion({
      obsolete_document_version: oldDocumentVersion,
      new_document_version: newDocumentVersion,
      obsolete_mark_timestamp: new Date("2024-01-15T14:30:00Z"),
      planned_disposal_days_offset: 30,
    });

    // 期待結果: 旧バージョンが廃棄対象にマークされている
    expect(result.is_obsolete_marked).toBe(true);
    expect(result.obsolete_mark_date).toEqual(
      new Date("2024-01-15T14:30:00Z")
    );
    expect(result.planned_disposal_date).toEqual(
      new Date("2024-02-14T14:30:00Z")
    );
    expect(result.status).toBe("obsolete_marked");

    // 新バージョンは『有効』ステータスのまま
    expect(newDocumentVersion.status).toBe("active");
    expect(newDocumentVersion.is_obsolete_marked).toBe(false);
    expect(newDocumentVersion.obsolete_mark_date).toBeNull();
    expect(newDocumentVersion.planned_disposal_date).toBeNull();

    // メタデータの完全性を検証
    expect(result).toHaveProperty("version_id");
    expect(result).toHaveProperty("document_id");
    expect(result).toHaveProperty("version_number");
    expect(result.version_id).toBe("doc_v1_0_0");
    expect(result.version_number).toBe("1.0.0");
  });
});