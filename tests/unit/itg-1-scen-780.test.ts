import { markObsoleteContractDocuments } from "../../src/logic/it-1781935279444-1-1-1";

describe("営業データ項目のメタデータ管理機能 - 旧版資料の廃棄対象自動マーク", () => {
  test("SCEN-780: 有効期限を過ぎた資料を廃棄対象として正確に判定する", () => {
    // 固定参照時刻: 2024-06-15T10:00:00Z
    const reference_time = new Date("2024-06-15T10:00:00Z");

    // テストデータ: 有効期限を過ぎた資料 (2件)
    const expired_documents = [
      {
        document_id: "doc_001",
        document_name: "契約書_v1.0",
        expiry_datetime: new Date("2024-06-14T23:59:59Z"), // 1秒前に期限切れ
        obsolete_flag: false,
        document_type: "contract",
      },
      {
        document_id: "doc_002",
        document_name: "提案資料_v2.0",
        expiry_datetime: new Date("2024-06-01T00:00:00Z"), // 14日前に期限切れ
        obsolete_flag: false,
        document_type: "proposal",
      },
    ];

    // テストデータ: 有効期限内の資料 (2件)
    const active_documents = [
      {
        document_id: "doc_003",
        document_name: "契約書_v2.0",
        expiry_datetime: new Date("2024-06-15T10:00:01Z"), // 1秒後に期限切れ
        obsolete_flag: false,
        document_type: "contract",
      },
      {
        document_id: "doc_004",
        document_name: "提案資料_v3.0",
        expiry_datetime: new Date("2024-07-15T00:00:00Z"), // 30日後に期限切れ
        obsolete_flag: false,
        document_type: "proposal",
      },
    ];

    // テストデータ: 境界値ケース (有効期限がちょうど現在時刻と同一)
    const boundary_document = {
      document_id: "doc_005",
      document_name: "契約書_boundary",
      expiry_datetime: new Date("2024-06-15T10:00:00Z"), // ちょうど現在時刻
      obsolete_flag: false,
      document_type: "contract",
    };

    // すべてのテストデータを統合
    const all_documents = [
      ...expired_documents,
      ...active_documents,
      boundary_document,
    ];

    // 関数実行: 廃棄対象自動マーク機能
    const result = markObsoleteContractDocuments(all_documents, reference_time);

    // ===== Assertion 1: 有効期限を過ぎた資料が廃棄対象（廃棄フラグ=true）にマークされたことを確認 =====
    expect(result.marked_documents.find((d) => d.document_id === "doc_001")?.obsolete_flag).toBe(
      true
    );
    expect(result.marked_documents.find((d) => d.document_id === "doc_002")?.obsolete_flag).toBe(
      true
    );

    // ===== Assertion 2: 有効期限内の資料が廃棄対象とマークされていないことを確認 =====
    expect(result.marked_documents.find((d) => d.document_id === "doc_003")?.obsolete_flag).toBe(
      false
    );
    expect(result.marked_documents.find((d) => d.document_id === "doc_004")?.obsolete_flag).toBe(
      false
    );

    // ===== Assertion 3: 境界値ケース（有効期限がちょうど参照時刻と同一）の判定を確認 =====
    // 境界値では「<=」判定により廃棄対象（true）となることを期待
    expect(result.marked_documents.find((d) => d.document_id === "doc_005")?.obsolete_flag).toBe(
      true
    );

    // ===== Assertion 4: 廃棄対象としてマークされた資料の件数が期待値と一致することを確認 =====
    // 期待値: 有効期限切れ 2件 + 境界値 1件 = 計 3件
    const expected_obsolete_count = 3;
    const actual_obsolete_count = result.marked_documents.filter(
      (d) => d.obsolete_flag === true
    ).length;
    expect(actual_obsolete_count).toBe(expected_obsolete_count);

    // ===== Assertion 5: 処理完了ログに廃棄対象マーク件数が正確に記録されていることを確認 =====
    expect(result.processing_log.marked_count).toBe(3);
    expect(result.processing_log.total_documents_processed).toBe(5);
    expect(result.processing_log.processing_timestamp).toEqual(reference_time);

    // ===== Assertion 6: マーク対象ドキュメントのIDが記録されていることを確認 =====
    const expected_marked_ids = ["doc_001", "doc_002", "doc_005"];
    expect(result.processing_log.marked_document_ids).toEqual(expected_marked_ids);

    // ===== Assertion 7: すべての入力ドキュメントが結果に含まれていることを確認 =====
    expect(result.marked_documents.length).toBe(5);
    const result_ids = result.marked_documents.map((d) => d.document_id);
    expect(result_ids).toContain("doc_001");
    expect(result_ids).toContain("doc_002");
    expect(result_ids).toContain("doc_003");
    expect(result_ids).toContain("doc_004");
    expect(result_ids).toContain("doc_005");
  });
});