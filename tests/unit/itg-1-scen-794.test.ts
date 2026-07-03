import { detectLatestDocumentVersion } from "../../src/logic/it-1781935279444-1-1-1";

describe("営業データ項目のメタデータ管理機能 - 文書バージョン最新版自動判定", () => {
  // SCEN-794: [normal] 文書バージョン最新版自動判定機能 - 旧バージョンの文書が『旧版』と明示される
  test("旧バージョン文書が『旧版』ラベルで表示される", () => {
    const document_v1 = {
      id: "doc_001",
      name: "契約書",
      version: 1,
      uploadedAt: new Date("2024-01-15T10:00:00Z"),
      uploadedBy: "user_admin_001",
      content: "契約書内容v1",
      status: "active",
    };

    const document_v2 = {
      id: "doc_001",
      name: "契約書",
      version: 2,
      uploadedAt: new Date("2024-02-20T14:30:00Z"),
      uploadedBy: "user_admin_001",
      content: "契約書内容v2",
      status: "active",
    };

    const documents = [document_v1, document_v2];

    const result = detectLatestDocumentVersion(documents);

    expect(result).toEqual({
      latestVersion: 2,
      latestDocumentId: "doc_001",
      latestUploadedAt: new Date("2024-02-20T14:30:00Z"),
      documents: [
        {
          id: "doc_001",
          name: "契約書",
          version: 1,
          uploadedAt: new Date("2024-01-15T10:00:00Z"),
          uploadedBy: "user_admin_001",
          content: "契約書内容v1",
          status: "active",
          isLatest: false,
          displayLabel: "旧版",
        },
        {
          id: "doc_001",
          name: "契約書",
          version: 2,
          uploadedAt: new Date("2024-02-20T14:30:00Z"),
          uploadedBy: "user_admin_001",
          content: "契約書内容v2",
          status: "active",
          isLatest: true,
          displayLabel: "最新版",
        },
      ],
    });

    const oldVersionDoc = result.documents[0];
    expect(oldVersionDoc.displayLabel).toBe("旧版");
    expect(oldVersionDoc.isLatest).toBe(false);
    expect(oldVersionDoc.version).toBe(1);

    const latestVersionDoc = result.documents[1];
    expect(latestVersionDoc.displayLabel).toBe("最新版");
    expect(latestVersionDoc.isLatest).toBe(true);
    expect(latestVersionDoc.version).toBe(2);
  });
});