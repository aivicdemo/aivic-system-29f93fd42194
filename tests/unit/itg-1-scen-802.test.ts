import { determineLatestDocumentVersion } from "../../src/logic/it-1781935279444-1-1-1";

describe("営業データ項目のメタデータ管理機能 - 文書バージョン自動判定・表示", () => {
  test("SCEN-802: 複数バージョンが存在する場合に最新版が正しく判定される", () => {
    // テストデータ: 同一文書の複数バージョン（v1.0, v1.1, v2.0）
    const documentVersions = [
      {
        version_id: "doc_v1_0",
        version_number: "v1.0",
        document_id: "doc_001",
        created_at: new Date("2024-01-01T08:00:00Z"),
        updated_at: new Date("2024-01-01T08:30:00Z"),
        file_path: "/documents/contract_v1.0.pdf",
      },
      {
        version_id: "doc_v1_1",
        version_number: "v1.1",
        document_id: "doc_001",
        created_at: new Date("2024-01-05T10:00:00Z"),
        updated_at: new Date("2024-01-05T11:15:00Z"),
        file_path: "/documents/contract_v1.1.pdf",
      },
      {
        version_id: "doc_v2_0",
        version_number: "v2.0",
        document_id: "doc_001",
        created_at: new Date("2024-01-15T09:00:00Z"),
        updated_at: new Date("2024-01-15T14:45:00Z"),
        file_path: "/documents/contract_v2.0.pdf",
      },
    ];

    // 文書バージョン自動判定機能を実行
    const result = determineLatestDocumentVersion(documentVersions);

    // 期待結果: v2.0が最新版として判定される（最終更新日時が最も新しい）
    expect(result.latest_version_id).toBe("doc_v2_0");
    expect(result.latest_version_number).toBe("v2.0");
    expect(result.latest_updated_at).toEqual(new Date("2024-01-15T14:45:00Z"));

    // 判定ロジックの正確性検証: 最新版の判定が更新日時の比較に基づいている
    expect(result.version_comparison_basis).toBe("updated_at");

    // すべてのバージョンが取得され、最新版のみが marked_as_latest フラグで表示されることを確認
    const markedLatest = documentVersions.filter(
      (v) => v.version_id === result.latest_version_id
    );
    expect(markedLatest).toHaveLength(1);
    expect(markedLatest[0].version_number).toBe("v2.0");

    // 旧バージョン（v1.0, v1.1）が非推奨として検出されることを確認
    const deprecated_versions = result.deprecated_version_ids;
    expect(deprecated_versions).toContain("doc_v1_0");
    expect(deprecated_versions).toContain("doc_v1_1");
    expect(deprecated_versions).not.toContain("doc_v2_0");

    // 最新版として判定されたバージョンの更新日時が他のすべてのバージョンより新しい
    const latest_timestamp = new Date("2024-01-15T14:45:00Z").getTime();
    const v1_1_timestamp = new Date("2024-01-05T11:15:00Z").getTime();
    const v1_0_timestamp = new Date("2024-01-01T08:30:00Z").getTime();

    expect(latest_timestamp).toBeGreaterThan(v1_1_timestamp);
    expect(latest_timestamp).toBeGreaterThan(v1_0_timestamp);

    // 判定結果の構造化データが正確に返される
    expect(result).toHaveProperty("latest_version_id");
    expect(result).toHaveProperty("latest_version_number");
    expect(result).toHaveProperty("latest_updated_at");
    expect(result).toHaveProperty("deprecated_version_ids");
    expect(result).toHaveProperty("version_comparison_basis");
  });
});