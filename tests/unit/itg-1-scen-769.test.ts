import { filterDocuments } from "../../src/logic/it-1781935279444-2-2-1";

describe("資料検索フィルタリング機能", () => {
  test("SCEN-769: 顧客・案件・資料種別・有効期限の組み合わせで正確にフィルタリングされた資料一覧が表示される", () => {
    // Setup: テスト用の資料データ
    const documents = [
      {
        document_id: "DOC001",
        customer_id: "CUST001",
        project_id: "PROJ001",
        document_type: "proposal",
        document_name: "提案書A",
        valid_from: "2024-01-01",
        valid_to: "2024-12-31",
      },
      {
        document_id: "DOC002",
        customer_id: "CUST001",
        project_id: "PROJ002",
        document_type: "spec",
        document_name: "仕様書B",
        valid_from: "2024-02-01",
        valid_to: "2024-11-30",
      },
      {
        document_id: "DOC003",
        customer_id: "CUST002",
        project_id: "PROJ001",
        document_type: "proposal",
        document_name: "提案書C",
        valid_from: "2024-01-15",
        valid_to: "2024-10-31",
      },
      {
        document_id: "DOC004",
        customer_id: "CUST001",
        project_id: "PROJ001",
        document_type: "contract",
        document_name: "契約書D",
        valid_from: "2024-03-01",
        valid_to: "2025-02-28",
      },
      {
        document_id: "DOC005",
        customer_id: "CUST001",
        project_id: "PROJ001",
        document_type: "proposal",
        document_name: "提案書E",
        valid_from: "2023-01-01",
        valid_to: "2023-12-31",
      },
    ];

    // Test 1: 顧客・案件・資料種別・有効期限を組み合わせてフィルタリング
    const filter_params_1 = {
      customer_id: "CUST001",
      project_id: "PROJ001",
      document_types: ["proposal", "spec"],
      valid_from_start: "2024-01-01",
      valid_from_end: "2024-12-31",
    };

    const result_1 = filterDocuments(documents, filter_params_1);

    // 期待値: DOC001 (CUST001, PROJ001, proposal, 有効期限内)
    expect(result_1).toEqual([
      {
        document_id: "DOC001",
        customer_id: "CUST001",
        project_id: "PROJ001",
        document_type: "proposal",
        document_name: "提案書A",
        valid_from: "2024-01-01",
        valid_to: "2024-12-31",
      },
    ]);
    expect(result_1.length).toBe(1);

    // Test 2: フィルタ条件を変更して再検索 (資料種別を追加)
    const filter_params_2 = {
      customer_id: "CUST001",
      project_id: "PROJ001",
      document_types: ["proposal", "contract"],
      valid_from_start: "2024-01-01",
      valid_from_end: "2024-12-31",
    };

    const result_2 = filterDocuments(documents, filter_params_2);

    // 期待値: DOC001, DOC004 (contract は有効期限開始が2024-03-01で条件内)
    expect(result_2.length).toBe(2);
    expect(result_2.map((d) => d.document_id)).toEqual([
      "DOC001",
      "DOC004",
    ]);

    // Test 3: 複数顧客をまたぐフィルタ (顧客を変更)
    const filter_params_3 = {
      customer_id: "CUST002",
      project_id: "PROJ001",
      document_types: ["proposal"],
      valid_from_start: "2024-01-01",
      valid_from_end: "2024-12-31",
    };

    const result_3 = filterDocuments(documents, filter_params_3);

    // 期待値: DOC003 (CUST002, PROJ001, proposal)
    expect(result_3.length).toBe(1);
    expect(result_3[0].document_id).toBe("DOC003");

    // Test 4: 有効期限外のデータが除外される
    const filter_params_4 = {
      customer_id: "CUST001",
      project_id: "PROJ001",
      document_types: ["proposal"],
      valid_from_start: "2024-06-01",
      valid_from_end: "2024-12-31",
    };

    const result_4 = filterDocuments(documents, filter_params_4);

    // 期待値: 空配列 (DOC001は有効開始が2024-01-01で条件外)
    expect(result_4.length).toBe(0);

    // Test 5: すべての条件を満たすデータのみが抽出される
    const filter_params_5 = {
      customer_id: "CUST001",
      project_id: "PROJ001",
      document_types: ["proposal", "spec", "contract"],
      valid_from_start: "2024-01-01",
      valid_from_end: "2024-12-31",
    };

    const result_5 = filterDocuments(documents, filter_params_5);

    // 期待値: DOC001, DOC004 (DOC002はPROJ002なので除外)
    expect(result_5.length).toBe(2);
    expect(result_5.map((d) => d.document_id).sort()).toEqual([
      "DOC001",
      "DOC004",
    ]);

    // すべての抽出資料が条件を満たす検証
    result_5.forEach((doc) => {
      expect(doc.customer_id).toBe("CUST001");
      expect(doc.project_id).toBe("PROJ001");
      expect(["proposal", "spec", "contract"]).toContain(doc.document_type);
      expect(new Date(doc.valid_from) >= new Date("2024-01-01")).toBe(true);
      expect(new Date(doc.valid_from) <= new Date("2024-12-31")).toBe(true);
    });

    // Test 6: 条件変更時に結果が適切に更新される
    const filter_params_6 = {
      customer_id: "CUST001",
      project_id: "PROJ002",
      document_types: ["spec"],
      valid_from_start: "2024-02-01",
      valid_from_end: "2024-11-30",
    };

    const result_6 = filterDocuments(documents, filter_params_6);

    // 期待値: DOC002
    expect(result_6.length).toBe(1);
    expect(result_6[0].document_id).toBe("DOC002");
  });
});