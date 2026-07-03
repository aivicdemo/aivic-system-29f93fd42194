import { describe, test, expect } from "@jest/globals";
import { selectMetadataVersionByPriority } from "../../src/logic/it-1781935279444-1-1-1";

describe("営業データ項目メタデータ管理", () => {
  test("SCEN-788: 優先度が同じ複数バージョン存在時、最新作成日時のバージョンを優先する", () => {
    // Setup: 同じ優先度を持つ複数バージョンデータ
    const metadataVersions = [
      {
        version_id: "meta_v_001",
        item_name: "アポ数",
        priority: 1,
        created_at: "2024-01-01T10:00:00Z",
        updated_at: "2024-01-01T10:00:00Z",
        data_type: "integer",
        unit: "件",
        calculation_logic: "COUNT(appointment)",
        report_mapping_key: "appointments_count",
        is_active: true,
      },
      {
        version_id: "meta_v_002",
        item_name: "アポ数",
        priority: 1,
        created_at: "2024-01-01T15:00:00Z",
        updated_at: "2024-01-01T15:00:00Z",
        data_type: "integer",
        unit: "件",
        calculation_logic: "COUNT(appointment)",
        report_mapping_key: "appointments_count",
        is_active: true,
      },
      {
        version_id: "meta_v_003",
        item_name: "アポ数",
        priority: 1,
        created_at: "2024-01-01T12:00:00Z",
        updated_at: "2024-01-01T12:00:00Z",
        data_type: "integer",
        unit: "件",
        calculation_logic: "COUNT(appointment)",
        report_mapping_key: "appointments_count",
        is_active: true,
      },
    ];

    // Execute: 優先度ベース特定機能を実行
    const selectedVersion = selectMetadataVersionByPriority(metadataVersions);

    // Verify: 返却されたバージョンの検証
    expect(selectedVersion).toBeDefined();
    expect(selectedVersion.version_id).toBe("meta_v_002");
    expect(selectedVersion.created_at).toBe("2024-01-01T15:00:00Z");
    expect(selectedVersion.priority).toBe(1);
    expect(selectedVersion.item_name).toBe("アポ数");
    expect(selectedVersion.data_type).toBe("integer");
    expect(selectedVersion.unit).toBe("件");
    expect(selectedVersion.calculation_logic).toBe("COUNT(appointment)");
    expect(selectedVersion.report_mapping_key).toBe("appointments_count");
    expect(selectedVersion.is_active).toBe(true);
  });
});