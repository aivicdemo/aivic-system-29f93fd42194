import { detectMetadataContradictions } from "../../src/logic/it-1781935279444-1-1-1";

describe("営業データ項目のメタデータ管理機能", () => {
  // SCEN-1040
  test("メタデータに矛盾する定義が含まれている場合、警告として検出される", () => {
    const metadata_item_id = "meta_001";
    const field_name = "顧客ID";

    const metadata_definitions = [
      {
        metadata_item_id: metadata_item_id,
        field_name: field_name,
        data_type: "numeric",
        unit: "件",
        is_required: true,
        calculation_logic: "customer_id",
        report_mapping: "customer_id_column",
        version: 1,
        created_at: new Date("2024-01-15T09:00:00Z"),
        updated_at: new Date("2024-01-15T09:00:00Z"),
      },
      {
        metadata_item_id: metadata_item_id,
        field_name: field_name,
        data_type: "string",
        unit: "件",
        is_required: true,
        calculation_logic: "customer_id",
        report_mapping: "customer_id_column",
        version: 2,
        created_at: new Date("2024-01-15T10:00:00Z"),
        updated_at: new Date("2024-01-15T10:00:00Z"),
      },
    ];

    const result = detectMetadataContradictions(metadata_definitions);

    expect(result.has_contradiction).toBe(true);
    expect(result.contradiction_details).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          metadata_item_id: metadata_item_id,
          field_name: field_name,
          contradiction_type: "data_type_mismatch",
          conflicting_values: ["numeric", "string"],
        }),
      ])
    );
    expect(result.warning_message).toMatch(/顧客ID/);
    expect(result.warning_message).toMatch(/データ型/);
    expect(result.is_locked).toBe(true);
    expect(result.usage_restricted).toBe(true);
  });
});