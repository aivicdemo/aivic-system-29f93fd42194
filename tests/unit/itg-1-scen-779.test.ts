import { markObsoleteDocuments } from "../../src/logic/it-1781935279444-1-1-1";

describe("営業データ項目のメタデータ管理機能", () => {
  test("SCEN-779: 旧版資料の廃棄対象自動マーク機能 - 有効期限到達または新バージョンリリース時に旧版資料を廃棄対象にマークする", () => {
    // 前提条件: テスト用の資料データを準備
    const currentDate = new Date("2024-12-15T10:00:00Z");
    const expiredDate = new Date("2024-12-10T23:59:59Z"); // 現在日時より前
    const futureDate = new Date("2024-12-20T23:59:59Z"); // 現在日時より後

    const testDocuments = [
      {
        documentId: "doc_001",
        documentName: "営業基本契約書 v1.0",
        version: "1.0",
        documentType: "contract",
        expiryDate: expiredDate.toISOString(),
        effectiveDate: "2024-06-01T00:00:00Z",
        status: "active",
        isLatestVersion: false,
        createdAt: "2024-06-01T00:00:00Z",
        updatedAt: "2024-12-01T00:00:00Z",
        deprecationMarkedAt: null,
        deprecationReason: null,
      },
      {
        documentId: "doc_002",
        documentName: "営業基本契約書 v2.0",
        version: "2.0",
        documentType: "contract",
        expiryDate: futureDate.toISOString(),
        effectiveDate: "2024-12-01T00:00:00Z",
        status: "active",
        isLatestVersion: true,
        createdAt: "2024-12-01T00:00:00Z",
        updatedAt: "2024-12-01T00:00:00Z",
        deprecationMarkedAt: null,
        deprecationReason: null,
      },
      {
        documentId: "doc_003",
        documentName: "提案資料テンプレート v1.0",
        version: "1.0",
        documentType: "proposal",
        expiryDate: expiredDate.toISOString(),
        effectiveDate: "2024-01-01T00:00:00Z",
        status: "active",
        isLatestVersion: false,
        createdAt: "2024-01-01T00:00:00Z",
        updatedAt: "2024-06-01T00:00:00Z",
        deprecationMarkedAt: null,
        deprecationReason: null,
      },
    ];

    // 手順1: 有効期限到達した旧版資料を廃棄対象にマークする処理を実行
    const markResult = markObsoleteDocuments(
      testDocuments,
      currentDate.toISOString(),
      "expiry_reached"
    );

    // 期待結果検証1: 有効期限を過ぎた資料が廃棄対象としてマークされていること
    const expiredDocMarkResult = markResult.find(
      (doc) => doc.documentId === "doc_001"
    );
    expect(expiredDocMarkResult).toBeDefined();
    expect(expiredDocMarkResult?.status).toBe("deprecated");
    expect(expiredDocMarkResult?.deprecationMarkedAt).toBe(
      currentDate.toISOString()
    );
    expect(expiredDocMarkResult?.deprecationReason).toBe("expiry_reached");

    // 期待結果検証2: 有効期限内の最新版資料はマークされていないこと
    const activeDocMarkResult = markResult.find(
      (doc) => doc.documentId === "doc_002"
    );
    expect(activeDocMarkResult).toBeDefined();
    expect(activeDocMarkResult?.status).toBe("active");
    expect(activeDocMarkResult?.deprecationMarkedAt).toBeNull();
    expect(activeDocMarkResult?.deprecationReason).toBeNull();

    // 期待結果検証3: 他のドキュメントタイプの有効期限切れ資料も廃棄対象としてマークされていること
    const proposalDocMarkResult = markResult.find(
      (doc) => doc.documentId === "doc_003"
    );
    expect(proposalDocMarkResult).toBeDefined();
    expect(proposalDocMarkResult?.status).toBe("deprecated");
    expect(proposalDocMarkResult?.deprecationMarkedAt).toBe(
      currentDate.toISOString()
    );
    expect(proposalDocMarkResult?.deprecationReason).toBe("expiry_reached");

    // 手順2: 新バージョンリリース時に前バージョンを廃棄対象にマークする処理
    const testDocumentsBeforeNewRelease = [
      {
        documentId: "doc_002",
        documentName: "営業基本契約書 v2.0",
        version: "2.0",
        documentType: "contract",
        expiryDate: futureDate.toISOString(),
        effectiveDate: "2024-12-01T00:00:00Z",
        status: "active",
        isLatestVersion: false,
        createdAt: "2024-12-01T00:00:00Z",
        updatedAt: "2024-12-01T00:00:00Z",
        deprecationMarkedAt: null,
        deprecationReason: null,
      },
      {
        documentId: "doc_004",
        documentName: "営業基本契約書 v3.0",
        version: "3.0",
        documentType: "contract",
        expiryDate: new Date("2025-12-15T23:59:59Z").toISOString(),
        effectiveDate: "2024-12-15T00:00:00Z",
        status: "active",
        isLatestVersion: true,
        createdAt: "2024-12-15T00:00:00Z",
        updatedAt: "2024-12-15T00:00:00Z",
        deprecationMarkedAt: null,
        deprecationReason: null,
      },
    ];

    const releaseMarkResult = markObsoleteDocuments(
      testDocumentsBeforeNewRelease,
      currentDate.toISOString(),
      "new_version_released"
    );

    // 期待結果検証4: 新バージョンリリース時に前バージョンが廃棄対象としてマークされていること
    const previousVersionMarkResult = releaseMarkResult.find(
      (doc) => doc.documentId === "doc_002"
    );
    expect(previousVersionMarkResult).toBeDefined();
    expect(previousVersionMarkResult?.status).toBe("deprecated");
    expect(previousVersionMarkResult?.deprecationMarkedAt).toBe(
      currentDate.toISOString()
    );
    expect(previousVersionMarkResult?.deprecationReason).toBe(
      "new_version_released"
    );

    // 期待結果検証5: 新バージョンの資料はマークされていないこと
    const newVersionMarkResult = releaseMarkResult.find(
      (doc) => doc.documentId === "doc_004"
    );
    expect(newVersionMarkResult).toBeDefined();
    expect(newVersionMarkResult?.status).toBe("active");
    expect(newVersionMarkResult?.deprecationMarkedAt).toBeNull();
    expect(newVersionMarkResult?.deprecationReason).toBeNull();

    // 手順3: 廃棄対象としてマークされた資料一覧を取得して詳細情報を確認
    const deprecatedDocuments = markResult.filter(
      (doc) => doc.status === "deprecated"
    );

    // 期待結果検証6: 廃棄対象資料一覧に正しい数の資料が含まれていること（有効期限切れ2件）
    expect(deprecatedDocuments.length).toBe(2);

    // 期待結果検証7: 廃棄対象資料の詳細情報（マーク日時、理由、ステータス）が正しく記録されていること
    deprecatedDocuments.forEach((doc) => {
      expect(doc.status).toBe("deprecated");
      expect(doc.deprecationMarkedAt).toBe(currentDate.toISOString());
      expect(doc.deprecationReason).toBe("expiry_reached");
      expect(doc.deprecationMarkedAt).toMatch(
        /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/
      );
    });

    // 期待結果検証8: マークされた資料のステータスが『廃棄対象』に正確に更新されていることを再確認
    expect(markResult.every((doc) => doc.status === "active" || doc.status === "deprecated")).toBe(true);
    expect(markResult.filter((doc) => doc.status === "deprecated").length).toBe(2);
  });
});