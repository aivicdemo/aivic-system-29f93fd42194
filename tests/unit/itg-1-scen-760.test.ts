import { describe, test, expect, beforeEach } from "@jest/globals";
import { recordDocumentVersion } from "../../src/logic/it-1781935279444-1-1-1";

describe("営業データ項目のメタデータ管理機能", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // SCEN-760
  test("有効期限が過去日時の場合にバージョン記録が拒否される", () => {
    const past_date = new Date("2020-01-15T11:00:00Z");
    const current_date = new Date("2024-12-20T10:00:00Z");

    const version_data = {
      document_id: "DOC-CONTRACT-001",
      document_type: "契約書",
      version_number: 2,
      content_hash: "abc123def456",
      updated_by: "user_admin_001",
      updated_at: current_date.toISOString(),
      expiration_date: past_date.toISOString(),
      change_summary: "更新内容テスト",
    };

    expect(() => recordDocumentVersion(version_data)).toThrow(/有効期限/);
  });
});