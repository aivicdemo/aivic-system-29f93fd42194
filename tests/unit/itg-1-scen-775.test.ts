import { selectLatestDocumentVersion } from "../../src/logic/it-1781935279444-1-1-1";

describe("営業データ項目のメタデータ管理機能", () => {
  // SCEN-775: [edge] 契約書・提案資料の自動特定・適用機能 - 複数の有効なバージョンが存在する場合、最新版のみを特定して返す
  test("複数の有効なバージョンが存在する場合、最新版のみを特定して返す", () => {
    const multipleValidVersions = [
      {
        versionId: "v1",
        versionNumber: "1.0",
        createdAt: new Date("2024-01-01T09:00:00Z"),
        status: "有効",
        documentId: "doc-123",
      },
      {
        versionId: "v2",
        versionNumber: "1.5",
        createdAt: new Date("2024-06-15T14:30:00Z"),
        status: "有効",
        documentId: "doc-123",
      },
      {
        versionId: "v3",
        versionNumber: "2.0",
        createdAt: new Date("2024-12-20T10:45:00Z"),
        status: "有効",
        documentId: "doc-123",
      },
    ];

    const result = selectLatestDocumentVersion(multipleValidVersions);

    // 戻り値に含まれるバージョン数が1件のみであることを確認
    expect(result.versions.length).toBe(1);

    // 戻り値のバージョン番号が最新版（v2.0）であることを確認
    expect(result.versions[0].versionNumber).toBe("2.0");

    // 最新版のバージョンIDを検証
    expect(result.versions[0].versionId).toBe("v3");

    // ステータスが「有効」であることを確認
    expect(result.versions[0].status).toBe("有効");

    // 最新版の作成日時が最も新しいことを確認
    expect(result.versions[0].createdAt).toEqual(new Date("2024-12-20T10:45:00Z"));

    // 戻り値に最新版の情報が含まれていることを確認
    expect(result.latestVersionNumber).toBe("2.0");
    expect(result.latestVersionId).toBe("v3");
  });
});