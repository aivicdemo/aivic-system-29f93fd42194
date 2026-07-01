import {
  identifyLatestContractMaterial,
} from "../../src/logic/it-1781935279444-1-1-1";

describe("営業データ項目のメタデータ管理機能", () => {
  // SCEN-781
  test("契約・提案資料の最新版自動特定機能 - 顧客IDと案件IDを指定して最新版資料を検索", () => {
    // 契約・提案資料の最新版自動特定機能のテスト
    // 顧客IDと案件IDを指定して最新版資料を検索し、
    // 資料名・バージョン・有効期限・変更内容が正しく表示される

    // 入力パラメータ
    const customer_id = "CUST-20240115-001";
    const project_id = "PROJ-20240115-001";

    // モック対象: 複数バージョンが存在する契約資料
    const mock_materials = [
      {
        material_id: "MAT-001-v3",
        material_name: "基本契約書（標準版）",
        version: "3.0",
        effective_from: "2024-02-01",
        effective_to: "2025-01-31",
        change_summary:
          "消費税率改定対応、振込手数料条項追加、解約予告期間延長",
        release_date: "2024-01-15T09:00:00Z",
        is_latest: true,
      },
      {
        material_id: "MAT-001-v2",
        material_name: "基本契約書（標準版）",
        version: "2.0",
        effective_from: "2023-11-01",
        effective_to: "2024-01-31",
        change_summary: "条項文言修正、別紙様式更新",
        release_date: "2023-10-20T14:30:00Z",
        is_latest: false,
      },
      {
        material_id: "MAT-001-v1",
        material_name: "基本契約書（標準版）",
        version: "1.0",
        effective_from: "2023-01-01",
        effective_to: "2023-10-31",
        change_summary: "初版作成",
        release_date: "2022-12-15T10:00:00Z",
        is_latest: false,
      },
    ];

    // 関数を実行
    const result = identifyLatestContractMaterial({
      customer_id,
      project_id,
      materials: mock_materials,
    });

    // 期待結果検証

    // 1. 最新版資料が正確に特定されていること
    expect(result.latest_material).toBeDefined();
    expect(result.latest_material.material_id).toBe("MAT-001-v3");

    // 2. 資料名が正しく表示されること
    expect(result.latest_material.material_name).toBe("基本契約書（標準版）");

    // 3. バージョンが正しく表示されること
    expect(result.latest_material.version).toBe("3.0");

    // 4. 有効期限が正しく表示されること
    expect(result.latest_material.effective_from).toBe("2024-02-01");
    expect(result.latest_material.effective_to).toBe("2025-01-31");

    // 5. 変更内容が正しく表示されること
    expect(result.latest_material.change_summary).toBe(
      "消費税率改定対応、振込手数料条項追加、解約予告期間延長"
    );

    // 6. 複数バージョンが存在する場合、最新版が最上位に表示されていること
    expect(result.all_versions).toHaveLength(3);
    expect(result.all_versions[0].version).toBe("3.0");
    expect(result.all_versions[0].is_latest).toBe(true);
    expect(result.all_versions[1].version).toBe("2.0");
    expect(result.all_versions[1].is_latest).toBe(false);
    expect(result.all_versions[2].version).toBe("1.0");
    expect(result.all_versions[2].is_latest).toBe(false);

    // 7. リリース日時順にソートされていること
    expect(result.all_versions[0].release_date).toBe("2024-01-15T09:00:00Z");
    expect(result.all_versions[1].release_date).toBe("2023-10-20T14:30:00Z");
    expect(result.all_versions[2].release_date).toBe("2022-12-15T10:00:00Z");

    // 8. 検索結果が顧客IDと案件IDに紐付いていること
    expect(result.customer_id).toBe("CUST-20240115-001");
    expect(result.project_id).toBe("PROJ-20240115-001");

    // 9. 有効期限内の判定が正しいこと（有効期限内 = true）
    expect(result.is_effective).toBe(true);

    // 10. 古いバージョンについても情報が保持されていること
    const v2_material = result.all_versions.find((m) => m.version === "2.0");
    expect(v2_material).toBeDefined();
    expect(v2_material?.material_name).toBe("基本契約書（標準版）");
    expect(v2_material?.change_summary).toBe("条項文言修正、別紙様式更新");
  });
});