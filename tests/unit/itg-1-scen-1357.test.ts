import { generateQualityChecklistFromMetadata } from "../../src/logic/it-1781935279444-2-1-1";

describe("品質管理ルール・チェックリスト作成機能", () => {
  // SCEN-1357
  test("営業データ項目メタデータから検証項目・実行タイミング・判定基準が正常に抽出されチェックリストが生成される", () => {
    const input_metadata = [
      {
        field_id: "field_001",
        field_name: "customer_name",
        data_type: "string",
        is_required: true,
        validation_rules: [
          {
            rule_id: "rule_001",
            rule_type: "not_empty",
            error_message: "顧客名",
          },
          {
            rule_id: "rule_002",
            rule_type: "max_length",
            max_length: 100,
            error_message: "顧客名",
          },
        ],
        execution_timing: ["on_create", "on_update"],
        judgment_criteria: {
          min_length: 1,
          max_length: 100,
          allowed_chars: "alphanumeric_jp",
        },
      },
      {
        field_id: "field_002",
        field_name: "appointment_date",
        data_type: "date",
        is_required: true,
        validation_rules: [
          {
            rule_id: "rule_003",
            rule_type: "date_format",
            date_format: "YYYY-MM-DD",
            error_message: "接触日時",
          },
          {
            rule_id: "rule_004",
            rule_type: "date_range",
            min_date: "2024-01-01",
            max_date: "2024-12-31",
            error_message: "接触日時",
          },
        ],
        execution_timing: ["on_create", "periodic"],
        judgment_criteria: {
          format: "YYYY-MM-DD",
          min_date: "2024-01-01",
          max_date: "2024-12-31",
          reference_rule: "current_fiscal_year",
        },
      },
      {
        field_id: "field_003",
        field_name: "contract_amount",
        data_type: "number",
        is_required: true,
        validation_rules: [
          {
            rule_id: "rule_005",
            rule_type: "numeric_range",
            min_value: 0,
            max_value: 10000000,
            error_message: "契約金額",
          },
          {
            rule_id: "rule_006",
            rule_type: "not_negative",
            error_message: "契約金額",
          },
        ],
        execution_timing: ["on_create", "on_update"],
        judgment_criteria: {
          min_value: 0,
          max_value: 10000000,
          decimal_places: 2,
        },
      },
      {
        field_id: "field_004",
        field_name: "status",
        data_type: "enum",
        is_required: true,
        validation_rules: [
          {
            rule_id: "rule_007",
            rule_type: "enum_value",
            allowed_values: ["pending", "approved", "rejected"],
            error_message: "ステータス",
          },
        ],
        execution_timing: ["on_create", "on_update"],
        judgment_criteria: {
          allowed_values: ["pending", "approved", "rejected"],
        },
      },
    ];

    const result = generateQualityChecklistFromMetadata(input_metadata);

    expect(result).toBeDefined();
    expect(result.checklist_id).toBeDefined();
    expect(result.checklist_id).toMatch(/^checklist_/);

    expect(result.items).toBeDefined();
    expect(Array.isArray(result.items)).toBe(true);
    expect(result.items.length).toBe(7);

    const item_001_not_empty = result.items.find(
      (item) => item.rule_id === "rule_001"
    );
    expect(item_001_not_empty).toBeDefined();
    expect(item_001_not_empty.field_id).toBe("field_001");
    expect(item_001_not_empty.field_name).toBe("customer_name");
    expect(item_001_not_empty.rule_type).toBe("not_empty");
    expect(item_001_not_empty.execution_timings).toEqual([
      "on_create",
      "on_update",
    ]);
    expect(item_001_not_empty.judgment_criteria.min_length).toBe(1);
    expect(item_001_not_empty.judgment_criteria.max_length).toBe(100);
    expect(item_001_not_empty.error_keyword).toBe("顧客名");

    const item_002_max_length = result.items.find(
      (item) => item.rule_id === "rule_002"
    );
    expect(item_002_max_length).toBeDefined();
    expect(item_002_max_length.field_id).toBe("field_001");
    expect(item_002_max_length.rule_type).toBe("max_length");
    expect(item_002_max_length.judgment_criteria.max_length).toBe(100);

    const item_003_date_format = result.items.find(
      (item) => item.rule_id === "rule_003"
    );
    expect(item_003_date_format).toBeDefined();
    expect(item_003_date_format.field_id).toBe("field_002");
    expect(item_003_date_format.field_name).toBe("appointment_date");
    expect(item_003_date_format.rule_type).toBe("date_format");
    expect(item_003_date_format.execution_timings).toEqual([
      "on_create",
      "periodic",
    ]);
    expect(item_003_date_format.judgment_criteria.format).toBe("YYYY-MM-DD");

    const item_004_date_range = result.items.find(
      (item) => item.rule_id === "rule_004"
    );
    expect(item_004_date_range).toBeDefined();
    expect(item_004_date_range.rule_type).toBe("date_range");
    expect(item_004_date_range.judgment_criteria.min_date).toBe("2024-01-01");
    expect(item_004_date_range.judgment_criteria.max_date).toBe("2024-12-31");
    expect(item_004_date_range.judgment_criteria.reference_rule).toBe(
      "current_fiscal_year"
    );

    const item_005_numeric_range = result.items.find(
      (item) => item.rule_id === "rule_005"
    );
    expect(item_005_numeric_range).toBeDefined();
    expect(item_005_numeric_range.field_id).toBe("field_003");
    expect(item_005_numeric_range.field_name).toBe("contract_amount");
    expect(item_005_numeric_range.rule_type).toBe("numeric_range");
    expect(item_005_numeric_range.judgment_criteria.min_value).toBe(0);
    expect(item_005_numeric_range.judgment_criteria.max_value).toBe(10000000);
    expect(item_005_numeric_range.judgment_criteria.decimal_places).toBe(2);

    const item_006_not_negative = result.items.find(
      (item) => item.rule_id === "rule_006"
    );
    expect(item_006_not_negative).toBeDefined();
    expect(item_006_not_negative.rule_type).toBe("not_negative");
    expect(item_006_not_negative.execution_timings).toEqual([
      "on_create",
      "on_update",
    ]);

    const item_007_enum = result.items.find(
      (item) => item.rule_id === "rule_007"
    );
    expect(item_007_enum).toBeDefined();
    expect(item_007_enum.field_id).toBe("field_004");
    expect(item_007_enum.field_name).toBe("status");
    expect(item_007_enum.rule_type).toBe("enum_value");
    expect(item_007_enum.judgment_criteria.allowed_values).toEqual([
      "pending",
      "approved",
      "rejected",
    ]);
    expect(item_007_enum.error_keyword).toBe("ステータス");

    expect(result.execution_order).toBeDefined();
    expect(Array.isArray(result.execution_order)).toBe(true);
    expect(result.execution_order.length).toBe(7);

    const on_create_items = result.execution_order.filter(
      (order) => order.timing === "on_create"
    );
    expect(on_create_items.length).toBeGreaterThan(0);
    expect(on_create_items[0].priority).toBeLessThanOrEqual(10);

    const periodic_items = result.execution_order.filter(
      (order) => order.timing === "periodic"
    );
    expect(periodic_items.length).toBeGreaterThan(0);

    expect(result.total_check_count).toBe(7);
    expect(result.required_field_count).toBe(4);
    expect(result.generation_timestamp).toBeDefined();
    expect(result.generation_timestamp).toMatch(
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/
    );

    expect(result.items.every((item) => item.field_id)).toBe(true);
    expect(result.items.every((item) => item.field_name)).toBe(true);
    expect(result.items.every((item) => item.rule_id)).toBe(true);
    expect(result.items.every((item) => item.rule_type)).toBe(true);
    expect(result.items.every((item) => Array.isArray(item.execution_timings)))
      .toBe(true);
    expect(
      result.items.every((item) => item.execution_timings.length > 0)
    ).toBe(true);
    expect(result.items.every((item) => item.judgment_criteria)).toBe(true);
    expect(result.items.every((item) => typeof item.error_keyword === "string"))
      .toBe(true);

    const rule_ids = result.items.map((item) => item.rule_id);
    const unique_rule_ids = new Set(rule_ids);
    expect(unique_rule_ids.size).toBe(rule_ids.length);
  });
});