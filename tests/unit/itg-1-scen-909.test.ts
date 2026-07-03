import { recordMonthlyExceptionCase } from "../../src/logic/it-1781935279444-2-2-1";

describe("月次業務例外ケース記録機能 - 例外内容バリデーション", () => {
  // SCEN-909
  test("例外内容が空文字列またはnullの場合、バリデーションエラーを返す", () => {
    // ハッピーパス: 正常な例外ケース記録
    const validInput = {
      exception_content: "営業データの金額が予想範囲を超過した",
      occurred_date: new Date("2024-01-15T11:00:00Z"),
      handling_classification: "data_correction",
      priority_level: "high",
      recorded_by: "user_001",
    };

    const validResult = recordMonthlyExceptionCase(validInput);
    expect(validResult).toEqual({
      success: true,
      record_id: expect.any(String),
      recorded_timestamp: expect.any(Date),
      validation_status: "passed",
    });

    // エラーケース1: 例外内容が空文字列
    const emptyStringInput = {
      exception_content: "",
      occurred_date: new Date("2024-01-15T11:00:00Z"),
      handling_classification: "data_correction",
      priority_level: "high",
      recorded_by: "user_001",
    };

    expect(() => recordMonthlyExceptionCase(emptyStringInput)).toThrow(
      /例外内容/
    );

    // エラーケース2: 例外内容がnull
    const nullInput = {
      exception_content: null,
      occurred_date: new Date("2024-01-15T11:00:00Z"),
      handling_classification: "data_correction",
      priority_level: "high",
      recorded_by: "user_001",
    };

    expect(() => recordMonthlyExceptionCase(nullInput)).toThrow(
      /例外内容/
    );

    // エラーケース3: 例外内容がundefined
    const undefinedInput = {
      exception_content: undefined,
      occurred_date: new Date("2024-01-15T11:00:00Z"),
      handling_classification: "data_correction",
      priority_level: "high",
      recorded_by: "user_001",
    };

    expect(() => recordMonthlyExceptionCase(undefinedInput)).toThrow(
      /例外内容/
    );

    // エラーケース4: 例外内容が空白のみ
    const whitespaceInput = {
      exception_content: "   ",
      occurred_date: new Date("2024-01-15T11:00:00Z"),
      handling_classification: "data_correction",
      priority_level: "high",
      recorded_by: "user_001",
    };

    expect(() => recordMonthlyExceptionCase(whitespaceInput)).toThrow(
      /例外内容/
    );

    // 成功ケース: 最小限の有効な例外内容
    const minimalValidInput = {
      exception_content: "A",
      occurred_date: new Date("2024-01-15T11:00:00Z"),
      handling_classification: "data_correction",
      priority_level: "medium",
      recorded_by: "user_002",
    };

    const minimalResult = recordMonthlyExceptionCase(minimalValidInput);
    expect(minimalResult.success).toBe(true);
    expect(minimalResult.validation_status).toBe("passed");
  });
});