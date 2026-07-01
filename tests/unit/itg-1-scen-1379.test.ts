import {
  checkMetadataTypeCompatibility,
} from "../../src/logic/it-1781935279444-1-1-1";

describe("営業データ項目メタデータ管理機能 - データ型互換性判定", () => {
  // SCEN-1379
  test("既存メタデータのデータ型変更時、旧版との互換性が正確に判定される", () => {
    // ============ 互換性のある型への変更テスト ============
    const compatibleChangeResult = checkMetadataTypeCompatibility({
      itemId: "item_001",
      itemName: "顧客名",
      currentDataType: "string",
      newDataType: "varchar",
      previousVersionDataType: "string",
      affectedRecordCount: 1500,
    });

    expect(compatibleChangeResult).toEqual({
      isCompatible: true,
      warning: null,
      errorMessage: null,
      impactedRecords: 1500,
      migrationRequired: false,
      detailedImpactSummary: "string型からvarchar型への変更は互換性があり、既存データの移行は不要です",
    });

    // ============ 互換性のない型への変更テスト ============
    const incompatibleChangeResult = checkMetadataTypeCompatibility({
      itemId: "item_002",
      itemName: "アポ数",
      currentDataType: "numeric",
      newDataType: "boolean",
      previousVersionDataType: "numeric",
      affectedRecordCount: 2300,
    });

    expect(incompatibleChangeResult).toEqual({
      isCompatible: false,
      warning: "互換性のない型変更です。既存データの変換が必要になります。",
      errorMessage: "numeric型からboolean型への変更は互換性がありません",
      impactedRecords: 2300,
      migrationRequired: true,
      detailedImpactSummary:
        "numeric型(数値)からboolean型(真偽値)への変換は自動では不可能です。影響対象レコード数: 2300件。データ移行戦略が必要です。",
    });

    // ============ 数値関連型の互換性テスト ============
    const numericCompatibleResult = checkMetadataTypeCompatibility({
      itemId: "item_003",
      itemName: "成約数",
      currentDataType: "int",
      newDataType: "bigint",
      previousVersionDataType: "int",
      affectedRecordCount: 850,
    });

    expect(numericCompatibleResult).toEqual({
      isCompatible: true,
      warning: null,
      errorMessage: null,
      impactedRecords: 850,
      migrationRequired: false,
      detailedImpactSummary: "int型からbigint型への変更は互換性があり、既存データの移行は不要です",
    });

    // ============ 日付型の互換性テスト ============
    const dateCompatibleResult = checkMetadataTypeCompatibility({
      itemId: "item_004",
      itemName: "接触日時",
      currentDataType: "date",
      newDataType: "datetime",
      previousVersionDataType: "date",
      affectedRecordCount: 5200,
    });

    expect(dateCompatibleResult).toEqual({
      isCompatible: true,
      warning: null,
      errorMessage: null,
      impactedRecords: 5200,
      migrationRequired: false,
      detailedImpactSummary:
        "date型からdatetime型への変更は互換性があり、既存データの移行は不要です",
    });

    // ============ 文字列型から数値型への変更テスト（互換性なし） ============
    const stringToNumericResult = checkMetadataTypeCompatibility({
      itemId: "item_005",
      itemName: "顧客ID",
      currentDataType: "string",
      newDataType: "numeric",
      previousVersionDataType: "string",
      affectedRecordCount: 3100,
    });

    expect(stringToNumericResult).toEqual({
      isCompatible: false,
      warning: "互換性のない型変更です。既存データの変換が必要になります。",
      errorMessage: "string型からnumeric型への変更は互換性がありません",
      impactedRecords: 3100,
      migrationRequired: true,
      detailedImpactSummary:
        "string型から numeric型への変換には検証ロジックが必須です。影響対象レコード数: 3100件。変換可能なデータと非可逆的なデータの分離が必要です。",
    });

    // ============ 互換性のない型変更時のエラー検出テスト ============
    expect(() =>
      checkMetadataTypeCompatibility({
        itemId: "item_006",
        itemName: "顧客反応",
        currentDataType: "boolean",
        newDataType: "text",
        previousVersionDataType: "boolean",
        affectedRecordCount: 0, // affectedRecordCount が 0 の場合
      })
    ).toThrow(/互換性/);

    // ============ 無効な旧データ型での検出テスト ============
    expect(() =>
      checkMetadataTypeCompatibility({
        itemId: "item_007",
        itemName: "テスト項目",
        currentDataType: "string",
        newDataType: "varchar",
        previousVersionDataType: "invalid_type",
        affectedRecordCount: 1000,
      })
    ).toThrow(/データ型/);
  });
});