import { describe, test, expect, beforeEach } from "@jest/globals";
import { detectObsoleteDocumentVersions } from "../../src/logic/it-1781935279444-1-1-1";

describe("営業データ項目のメタデータ管理機能", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // SCEN-778: [edge] 旧バージョン資料の自動検出・警告機能 - 最新版のみが存在する場合、警告フラグを立てず正常に処理する
  test("最新版資料のみが存在する場合、警告フラグを立てず正常に処理する", () => {
    const input_documents = [
      {
        document_id: "doc-001",
        document_name: "契約書_顧客A_v3",
        version: 3,
        effective_date: "2024-11-01T00:00:00Z",
        expiration_date: "2025-10-31T23:59:59Z",
        is_latest: true,
        customer_id: "cust-A",
      },
      {
        document_id: "doc-002",
        document_name: "提案資料_サービスB_v2",
        version: 2,
        effective_date: "2024-10-15T00:00:00Z",
        expiration_date: "2025-10-14T23:59:59Z",
        is_latest: true,
        customer_id: "cust-B",
      },
    ];

    const result = detectObsoleteDocumentVersions({
      documents: input_documents,
      check_timestamp: "2024-12-15T10:30:00Z",
    });

    // 期待結果: ステータスコードが成功（200）
    expect(result.status_code).toBe(200);

    // 警告フラグが立たないこと
    expect(result.has_warning).toBe(false);

    // 検出された旧バージョン数が 0
    expect(result.obsolete_documents_count).toBe(0);

    // 警告対象ドキュメントが空配列
    expect(result.obsolete_documents).toEqual([]);

    // 処理メッセージで旧バージョン検出なし
    expect(result.message).toMatch(/旧バージョン/);
    expect(result.message).toMatch(/検出されない|検出されませんでした/);

    // 処理完了メッセージ
    expect(result.completion_status).toBe("completed");
  });
});