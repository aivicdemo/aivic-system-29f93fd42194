import { determineLatestDocumentVersion } from "../../src/logic/it-1781935279444-1-1-1";

describe("営業データ項目のメタデータ管理機能 - 文書バージョン自動判定・表示", () => {
  // SCEN-805: [edge] 文書バージョン自動判定・表示機能 - バージョン番号が同一の複数文書が存在する場合に作成日時で最新が判定される
  test("同一バージョン番号を持つ複数文書の中から、最新の作成日時を持つ文書が最新版として判定される", () => {
    // Arrange: テストデータとして、同一のバージョン番号を持つ複数の文書を作成
    const documentA = {
      document_id: "doc_001",
      version_number: "v1.0",
      created_at: new Date("2024-01-01T10:00:00Z"),
      document_name: "契約書A",
      status: "active",
    };

    const documentB = {
      document_id: "doc_002",
      version_number: "v1.0",
      created_at: new Date("2024-01-01T15:00:00Z"),
      document_name: "契約書B",
      status: "active",
    };

    const documentC = {
      document_id: "doc_003",
      version_number: "v1.0",
      created_at: new Date("2024-01-01T12:00:00Z"),
      document_name: "契約書C",
      status: "active",
    };

    const documents = [documentA, documentB, documentC];

    // Act: 文書バージョン自動判定機能を実行
    const result = determineLatestDocumentVersion(documents);

    // Assert: 最新版として判定された文書を検証
    expect(result.latest_document_id).toBe("doc_002");
    expect(result.latest_version_number).toBe("v1.0");
    expect(result.latest_created_at).toEqual(new Date("2024-01-01T15:00:00Z"));
    expect(result.is_latest).toBe(true);
    expect(result.label).toBe("最新版");

    // Assert: その他の文書は過去版として表示される
    expect(result.other_versions).toHaveLength(2);
    expect(result.other_versions).toContainEqual({
      document_id: "doc_001",
      version_number: "v1.0",
      created_at: new Date("2024-01-01T10:00:00Z"),
      label: "過去版",
    });
    expect(result.other_versions).toContainEqual({
      document_id: "doc_003",
      version_number: "v1.0",
      created_at: new Date("2024-01-01T12:00:00Z"),
      label: "過去版",
    });

    // Assert: 文書Bの詳細情報を検証
    expect(result.document_details).toMatchObject({
      document_id: "doc_002",
      version_number: "v1.0",
      created_at: new Date("2024-01-01T15:00:00Z"),
      document_name: "契約書B",
      status: "active",
    });

    // Assert: 判定基準（最新作成日時）を検証
    expect(result.determined_by).toBe("created_at");
    expect(result.determination_timestamp).toEqual(new Date("2024-01-01T15:00:00Z"));
  });
});