import { describe, test, expect, beforeEach } from "@jest/globals";
import {
  recordMetadataVersionChange,
  type SalesDataItemMetadataVersionInput,
  type SalesDataItemMetadataVersionOutput,
} from "../../src/logic/it-1781935279444-1-1-1";

describe("営業データ項目メタデータ版管理機能", () => {
  // SCEN-1349
  test("営業データ項目定義の変更が記録され、新しいバージョンとして管理される", () => {
    const before_version_id = "meta_v_001";
    const before_item_name = "アポイント数";
    const before_data_type = "integer";
    const before_unit = "件";
    const before_is_required = true;
    const before_calculation_logic = "COUNT(contact_records WHERE status='appointed')";
    const before_report_mapping = "report_item_apo_count";

    const after_version_id = "meta_v_002";
    const after_item_name = "アポイント数（修正版）";
    const after_data_type = "integer";
    const after_unit = "件";
    const after_is_required = true;
    const after_calculation_logic =
      "COUNT(contact_records WHERE status='appointed' AND created_at >= month_start)";
    const after_report_mapping = "report_item_apo_count_v2";

    const changed_by_user_id = "user_001";
    const changed_by_user_name = "田中太郎";
    const changed_timestamp = new Date("2024-02-15T10:30:00Z");

    const input: SalesDataItemMetadataVersionInput = {
      metadata_item_id: "item_001",
      before_version: {
        version_id: before_version_id,
        item_name: before_item_name,
        data_type: before_data_type,
        unit: before_unit,
        is_required: before_is_required,
        calculation_logic: before_calculation_logic,
        report_mapping: before_report_mapping,
        created_timestamp: new Date("2024-01-01T09:00:00Z"),
        created_by_user_id: "user_system",
      },
      after_version: {
        version_id: after_version_id,
        item_name: after_item_name,
        data_type: after_data_type,
        unit: after_unit,
        is_required: after_is_required,
        calculation_logic: after_calculation_logic,
        report_mapping: after_report_mapping,
      },
      changed_by_user_id: changed_by_user_id,
      changed_by_user_name: changed_by_user_name,
      changed_timestamp: changed_timestamp,
    };

    const result: SalesDataItemMetadataVersionOutput =
      recordMetadataVersionChange(input);

    // 新バージョンが作成されたことを確認
    expect(result.new_version_id).toBe(after_version_id);
    expect(result.new_version_created).toBe(true);

    // 変更内容の差分情報が記録されていることを確認
    expect(result.version_diff).toEqual({
      item_name: {
        before: before_item_name,
        after: after_item_name,
        changed: true,
      },
      data_type: {
        before: before_data_type,
        after: after_data_type,
        changed: false,
      },
      unit: {
        before: before_unit,
        after: after_unit,
        changed: false,
      },
      is_required: {
        before: before_is_required,
        after: after_is_required,
        changed: false,
      },
      calculation_logic: {
        before: before_calculation_logic,
        after: after_calculation_logic,
        changed: true,
      },
      report_mapping: {
        before: before_report_mapping,
        after: after_report_mapping,
        changed: true,
      },
    });

    // 変更者情報が記録されていることを確認
    expect(result.changed_by_user_id).toBe(changed_by_user_id);
    expect(result.changed_by_user_name).toBe(changed_by_user_name);

    // タイムスタンプが記録されていることを確認
    expect(result.changed_timestamp).toEqual(changed_timestamp);

    // 前バージョンが参照可能な状態で保持されていることを確認
    expect(result.previous_version_preserved).toBe(true);
    expect(result.previous_version_id).toBe(before_version_id);
    expect(result.previous_version_accessible).toBe(true);

    // バージョン履歴が複数世代で管理されていることを確認
    expect(result.version_history_count).toBeGreaterThanOrEqual(2);
    expect(result.version_sequence).toEqual([
      before_version_id,
      after_version_id,
    ]);

    // 変更内容が正常に記録されたことを確認
    expect(result.record_status).toBe("success");
    expect(result.metadata_item_id).toBe("item_001");
  });
});