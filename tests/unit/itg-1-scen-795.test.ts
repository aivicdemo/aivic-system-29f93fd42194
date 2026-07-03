import { determineLatestDocumentVersion } from "../../src/logic/it-1781935279444-1-1-1";

describe("営業データ項目のメタデータ管理機能 - 文書バージョン最新版自動判定", () => {
  test("SCEN-795: 同一タイムスタンプを持つ複数バージョンが存在する場合に最新版が正しく判定される", () => {
    // テストデータ: 同一タイムスタンプを持つ3つのバージョン
    const commonTimestamp = "2024-01-15T10:30:00Z";
    const versionV1 = {
      versionId: "v1-uuid-001",
      versionNumber: 1,
      documentId: "doc-001",
      content: "Initial version content",
      createdAt: commonTimestamp,
      updatedAt: commonTimestamp,
      metadata: {
        priority: 1,
        status: "active",
      },
    };

    const versionV2 = {
      versionId: "v2-uuid-002",
      versionNumber: 2,
      documentId: "doc-001",
      content: "Updated version content v2",
      createdAt: commonTimestamp,
      updatedAt: commonTimestamp,
      metadata: {
        priority: 2,
        status: "active",
      },
    };

    const versionV3 = {
      versionId: "v3-uuid-003",
      versionNumber: 3,
      documentId: "doc-001",
      content: "Latest version content v3",
      createdAt: commonTimestamp,
      updatedAt: commonTimestamp,
      metadata: {
        priority: 3,
        status: "active",
      },
    };

    const versions = [versionV1, versionV2, versionV3];

    // 関数実行: 文書バージョン最新版自動判定機能を実行
    const result = determineLatestDocumentVersion(versions);

    // 検証: 最新版が正しく判定されているか
    // versionNumber が最大のバージョン（v3）が最新版として返されることを確認
    expect(result).toEqual({
      versionId: "v3-uuid-003",
      versionNumber: 3,
      documentId: "doc-001",
      content: "Latest version content v3",
      createdAt: commonTimestamp,
      updatedAt: commonTimestamp,
      metadata: {
        priority: 3,
        status: "active",
      },
    });

    // 検証: 判定ロジックが記録されているか（返却結果に判定基準の情報が含まれているか）
    expect(result.versionNumber).toBe(3);
    expect(result.metadata.priority).toBe(3);

    // 検証: 同じタイムスタンプを持つバージョン間で一意に最新版が決定されていることを確認
    // 複数回実行しても同じバージョンを最新版として返すことを確認（一貫性チェック）
    const result2 = determineLatestDocumentVersion(versions);
    expect(result2.versionId).toBe("v3-uuid-003");
    expect(result2.versionNumber).toBe(3);

    // 検証: 別の順序で入力した場合も同じ最新版が判定されることを確認
    const versionsReordered = [versionV3, versionV1, versionV2];
    const result3 = determineLatestDocumentVersion(versionsReordered);
    expect(result3.versionId).toBe("v3-uuid-003");
    expect(result3.versionNumber).toBe(3);

    // 検証: バージョン番号の大小が判定基準となることを確認
    const versionWithHigherNumberButLowerPriority = {
      versionId: "v4-uuid-004",
      versionNumber: 4,
      documentId: "doc-001",
      content: "Even newer version",
      createdAt: commonTimestamp,
      updatedAt: commonTimestamp,
      metadata: {
        priority: 1,
        status: "active",
      },
    };

    const versionsWithV4 = [versionV1, versionV2, versionV3, versionWithHigherNumberButLowerPriority];
    const result4 = determineLatestDocumentVersion(versionsWithV4);
    expect(result4.versionNumber).toBe(4);
    expect(result4.versionId).toBe("v4-uuid-004");
  });
});