import { determineLatestContractVersion } from "../../src/logic/it-1781935279444-1-1-1";

describe("営業データ項目のメタデータ管理機能", () => {
  test("SCEN-1081: 複数バージョンが存在する場合に最新の有効バージョンと最終更新日時が正しく判定される", () => {
    // テストデータ: 同一契約書の複数バージョン
    const contractVersions = [
      {
        versionId: "v1-0-id",
        contractId: "contract-001",
        versionNumber: "v1.0",
        updatedAt: new Date("2024-01-01T10:00:00Z"),
        effectiveStartDate: new Date("2024-01-01T00:00:00Z"),
        effectiveEndDate: new Date("2024-02-14T23:59:59Z"),
        isActive: true,
      },
      {
        versionId: "v1-1-id",
        contractId: "contract-001",
        versionNumber: "v1.1",
        updatedAt: new Date("2024-02-15T14:30:00Z"),
        effectiveStartDate: new Date("2024-02-15T00:00:00Z"),
        effectiveEndDate: new Date("2024-03-09T23:59:59Z"),
        isActive: true,
      },
      {
        versionId: "v2-0-id",
        contractId: "contract-001",
        versionNumber: "v2.0",
        updatedAt: new Date("2024-03-10T09:15:00Z"),
        effectiveStartDate: new Date("2024-03-10T00:00:00Z"),
        effectiveEndDate: new Date("2099-12-31T23:59:59Z"),
        isActive: true,
      },
      {
        versionId: "v-invalid-id",
        contractId: "contract-001",
        versionNumber: "v0.5",
        updatedAt: new Date("2023-12-01T08:00:00Z"),
        effectiveStartDate: new Date("2023-12-01T00:00:00Z"),
        effectiveEndDate: new Date("2023-12-31T23:59:59Z"),
        isActive: false,
      },
    ];

    const referenceDate = new Date("2024-05-01T00:00:00Z");

    // 最新有効バージョン判定処理を実行
    const result = determineLatestContractVersion(
      contractVersions,
      referenceDate
    );

    // 最新の有効バージョンがv2.0として正しく判定されることを確認
    expect(result.versionNumber).toBe("v2.0");
    expect(result.versionId).toBe("v2-0-id");

    // 最終更新日時が2024-03-10T09:15:00Zとして返されることを確認
    expect(result.updatedAt).toEqual(new Date("2024-03-10T09:15:00Z"));

    // v1.0とv1.1が過去バージョンとして正しく識別されていることを確認
    expect(result.previousVersions).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          versionNumber: "v1.0",
          versionId: "v1-0-id",
        }),
        expect.objectContaining({
          versionNumber: "v1.1",
          versionId: "v1-1-id",
        }),
      ])
    );
    expect(result.previousVersions).toHaveLength(2);

    // 無効なバージョン（isActive: false）が判定対象から除外されていることを確認
    expect(
      result.previousVersions.some((v) => v.versionNumber === "v0.5")
    ).toBe(false);

    // 有効期限チェック: v2.0が参照日時で有効であることを確認
    expect(result.isCurrentlyValid).toBe(true);

    // バージョン判定が正しい優先度で行われていることを確認
    // 最新の更新日時を持つアクティブなバージョンが選ばれていることを確認
    expect(result.versionNumber).not.toBe("v1.1");
    expect(result.versionNumber).not.toBe("v1.0");
    expect(result.versionNumber).not.toBe("v0.5");
  });
});