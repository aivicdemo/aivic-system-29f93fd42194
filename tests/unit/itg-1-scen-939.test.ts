import { describe, test, expect, beforeEach, afterEach } from "@jest/globals";
import { validateMonthlyScheduleDeadline } from "../../src/logic/it-1-1-1";

describe("営業成果データの自動検証ルール定義と異常検出機能", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // SCEN-939: [edge] 月次業務スケジュール管理・期限通知機能 - 期限日時が正確に0分単位で設定される
  test("should set and maintain monthly schedule deadline with exact minute precision and zero seconds", () => {
    // 入力: 期限日時を「2024年1月15日 14時30分00秒」に設定
    const input_deadline_iso = "2024-01-15T14:30:00Z";
    const input_deadline_datetime = new Date(input_deadline_iso);

    // 第1回目: 設定値を保存し検証
    const result_first = validateMonthlyScheduleDeadline({
      scheduled_deadline_utc: input_deadline_datetime,
      task_id: "monthly_close_001",
      notification_type: "deadline_minute_precision",
    });

    // 期待結果: 期限日時が正確に保持されている（秒は00秒、分は指定通り30分）
    expect(result_first.is_valid).toBe(true);
    expect(result_first.deadline_utc_iso).toBe("2024-01-15T14:30:00Z");
    expect(result_first.minute_precision_verified).toBe(true);
    expect(result_first.seconds_value).toBe(0);
    expect(result_first.minutes_value).toBe(30);
    expect(result_first.hours_value).toBe(14);

    // 第2回目: 異なる時刻で設定・保存・確認（14時45分00秒）
    const input_deadline_iso_second = "2024-01-15T14:45:00Z";
    const input_deadline_datetime_second = new Date(input_deadline_iso_second);

    const result_second = validateMonthlyScheduleDeadline({
      scheduled_deadline_utc: input_deadline_datetime_second,
      task_id: "monthly_close_002",
      notification_type: "deadline_minute_precision",
    });

    expect(result_second.is_valid).toBe(true);
    expect(result_second.deadline_utc_iso).toBe("2024-01-15T14:45:00Z");
    expect(result_second.minute_precision_verified).toBe(true);
    expect(result_second.seconds_value).toBe(0);
    expect(result_second.minutes_value).toBe(45);

    // 第3回目: 別の日付で検証（2024年1月22日 09時00分00秒）
    const input_deadline_iso_third = "2024-01-22T09:00:00Z";
    const input_deadline_datetime_third = new Date(input_deadline_iso_third);

    const result_third = validateMonthlyScheduleDeadline({
      scheduled_deadline_utc: input_deadline_datetime_third,
      task_id: "monthly_close_003",
      notification_type: "deadline_minute_precision",
    });

    expect(result_third.is_valid).toBe(true);
    expect(result_third.deadline_utc_iso).toBe("2024-01-22T09:00:00Z");
    expect(result_third.minute_precision_verified).toBe(true);
    expect(result_third.seconds_value).toBe(0);
    expect(result_third.minutes_value).toBe(0);
    expect(result_third.hours_value).toBe(9);

    // 境界値テスト: 秒が00秒以外の場合はエラー（秒単位のズレ検出）
    const input_deadline_with_seconds = new Date("2024-01-15T14:30:45Z");
    const result_with_seconds_error = validateMonthlyScheduleDeadline({
      scheduled_deadline_utc: input_deadline_with_seconds,
      task_id: "monthly_close_004",
      notification_type: "deadline_minute_precision",
    });

    expect(result_with_seconds_error.is_valid).toBe(false);
    expect(result_with_seconds_error.minute_precision_verified).toBe(false);

    // エラーテスト: 秒単位のズレ検出
    expect(() =>
      validateMonthlyScheduleDeadline({
        scheduled_deadline_utc: new Date("2024-01-15T14:30:45Z"),
        task_id: "monthly_close_005",
        notification_type: "deadline_minute_precision",
      })
    ).toThrow(/秒単位のズレ/);

    // 通知ログタイムスタンプの一貫性検証
    const result_timestamp_check = validateMonthlyScheduleDeadline({
      scheduled_deadline_utc: input_deadline_datetime,
      task_id: "monthly_close_006",
      notification_type: "deadline_minute_precision",
    });

    // 通知ログに記録されるタイムスタンプが正確か検証
    expect(result_timestamp_check.notification_log_timestamp).toBe(
      "2024-01-15T14:30:00Z"
    );
    expect(result_timestamp_check.database_stored_datetime).toBe(
      "2024-01-15T14:30:00Z"
    );
    expect(result_timestamp_check.ui_display_value).toBe("2024-01-15 14:30");

    // 複数回の設定内容が一貫性を保っているか検証
    const all_results = [result_first, result_second, result_third];
    all_results.forEach((result) => {
      expect(result.is_valid).toBe(true);
      expect(result.minute_precision_verified).toBe(true);
      expect(result.seconds_value).toBe(0);
      expect(
        result.deadline_utc_iso.match(/.*T.*:.*:00Z$/)
      ).not.toBeNull();
    });

    // 丸め誤差がないことを確認
    expect(result_first.rounding_error_detected).toBe(false);
    expect(result_second.rounding_error_detected).toBe(false);
    expect(result_third.rounding_error_detected).toBe(false);
  });
});