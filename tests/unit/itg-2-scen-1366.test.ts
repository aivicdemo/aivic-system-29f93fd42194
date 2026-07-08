import { applyFormatJudgmentLogicWithExceptionRecording } from "../../src/logic/it-6-2-2-1";

describe("他部署フォーマット判定ロジック適用試験 - フォーマット差異境界値テスト", () => {
  test("SCEN-1366: フォーマット差異0件、1件、複数件の全境界で例外情報が正確に記録される", () => {
    // ===== ケース1: フォーマット差異 0 件 =====
    const testDataZeroDiff = {
      format_test_id: "FT-20250526-001",
      source_department: "査定部署",
      target_department: "営業部",
      estimate_format_items: [
        { item_id: "item_001", item_name: "工事種別", format_type: "string", value: "基礎工事" },
        { item_id: "item_002", item_name: "金額", format_type: "number", value: 5000000 },
        { item_id: "item_003", item_name: "数量", format_type: "number", value: 100 },
      ],
      target_format_items: [
        { item_id: "item_001", item_name: "工事種別", format_type: "string", value: "基礎工事" },
        { item_id: "item_002", item_name: "金額", format_type: "number", value: 5000000 },
        { item_id: "item_003", item_name: "数量", format_type: "number", value: 100 },
      ],
      test_timestamp: "2025-05-26T10:00:00Z",
    };

    const resultZeroDiff = applyFormatJudgmentLogicWithExceptionRecording(testDataZeroDiff);

    expect(resultZeroDiff.format_diff_count).toBe(0);
    expect(resultZeroDiff.exception_recorded).toBe(true);
    expect(resultZeroDiff.exception_info).toBeDefined();
    expect(resultZeroDiff.exception_info.error_code).toBe("FORMAT_DIFF_ZERO");
    expect(resultZeroDiff.exception_info.diff_count).toBe(0);
    expect(resultZeroDiff.exception_info.message).toMatch(/フォーマット差異なし/);
    expect(resultZeroDiff.exception_info.timestamp).toMatch(/2025-05-26T10:00:00Z/);
    expect(resultZeroDiff.exception_info.source_department).toBe("査定部署");
    expect(resultZeroDiff.exception_info.target_department).toBe("営業部");
    expect(resultZeroDiff.exception_details).toEqual([]);
    expect(resultZeroDiff.execution_status).toBe("completed");

    // ===== ケース2: フォーマット差異 1 件 =====
    const testDataOneDiff = {
      format_test_id: "FT-20250526-002",
      source_department: "査定部署",
      target_department: "原価管理部",
      estimate_format_items: [
        { item_id: "item_001", item_name: "工事種別", format_type: "string", value: "基礎工事" },
        { item_id: "item_002", item_name: "金額", format_type: "number", value: 5000000 },
        { item_id: "item_003", item_name: "数量", format_type: "number", value: 100 },
      ],
      target_format_items: [
        { item_id: "item_001", item_name: "工事種別", format_type: "string", value: "基礎工事" },
        { item_id: "item_002", item_name: "金額", format_type: "string", value: "5000000" },
        { item_id: "item_003", item_name: "数量", format_type: "number", value: 100 },
      ],
      test_timestamp: "2025-05-26T10:15:00Z",
    };

    const resultOneDiff = applyFormatJudgmentLogicWithExceptionRecording(testDataOneDiff);

    expect(resultOneDiff.format_diff_count).toBe(1);
    expect(resultOneDiff.exception_recorded).toBe(true);
    expect(resultOneDiff.exception_info).toBeDefined();
    expect(resultOneDiff.exception_info.error_code).toBe("FORMAT_DIFF_SINGLE");
    expect(resultOneDiff.exception_info.diff_count).toBe(1);
    expect(resultOneDiff.exception_info.message).toMatch(/フォーマット差異が検出/);
    expect(resultOneDiff.exception_info.timestamp).toMatch(/2025-05-26T10:15:00Z/);
    expect(resultOneDiff.exception_info.source_department).toBe("査定部署");
    expect(resultOneDiff.exception_info.target_department).toBe("原価管理部");
    expect(resultOneDiff.exception_details.length).toBe(1);
    expect(resultOneDiff.exception_details[0].item_id).toBe("item_002");
    expect(resultOneDiff.exception_details[0].source_type).toBe("number");
    expect(resultOneDiff.exception_details[0].target_type).toBe("string");
    expect(resultOneDiff.execution_status).toBe("completed");

    // ===== ケース3: フォーマット差異複数件（2件） =====
    const testDataMultipleDiff = {
      format_test_id: "FT-20250526-003",
      source_department: "査定部署",
      target_department: "工務部",
      estimate_format_items: [
        { item_id: "item_001", item_name: "工事種別", format_type: "string", value: "基礎工事" },
        { item_id: "item_002", item_name: "金額", format_type: "number", value: 5000000 },
        { item_id: "item_003", item_name: "数量", format_type: "number", value: 100 },
        { item_id: "item_004", item_name: "単価", format_type: "number", value: 50000 },
      ],
      target_format_items: [
        { item_id: "item_001", item_name: "工事種別", format_type: "string", value: "基礎工事" },
        { item_id: "item_002", item_name: "金額", format_type: "string", value: "5000000" },
        { item_id: "item_003", item_name: "数量", format_type: "integer", value: 100 },
        { item_id: "item_004", item_name: "単価", format_type: "number", value: 50000 },
      ],
      test_timestamp: "2025-05-26T10:30:00Z",
    };

    const resultMultipleDiff = applyFormatJudgmentLogicWithExceptionRecording(testDataMultipleDiff);

    expect(resultMultipleDiff.format_diff_count).toBe(2);
    expect(resultMultipleDiff.exception_recorded).toBe(true);
    expect(resultMultipleDiff.exception_info).toBeDefined();
    expect(resultMultipleDiff.exception_info.error_code).toBe("FORMAT_DIFF_MULTIPLE");
    expect(resultMultipleDiff.exception_info.diff_count).toBe(2);
    expect(resultMultipleDiff.exception_info.message).toMatch(/複数のフォーマット差異/);
    expect(resultMultipleDiff.exception_info.timestamp).toMatch(/2025-05-26T10:30:00Z/);
    expect(resultMultipleDiff.exception_info.source_department).toBe("査定部署");
    expect(resultMultipleDiff.exception_info.target_department).toBe("工務部");
    expect(resultMultipleDiff.exception_details.length).toBe(2);
    expect(resultMultipleDiff.execution_status).toBe("completed");

    // 差異詳細の検証 - 差異 1
    const diff1 = resultMultipleDiff.exception_details.find((d) => d.item_id === "item_002");
    expect(diff1).toBeDefined();
    expect(diff1!.source_type).toBe("number");
    expect(diff1!.target_type).toBe("string");
    expect(diff1!.difference_category).toBe("type_mismatch");

    // 差異詳細の検証 - 差異 2
    const diff2 = resultMultipleDiff.exception_details.find((d) => d.item_id === "item_003");
    expect(diff2).toBeDefined();
    expect(diff2!.source_type).toBe("number");
    expect(diff2!.target_type).toBe("integer");
    expect(diff2!.difference_category).toBe("type_mismatch");

    // ===== 各ケース間での例外情報の区別性を検証 =====
    expect(resultZeroDiff.exception_info.error_code).not.toBe(resultOneDiff.exception_info.error_code);
    expect(resultOneDiff.exception_info.error_code).not.toBe(resultMultipleDiff.exception_info.error_code);

    // タイムスタンプが異なることを確認
    expect(resultZeroDiff.exception_info.timestamp).not.toBe(resultOneDiff.exception_info.timestamp);
    expect(resultOneDiff.exception_info.timestamp).not.toBe(resultMultipleDiff.exception_info.timestamp);

    // 差異数が正確に区別されていることを確認
    expect(resultZeroDiff.exception_info.diff_count).toBe(0);
    expect(resultOneDiff.exception_info.diff_count).toBe(1);
    expect(resultMultipleDiff.exception_info.diff_count).toBe(2);

    // 各ケースのログ出力が完全性を持つことを検証
    expect(resultZeroDiff.log_entries).toBeDefined();
    expect(resultZeroDiff.log_entries.length).toBeGreaterThan(0);
    expect(resultZeroDiff.log_entries[0]).toHaveProperty("timestamp");
    expect(resultZeroDiff.log_entries[0]).toHaveProperty("level");
    expect(resultZeroDiff.log_entries[0]).toHaveProperty("message");

    expect(resultOneDiff.log_entries).toBeDefined();
    expect(resultOneDiff.log_entries.length).toBeGreaterThan(0);
    expect(resultOneDiff.log_entries[0]).toHaveProperty("timestamp");
    expect(resultOneDiff.log_entries[0]).toHaveProperty("error_code");

    expect(resultMultipleDiff.log_entries).toBeDefined();
    expect(resultMultipleDiff.log_entries.length).toBeGreaterThan(0);
    expect(resultMultipleDiff.log_entries[0]).toHaveProperty("timestamp");
    expect(resultMultipleDiff.log_entries[0]).toHaveProperty("error_code");
    expect(resultMultipleDiff.log_entries[0]).toHaveProperty("diff_details_summary");
  });
});