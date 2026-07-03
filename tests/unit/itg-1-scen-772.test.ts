import { validateSalesDataFilters } from "../../src/logic/it-1781935279444-2-2-1";

describe("資料検索フィルタリング機能 - フィルタリング条件が無効な場合のエラーハンドリング", () => {
  test("SCEN-772: 無効なフィルタリング条件でエラーが発生し、適切なエラーメッセージが返される", () => {
    // 正常なフィルタリング条件（ハッピーパス）
    const valid_filters = {
      customer_id: "CUST-001",
      service_type: "営業支援",
      start_date: "2024-01-15",
      end_date: "2024-01-31",
      status: "active",
    };

    const valid_result = validateSalesDataFilters(valid_filters);
    expect(valid_result).toEqual({
      is_valid: true,
      errors: [],
      filtered_count: 0,
    });

    // 無効な日付形式（不正な形式の日付）
    const invalid_date_format = {
      customer_id: "CUST-002",
      service_type: "営業支援",
      start_date: "2024/01/15",
      end_date: "2024/01/31",
      status: "active",
    };

    expect(() => validateSalesDataFilters(invalid_date_format)).toThrow(
      /日付形式/
    );

    // 存在しないフィールド名を含む条件
    const invalid_field_name = {
      customer_id: "CUST-003",
      invalid_field: "invalid_value",
      start_date: "2024-01-15",
      end_date: "2024-01-31",
    };

    expect(() => validateSalesDataFilters(invalid_field_name)).toThrow(
      /フィールド/
    );

    // 型が不正な値（数値が必要な箇所に文字列）
    const invalid_type_value = {
      customer_id: 12345,
      service_type: "営業支援",
      start_date: "2024-01-15",
      end_date: "2024-01-31",
      status: "active",
    };

    expect(() => validateSalesDataFilters(invalid_type_value)).toThrow(
      /型/
    );

    // 日付の論理的矛盾（開始日 > 終了日）
    const invalid_date_logic = {
      customer_id: "CUST-004",
      service_type: "営業支援",
      start_date: "2024-01-31",
      end_date: "2024-01-15",
      status: "active",
    };

    expect(() => validateSalesDataFilters(invalid_date_logic)).toThrow(
      /日付範囲/
    );

    // 無効なステータス値
    const invalid_status = {
      customer_id: "CUST-005",
      service_type: "営業支援",
      start_date: "2024-01-15",
      end_date: "2024-01-31",
      status: "invalid_status_value",
    };

    expect(() => validateSalesDataFilters(invalid_status)).toThrow(/ステータス/);

    // 必須フィールドが欠落している場合
    const missing_required_field = {
      customer_id: "CUST-006",
      service_type: "営業支援",
      end_date: "2024-01-31",
      status: "active",
    };

    expect(() => validateSalesDataFilters(missing_required_field)).toThrow(
      /必須項目/
    );

    // 空文字列が含まれている場合
    const empty_string_field = {
      customer_id: "",
      service_type: "営業支援",
      start_date: "2024-01-15",
      end_date: "2024-01-31",
      status: "active",
    };

    expect(() => validateSalesDataFilters(empty_string_field)).toThrow(
      /空値/
    );

    // エラー後、システムが安定した状態に戻ることを確認（別の有効な入力で処理が続行可能）
    const recovery_filters = {
      customer_id: "CUST-007",
      service_type: "提案資料作成",
      start_date: "2024-02-01",
      end_date: "2024-02-28",
      status: "active",
    };

    const recovery_result = validateSalesDataFilters(recovery_filters);
    expect(recovery_result.is_valid).toBe(true);
    expect(recovery_result.errors.length).toBe(0);
  });
});