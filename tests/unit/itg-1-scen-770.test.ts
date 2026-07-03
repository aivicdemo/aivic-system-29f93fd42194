import { searchContractDocuments } from "../../src/logic/it-1781935279444-2-2-1";

describe("資料検索フィルタリング機能 - 有効期限外の資料は検索結果から除外される", () => {
  test("SCEN-770: 有効期限内の資料のみが検索結果に含まれることを確認", () => {
    // 入力: 検索条件と資料マスタデータ
    const search_customer_id = "CUST-12345";
    const search_document_type = "contract";
    const search_as_of_date = new Date("2024-03-15T00:00:00Z");

    const documents = [
      {
        doc_id: "DOC-001",
        customer_id: "CUST-12345",
        document_type: "contract",
        document_name: "基本契約書 v1",
        effective_start_date: new Date("2024-01-01T00:00:00Z"),
        effective_end_date: new Date("2024-06-30T23:59:59Z"),
        is_active: true,
        version: 1,
      },
      {
        doc_id: "DOC-002",
        customer_id: "CUST-12345",
        document_type: "contract",
        document_name: "基本契約書 v2",
        effective_start_date: new Date("2024-02-01T00:00:00Z"),
        effective_end_date: new Date("2023-12-31T23:59:59Z"),
        is_active: false,
        version: 2,
      },
      {
        doc_id: "DOC-003",
        customer_id: "CUST-12345",
        document_type: "contract",
        document_name: "基本契約書 v3",
        effective_start_date: new Date("2024-04-01T00:00:00Z"),
        effective_end_date: new Date("2024-12-31T23:59:59Z"),
        is_active: true,
        version: 3,
      },
      {
        doc_id: "DOC-004",
        customer_id: "CUST-99999",
        document_type: "contract",
        document_name: "他顧客契約書",
        effective_start_date: new Date("2024-01-01T00:00:00Z"),
        effective_end_date: new Date("2024-06-30T23:59:59Z"),
        is_active: true,
        version: 1,
      },
    ];

    // 実行: 検索関数を呼び出し
    const result = searchContractDocuments({
      customer_id: search_customer_id,
      document_type: search_document_type,
      as_of_date: search_as_of_date,
      documents: documents,
    });

    // 検証1: 検索結果のドキュメント数が正確であること
    expect(result.length).toBe(2);

    // 検証2: 有効期限内の資料のみが含まれること
    const returned_doc_ids = result.map((doc) => doc.doc_id);
    expect(returned_doc_ids).toEqual(["DOC-001", "DOC-003"]);

    // 検証3: 各結果資料が指定顧客かつ指定document_typeであること
    result.forEach((doc) => {
      expect(doc.customer_id).toBe(search_customer_id);
      expect(doc.document_type).toBe(search_document_type);
    });

    // 検証4: 各結果資料の有効期限が検索時点を包含すること
    result.forEach((doc) => {
      expect(doc.effective_start_date.getTime()).toBeLessThanOrEqual(
        search_as_of_date.getTime()
      );
      expect(doc.effective_end_date.getTime()).toBeGreaterThanOrEqual(
        search_as_of_date.getTime()
      );
    });

    // 検証5: DOC-002（有効期限外）が除外されていること
    const excluded_ids = documents
      .filter((doc) => doc.doc_id === "DOC-002")
      .map((doc) => doc.doc_id);
    excluded_ids.forEach((excluded_id) => {
      expect(returned_doc_ids).not.toContain(excluded_id);
    });

    // 検証6: DOC-004（異なる顧客）が除外されていること
    expect(returned_doc_ids).not.toContain("DOC-004");

    // 検証7: 結果に期待される資料の詳細情報が含まれること
    const doc_001 = result.find((doc) => doc.doc_id === "DOC-001");
    expect(doc_001).toBeDefined();
    expect(doc_001?.document_name).toBe("基本契約書 v1");
    expect(doc_001?.version).toBe(1);
    expect(doc_001?.is_active).toBe(true);

    const doc_003 = result.find((doc) => doc.doc_id === "DOC-003");
    expect(doc_003).toBeDefined();
    expect(doc_003?.document_name).toBe("基本契約書 v3");
    expect(doc_003?.version).toBe(3);
    expect(doc_003?.is_active).toBe(true);
  });
});