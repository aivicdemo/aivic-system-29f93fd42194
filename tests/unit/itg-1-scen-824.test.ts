import { validateResponseDataTypes } from "../../src/logic/it-1781935279444-2-2-1";

describe("対応内容の構造化データ保存・ポータル反映機能", () => {
  // SCEN-824: [error] 対応内容の構造化データ保存時にデータ型が不一致の場合にエラーが発生する
  test("should throw error when response data has mismatched types (numeric field receives string, date field has invalid format)", () => {
    const invalidResponseData = {
      response_id: "R001",
      customer_id: "invalid_not_a_number",
      response_time_minutes: "ninety_minutes",
      response_datetime: "2024-13-45T99:99:99Z",
      response_content: "対応内容のテキスト",
      is_portal_reflected: false,
    };

    expect(() => validateResponseDataTypes(invalidResponseData)).toThrow(
      /データ型不一致/
    );
  });

  test("should successfully validate response data when all types are correct", () => {
    const validResponseData = {
      response_id: "R001",
      customer_id: 12345,
      response_time_minutes: 90,
      response_datetime: "2024-01-15T14:30:00Z",
      response_content: "対応内容のテキスト",
      is_portal_reflected: false,
    };

    const result = validateResponseDataTypes(validResponseData);
    expect(result).toEqual({
      is_valid: true,
      errors: [],
      portal_reflected: false,
    });
  });

  test("should throw error when customer_id is string instead of number", () => {
    const invalidCustomerId = {
      response_id: "R002",
      customer_id: "C123456",
      response_time_minutes: 60,
      response_datetime: "2024-01-15T10:00:00Z",
      response_content: "対応内容",
      is_portal_reflected: false,
    };

    expect(() => validateResponseDataTypes(invalidCustomerId)).toThrow(
      /顧客ID/
    );
  });

  test("should throw error when response_time_minutes is non-numeric string", () => {
    const invalidResponseTime = {
      response_id: "R003",
      customer_id: 5678,
      response_time_minutes: "invalid_time",
      response_datetime: "2024-01-15T10:00:00Z",
      response_content: "対応内容",
      is_portal_reflected: false,
    };

    expect(() => validateResponseDataTypes(invalidResponseTime)).toThrow(
      /対応時間/
    );
  });

  test("should throw error when response_datetime has invalid ISO format", () => {
    const invalidDatetime = {
      response_id: "R004",
      customer_id: 9012,
      response_time_minutes: 45,
      response_datetime: "2024/01/15 10:00:00",
      response_content: "対応内容",
      is_portal_reflected: false,
    };

    expect(() => validateResponseDataTypes(invalidDatetime)).toThrow(
      /対応日時/
    );
  });

  test("should throw error when response_datetime has non-existent date values", () => {
    const nonExistentDate = {
      response_id: "R005",
      customer_id: 3456,
      response_time_minutes: 30,
      response_datetime: "2024-02-30T15:45:00Z",
      response_content: "対応内容",
      is_portal_reflected: false,
    };

    expect(() => validateResponseDataTypes(nonExistentDate)).toThrow(
      /対応日時/
    );
  });

  test("should not reflect invalid data to portal when type validation fails", () => {
    const invalidData = {
      response_id: "R006",
      customer_id: "not_numeric",
      response_time_minutes: "abc",
      response_datetime: "invalid_date",
      response_content: "対応内容",
      is_portal_reflected: true,
    };

    expect(() => validateResponseDataTypes(invalidData)).toThrow(
      /データ型不一致/
    );
  });

  test("should return validation result with empty errors array when all numeric and date types are valid", () => {
    const validData = {
      response_id: "R007",
      customer_id: 7890,
      response_time_minutes: 120,
      response_datetime: "2024-12-31T23:59:59Z",
      response_content: "年末対応内容",
      is_portal_reflected: false,
    };

    const result = validateResponseDataTypes(validData);
    expect(result.is_valid).toBe(true);
    expect(result.errors).toEqual([]);
    expect(result.portal_reflected).toBe(false);
  });
});