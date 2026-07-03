import { describe, test, expect } from "@jest/globals";
import { validateSalesActivityContactDateTime } from "../../src/logic/it-1781935279444-2-1-1";

describe("営業データ入力時の品質検証ルール定義・実行機能", () => {
  test("SCEN-692: 接触日時が無効な日付形式の場合に形式誤りが検出される", () => {
    // 無効な日付形式: 月が13
    const invalid_contact_datetime_1 = "2024-13-45";
    expect(() => validateSalesActivityContactDateTime(invalid_contact_datetime_1)).toThrow(/接触日時/);

    // 無効な日付形式: 日が32
    const invalid_contact_datetime_2 = "2024/15/32";
    expect(() => validateSalesActivityContactDateTime(invalid_contact_datetime_2)).toThrow(/接触日時/);

    // 無効な日付形式: 完全に不正な文字列
    const invalid_contact_datetime_3 = "invalid-date";
    expect(() => validateSalesActivityContactDateTime(invalid_contact_datetime_3)).toThrow(/接触日時/);

    // 有効な日付形式: YYYY-MM-DD HH:MM:SS
    const valid_contact_datetime = "2024-01-15 14:30:00";
    const result_valid = validateSalesActivityContactDateTime(valid_contact_datetime);
    expect(result_valid).toEqual({
      is_valid: true,
      formatted_datetime: "2024-01-15 14:30:00",
      error_message: null,
    });

    // 有効な日付形式: ISO 8601
    const valid_iso_datetime = "2024-01-15T14:30:00Z";
    const result_iso = validateSalesActivityContactDateTime(valid_iso_datetime);
    expect(result_iso).toEqual({
      is_valid: true,
      formatted_datetime: "2024-01-15T14:30:00Z",
      error_message: null,
    });

    // 境界値: 月が00（無効）
    const boundary_invalid_month = "2024-00-15 10:00:00";
    expect(() => validateSalesActivityContactDateTime(boundary_invalid_month)).toThrow(/接触日時/);

    // 境界値: 有効な月末日 2024-01-31
    const boundary_valid_last_day = "2024-01-31 23:59:59";
    const result_boundary = validateSalesActivityContactDateTime(boundary_valid_last_day);
    expect(result_boundary).toEqual({
      is_valid: true,
      formatted_datetime: "2024-01-31 23:59:59",
      error_message: null,
    });

    // 時刻部分が無効: 時が25
    const invalid_hour = "2024-01-15 25:00:00";
    expect(() => validateSalesActivityContactDateTime(invalid_hour)).toThrow(/接触日時/);

    // 時刻部分が無効: 分が60
    const invalid_minute = "2024-01-15 14:60:00";
    expect(() => validateSalesActivityContactDateTime(invalid_minute)).toThrow(/接触日時/);

    // 時刻部分が無効: 秒が60
    const invalid_second = "2024-01-15 14:30:60";
    expect(() => validateSalesActivityContactDateTime(invalid_second)).toThrow(/接触日時/);
  });
});