import { applyDocumentNamingAndFolderStructure } from "../../src/logic/it-1-br-1781935279444-1-2-1";

describe("月次サマリーテンプレートの定義・管理機能 - ドキュメント命名規則・フォルダ構成自動適用", () => {
  test("SCEN-1084: 複数の業務チェックリストに対して統一された命名規則とフォルダ構成が適用される", () => {
    // 複数の業務チェックリスト（3件以上）を作成
    const checklistBefore1 = {
      id: "checklist-001",
      name: "请求書作成",
      documentPath: "Documents/請求管理",
      folderHierarchy: ["ルート", "請求管理"],
      createdAt: new Date("2024-01-15T10:00:00Z"),
    };

    const checklistBefore2 = {
      id: "checklist-002",
      name: "営業報告書集計",
      documentPath: "Docs/営業成果",
      folderHierarchy: ["ドキュメント", "営業成果"],
      createdAt: new Date("2024-01-15T10:15:00Z"),
    };

    const checklistBefore3 = {
      id: "checklist-003",
      name: "契約書管理",
      documentPath: "File/契約管理フォルダ",
      folderHierarchy: ["Files", "契約", "管理"],
      createdAt: new Date("2024-01-15T10:30:00Z"),
    };

    const checklistBefore4 = {
      id: "checklist-004",
      name: "データ品質検証",
      documentPath: "BackOffice/Quality",
      folderHierarchy: ["Back", "Office", "Quality"],
      createdAt: new Date("2024-01-15T10:45:00Z"),
    };

    const checklistsInput = [
      checklistBefore1,
      checklistBefore2,
      checklistBefore3,
      checklistBefore4,
    ];

    // ドキュメント命名規則・フォルダ構成自動適用機能を実行
    const result = applyDocumentNamingAndFolderStructure({
      checklists: checklistsInput,
      namingFormat: "{type}_{index:03d}_{date}",
      folderStructure: ["BackOffice", "業務チェックリスト", "{type}"],
    });

    // 適用後のチェックリストを検証
    expect(result.checklists).toHaveLength(4);

    // 各チェックリストのドキュメント名が統一された命名規則に従っていることを確認
    expect(result.checklists[0].name).toBe("checklist_001_2024-01-15");
    expect(result.checklists[1].name).toBe("checklist_002_2024-01-15");
    expect(result.checklists[2].name).toBe("checklist_003_2024-01-15");
    expect(result.checklists[3].name).toBe("checklist_004_2024-01-15");

    // 各チェックリストのフォルダ構成が統一された構成に従っていることを確認
    expect(result.checklists[0].documentPath).toBe(
      "BackOffice/業務チェックリスト/請求書作成"
    );
    expect(result.checklists[1].documentPath).toBe(
      "BackOffice/業務チェックリスト/営業報告書集計"
    );
    expect(result.checklists[2].documentPath).toBe(
      "BackOffice/業務チェックリスト/契約書管理"
    );
    expect(result.checklists[3].documentPath).toBe(
      "BackOffice/業務チェックリスト/データ品質検証"
    );

    // 各チェックリストのフォルダ階層が正確に設定されていることを確認
    expect(result.checklists[0].folderHierarchy).toEqual([
      "BackOffice",
      "業務チェックリスト",
      "請求書作成",
    ]);
    expect(result.checklists[1].folderHierarchy).toEqual([
      "BackOffice",
      "業務チェックリスト",
      "営業報告書集計",
    ]);
    expect(result.checklists[2].folderHierarchy).toEqual([
      "BackOffice",
      "業務チェックリスト",
      "契約書管理",
    ]);
    expect(result.checklists[3].folderHierarchy).toEqual([
      "BackOffice",
      "業務チェックリスト",
      "データ品質検証",
    ]);

    // 複数チェックリスト間でドキュメント名の命名形式が一貫していることを検証
    const namingPattern = /^checklist_\d{3}_\d{4}-\d{2}-\d{2}$/;
    result.checklists.forEach((checklist) => {
      expect(checklist.name).toMatch(namingPattern);
    });

    // 複数チェックリスト間でフォルダ階層構成が一貫していることを検証
    result.checklists.forEach((checklist) => {
      expect(checklist.folderHierarchy.length).toBe(3);
      expect(checklist.folderHierarchy[0]).toBe("BackOffice");
      expect(checklist.folderHierarchy[1]).toBe("業務チェックリスト");
      expect(checklist.folderHierarchy[2]).toBeTruthy();
    });

    // エクスポート結果の検証
    expect(result.exportedData).toBeDefined();
    expect(result.exportedData.appliedCount).toBe(4);
    expect(result.exportedData.uniformityStatus).toBe("consistent");
    expect(result.exportedData.timestamp).toMatch(
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/
    );

    // エクスポート結果に適用内容が正確に反映されていることを確認
    expect(result.exportedData.details).toHaveLength(4);
    expect(result.exportedData.details[0]).toEqual({
      checklistId: "checklist-001",
      beforeName: "请求書作成",
      afterName: "checklist_001_2024-01-15",
      beforePath: "Documents/請求管理",
      afterPath: "BackOffice/業務チェックリスト/請求書作成",
      status: "applied",
    });
    expect(result.exportedData.details[1]).toEqual({
      checklistId: "checklist-002",
      beforeName: "営業報告書集計",
      afterName: "checklist_002_2024-01-15",
      beforePath: "Docs/営業成果",
      afterPath: "BackOffice/業務チェックリスト/営業報告書集計",
      status: "applied",
    });
    expect(result.exportedData.details[2]).toEqual({
      checklistId: "checklist-003",
      beforeName: "契約書管理",
      afterName: "checklist_003_2024-01-15",
      beforePath: "File/契約管理フォルダ",
      afterPath: "BackOffice/業務チェックリスト/契約書管理",
      status: "applied",
    });
    expect(result.exportedData.details[3]).toEqual({
      checklistId: "checklist-004",
      beforeName: "データ品質検証",
      afterName: "checklist_004_2024-01-15",
      beforePath: "BackOffice/Quality",
      afterPath: "BackOffice/業務チェックリスト/データ品質検証",
      status: "applied",
    });

    // 全チェックリストが正常に処理されたことを確認
    expect(result.successCount).toBe(4);
    expect(result.errorCount).toBe(0);
    expect(result.totalProcessed).toBe(4);
  });
});