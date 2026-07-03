import { describe, test, expect } from "@jest/globals";
import { validateSalesDataItemMetadata } from "../../src/logic/it-1781935279444-1-1-1";

describe("営業データ項目メタデータ管理 - データ型検証", () => {
  test("SCEN-703: メタデータで指定されたデータ型と異なる型の値が入力された場合に型チェックが失敗する", () => {
    // Arrange: メタデータ定義（データ型=整数）
    const metadata = {
      item_id: "sales_item_001",
      item_name: "アポイント数",
      data_type: "integer",
      unit: "件",
      is_required: true,
      min_value: 0,
      max_value: 999,
      calculation_logic: null,
      report_mapping: "appointment_count",
    };

    // Act & Assert: 文字列型の値「ABC」を入力した場合、型チェックが失敗する
    expect(() =>
      validateSalesDataItemMetadata(metadata, "ABC")
    ).toThrow(/データ型/);

    // Assert: 不正な入力値についても型チェック
    expect(() =>
      validateSalesDataItemMetadata(metadata, "12.5")
    ).toThrow(/データ型/);

    // Assert: 正常な整数値は検証を通す
    const result_valid_integer = validateSalesDataItemMetadata(metadata, 42);
    expect(result_valid_integer).toEqual({
      is_valid: true,
      error_message: null,
      validated_value: 42,
    });

    // Assert: 負の整数も型は正しいため通す（範囲チェックは別処理）
    const result_negative_integer = validateSalesDataItemMetadata(
      metadata,
      -5
    );
    expect(result_negative_integer).toEqual({
      is_valid: true,
      error_message: null,
      validated_value: -5,
    });

    // Assert: null値が入力された場合の処理
    expect(() =>
      validateSalesDataItemMetadata(metadata, null)
    ).toThrow(/データ型/);

    // Assert: 真偽値型の入力
    expect(() =>
      validateSalesDataItemMetadata(metadata, true)
    ).toThrow(/データ型/);

    // Assert: オブジェクト型の入力
    expect(() =>
      validateSalesDataItemMetadata(metadata, {})
    ).toThrow(/データ型/);

    // Assert: 配列型の入力
    expect(() =>
      validateSalesDataItemMetadata(metadata, [1, 2, 3])
    ).toThrow(/データ型/);

    // Assert: 浮動小数点数の入力（整数型ではない）
    expect(() =>
      validateSalesDataItemMetadata(metadata, 3.14)
    ).toThrow(/データ型/);

    // Assert: メタデータのデータ型が「string」の場合、文字列は通す
    const metadata_string = {
      ...metadata,
      data_type: "string",
    };
    const result_string = validateSalesDataItemMetadata(metadata_string, "ABC");
    expect(result_string).toEqual({
      is_valid: true,
      error_message: null,
      validated_value: "ABC",
    });

    // Assert: メタデータのデータ型が「string」の場合、整数は失敗する
    expect(() =>
      validateSalesDataItemMetadata(metadata_string, 123)
    ).toThrow(/データ型/);

    // Assert: メタデータのデータ型が「decimal」の場合、浮動小数点数は通す
    const metadata_decimal = {
      ...metadata,
      data_type: "decimal",
    };
    const result_decimal = validateSalesDataItemMetadata(
      metadata_decimal,
      12.5
    );
    expect(result_decimal).toEqual({
      is_valid: true,
      error_message: null,
      validated_value: 12.5,
    });

    // Assert: 大規模整数（Number.MAX_SAFE_INTEGER の範囲内）
    const large_integer = 9007199254740991;
    const result_large = validateSalesDataItemMetadata(metadata, large_integer);
    expect(result_large).toEqual({
      is_valid: true,
      error_message: null,
      validated_value: large_integer,
    });

    // Assert: 科学記法で表現された整数相当の値
    const scientific_notation = 1e3; // 1000
    const result_scientific = validateSalesDataItemMetadata(
      metadata,
      scientific_notation
    );
    expect(result_scientific).toEqual({
      is_valid: true,
      error_message: null,
      validated_value: 1000,
    });

    // Assert: undefined が入力された場合
    expect(() =>
      validateSalesDataItemMetadata(metadata, undefined)
    ).toThrow(/データ型/);

    // Assert: 空文字列が入力された場合
    expect(() =>
      validateSalesDataItemMetadata(metadata, "")
    ).toThrow(/データ型/);

    // Assert: 空白文字列が入力された場合
    expect(() =>
      validateSalesDataItemMetadata(metadata, "   ")
    ).toThrow(/データ型/);
  });
});