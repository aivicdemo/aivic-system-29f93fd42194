import { describe, test, expect, beforeEach } from "@jest/globals";
import {
  selectLatestPricebookVersionForItemMapping,
} from "../../src/logic/it-6-2-2-2";

describe("査定員別の判定精度・乖離パターン分析ダッシュボード", () => {
  // SCEN-887: [normal] 物価本との項目マッピング・適用基準特定 - 複数の物価本が該当する場合に最新版が優先的に選択される
  test("複数の物価本バージョンが存在する場合、最新版が優先的に選択されて項目マッピングが適用されること", () => {
    // Arrange
    const pricebooks = [
      {
        pricebook_id: "pb_001",
        version: "2022",
        release_date: "2022-01-15",
        effective_until: "2022-12-31",
        item_mappings: [
          {
            item_id: "item_001",
            pricebook_item_code: "PB2022_001",
            unit_price: 10000,
          },
          {
            item_id: "item_002",
            pricebook_item_code: "PB2022_002",
            unit_price: 25000,
          },
        ],
        status: "archived",
      },
      {
        pricebook_id: "pb_002",
        version: "2023",
        release_date: "2023-01-20",
        effective_until: "2023-12-31",
        item_mappings: [
          {
            item_id: "item_001",
            pricebook_item_code: "PB2023_001",
            unit_price: 11000,
          },
          {
            item_id: "item_002",
            pricebook_item_code: "PB2023_002",
            unit_price: 26500,
          },
        ],
        status: "archived",
      },
      {
        pricebook_id: "pb_003",
        version: "2024",
        release_date: "2024-01-10",
        effective_until: "2024-12-31",
        item_mappings: [
          {
            item_id: "item_001",
            pricebook_item_code: "PB2024_001",
            unit_price: 12000,
          },
          {
            item_id: "item_002",
            pricebook_item_code: "PB2024_002",
            unit_price: 28000,
          },
        ],
        status: "active",
      },
    ];

    const assessment_items = [
      {
        item_id: "item_001",
        item_name: "基礎工",
        quantity: 100,
        unit: "m2",
      },
      {
        item_id: "item_002",
        item_name: "躯体工",
        quantity: 50,
        unit: "m3",
      },
    ];

    const assessment_date = "2024-06-15";

    // Act
    const result = selectLatestPricebookVersionForItemMapping({
      pricebooks,
      assessment_items,
      assessment_date,
    });

    // Assert - 最新版（2024年版）が選択されたことを確認
    expect(result.selected_pricebook_id).toBe("pb_003");
    expect(result.selected_version).toBe("2024");
    expect(result.selected_release_date).toBe("2024-01-10");

    // Assert - 最新版の項目マッピングが適用されたことを確認
    expect(result.applied_item_mappings).toEqual([
      {
        item_id: "item_001",
        pricebook_item_code: "PB2024_001",
        unit_price: 12000,
      },
      {
        item_id: "item_002",
        pricebook_item_code: "PB2024_002",
        unit_price: 28000,
      },
    ]);

    // Assert - マッピング適用結果の詳細を確認
    expect(result.mapping_results).toHaveLength(2);
    expect(result.mapping_results[0]).toEqual({
      item_id: "item_001",
      item_name: "基礎工",
      quantity: 100,
      unit: "m2",
      applied_unit_price: 12000,
      applied_pricebook_code: "PB2024_001",
      total_amount: 1200000,
    });
    expect(result.mapping_results[1]).toEqual({
      item_id: "item_002",
      item_name: "躯体工",
      quantity: 50,
      unit: "m3",
      applied_unit_price: 28000,
      applied_pricebook_code: "PB2024_002",
      total_amount: 1400000,
    });

    // Assert - 選択ロジックが適切に記録されたことを確認
    expect(result.selection_logic).toEqual({
      method: "latest_version_first",
      candidates_count: 3,
      selected_index: 2,
      selection_reason: "最新版物価本を優先適用",
    });

    // Assert - ログ記録が存在し、最新版選択が記録されていることを確認
    expect(result.audit_log).toHaveLength(1);
    expect(result.audit_log[0]).toMatchObject({
      event_type: "pricebook_version_selected",
      selected_pricebook_id: "pb_003",
      selected_version: "2024",
      release_date: "2024-01-10",
      assessment_date: "2024-06-15",
      selection_criteria: "latest_version",
    });

    // Assert - 総合マッピング結果を確認
    expect(result.total_assessed_amount).toBe(2600000);
    expect(result.mapping_completeness).toBe(100);
    expect(result.status).toBe("success");
  });
});