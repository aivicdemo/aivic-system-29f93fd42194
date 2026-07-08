import { describe, test, expect } from "@jest/globals";
import {
  calculateOcrReadingErrorCorrectionSlaStatus,
} from "../../src/logic/it-6-2-2-2";

describe("査定員別の判定精度・乖離パターン分析ダッシュボード", () => {
  test("SCEN-1438: 読取誤り修正SLA可視化機能 - いずれかの修正段階がSLA超過した場合にダッシュボードに警告表示される", () => {
    // 基本的なテストシナリオ: 複数の修正段階があり、いずれかがSLA超過
    const current_time = new Date("2024-06-15T14:30:00Z");
    const error_detection_time = new Date("2024-06-15T10:00:00Z");
    const initial_correction_completed_time = new Date(
      "2024-06-16T12:00:00Z"
    );
    const recorrection_requested_time = new Date("2024-06-16T13:00:00Z");
    const recorrection_completed_time = null; // 再修正未完了

    const initial_correction_sla_hours = 24;
    const recorrection_sla_hours = 48;

    // 検出から初期修正完了までの経過時間（時間）
    const initial_correction_elapsed_hours =
      (initial_correction_completed_time.getTime() -
        error_detection_time.getTime()) /
      (1000 * 60 * 60);

    // 再修正要望から現在までの経過時間（時間）
    const recorrection_elapsed_hours =
      (current_time.getTime() - recorrection_requested_time.getTime()) /
      (1000 * 60 * 60);

    // 初期修正SLA判定: 26時間経過 > 24時間SLA → SLA超過
    const initial_correction_sla_exceeded =
      initial_correction_elapsed_hours > initial_correction_sla_hours;

    // 再修正SLA判定: 25.5時間経過 < 48時間SLA → SLA未超過
    const recorrection_sla_exceeded =
      recorrection_completed_time !== null
        ? (recorrection_completed_time.getTime() -
            recorrection_requested_time.getTime()) /
            (1000 * 60 * 60) > recorrection_sla_hours
        : recorrection_elapsed_hours > recorrection_sla_hours;

    // 関数実行
    const result = calculateOcrReadingErrorCorrectionSlaStatus({
      current_time,
      error_detection_time,
      initial_correction_completed_time,
      recorrection_requested_time,
      recorrection_completed_time,
      initial_correction_sla_hours,
      recorrection_sla_hours,
    });

    // 期待値: 初期修正SLA超過、再修正SLA未超過のため、警告が表示される
    expect(result).toEqual({
      has_sla_violation: true,
      sla_violations: [
        {
          stage_name: "initial_correction",
          sla_hours: 24,
          elapsed_hours: expect.any(Number),
          is_exceeded: true,
          alert_level: "high",
          alert_color: "red",
          alert_icon: "warning",
          display_message:
            "初期修正段階がSLA超過しています（24時間以内）",
        },
        {
          stage_name: "recorrection",
          sla_hours: 48,
          elapsed_hours: expect.any(Number),
          is_exceeded: false,
          alert_level: "none",
          alert_color: "green",
          alert_icon: "check",
          display_message: "再修正はSLA内です",
        },
      ],
      dashboard_display: {
        show_alert: true,
        alert_position: "top",
        alert_visibility: "high_contrast",
        num_violations: 1,
        clickable_detail_available: true,
      },
    });

    // 具体的な検証
    expect(result.has_sla_violation).toBe(true);
    expect(result.sla_violations.length).toBe(2);

    // 初期修正段階の警告確認
    const initial_correction_violation = result.sla_violations.find(
      (v) => v.stage_name === "initial_correction"
    );
    expect(initial_correction_violation).toBeDefined();
    expect(initial_correction_violation?.is_exceeded).toBe(true);
    expect(initial_correction_violation?.alert_level).toBe("high");
    expect(initial_correction_violation?.alert_color).toBe("red");
    expect(initial_correction_violation?.alert_icon).toBe("warning");

    // 再修正段階は超過していないことを確認
    const recorrection_violation = result.sla_violations.find(
      (v) => v.stage_name === "recorrection"
    );
    expect(recorrection_violation).toBeDefined();
    expect(recorrection_violation?.is_exceeded).toBe(false);
    expect(recorrection_violation?.alert_level).toBe("none");
    expect(recorrection_violation?.alert_color).toBe("green");

    // ダッシュボード表示設定を確認
    expect(result.dashboard_display.show_alert).toBe(true);
    expect(result.dashboard_display.alert_position).toBe("top");
    expect(result.dashboard_display.alert_visibility).toBe("high_contrast");
    expect(result.dashboard_display.num_violations).toBe(1);
    expect(result.dashboard_display.clickable_detail_available).toBe(true);

    // 複数段階SLA超過ケース: 初期修正と再修正の両方がSLA超過
    const current_time_both_exceeded = new Date("2024-06-18T15:00:00Z");
    const error_detection_time_2 = new Date("2024-06-15T10:00:00Z");
    const initial_correction_completed_time_2 = new Date(
      "2024-06-16T12:00:00Z"
    );
    const recorrection_requested_time_2 = new Date("2024-06-16T13:00:00Z");
    const recorrection_completed_time_2 = new Date("2024-06-19T14:00:00Z");

    const result_both_exceeded =
      calculateOcrReadingErrorCorrectionSlaStatus({
        current_time: current_time_both_exceeded,
        error_detection_time: error_detection_time_2,
        initial_correction_completed_time: initial_correction_completed_time_2,
        recorrection_requested_time: recorrection_requested_time_2,
        recorrection_completed_time: recorrection_completed_time_2,
        initial_correction_sla_hours: 24,
        recorrection_sla_hours: 48,
      });

    expect(result_both_exceeded.has_sla_violation).toBe(true);

    // 両段階ともSLA超過の場合、警告が複数表示される
    const all_violations = result_both_exceeded.sla_violations.filter(
      (v) => v.is_exceeded
    );
    expect(all_violations.length).toBeGreaterThanOrEqual(2);

    // すべての超過段階に警告表示が設定されている
    all_violations.forEach((violation) => {
      expect(violation.alert_level).toBe("high");
      expect(violation.alert_color).toBe("red");
      expect(violation.alert_icon).toBe("warning");
    });

    expect(result_both_exceeded.dashboard_display.show_alert).toBe(true);
    expect(result_both_exceeded.dashboard_display.num_violations).toBeGreaterThanOrEqual(
      2
    );

    // SLA超過なしのケース: すべてのステージが期限内
    const current_time_no_violation = new Date("2024-06-15T20:00:00Z");
    const error_detection_time_3 = new Date("2024-06-15T10:00:00Z");
    const initial_correction_completed_time_3 = new Date(
      "2024-06-15T20:00:00Z"
    );
    const recorrection_requested_time_3 = new Date("2024-06-15T21:00:00Z");
    const recorrection_completed_time_3 = new Date("2024-06-16T10:00:00Z");

    const result_no_violation = calculateOcrReadingErrorCorrectionSlaStatus({
      current_time: current_time_no_violation,
      error_detection_time: error_detection_time_3,
      initial_correction_completed_time: initial_correction_completed_time_3,
      recorrection_requested_time: recorrection_requested_time_3,
      recorrection_completed_time: recorrection_completed_time_3,
      initial_correction_sla_hours: 24,
      recorrection_sla_hours: 48,
    });

    expect(result_no_violation.has_sla_violation).toBe(false);
    expect(result_no_violation.dashboard_display.show_alert).toBe(false);
    expect(result_no_violation.dashboard_display.num_violations).toBe(0);

    // エラーケース: 不正なSLA時間設定
    expect(() =>
      calculateOcrReadingErrorCorrectionSlaStatus({
        current_time,
        error_detection_time,
        initial_correction_completed_time,
        recorrection_requested_time,
        recorrection_completed_time,
        initial_correction_sla_hours: -24,
        recorrection_sla_hours: 48,
      })
    ).toThrow(/SLA設定/);

    // エラーケース: タイムスタンプの論理矛盾
    expect(() =>
      calculateOcrReadingErrorCorrectionSlaStatus({
        current_time: new Date("2024-06-15T09:00:00Z"),
        error_detection_time: new Date("2024-06-15T10:00:00Z"),
        initial_correction_completed_time,
        recorrection_requested_time,
        recorrection_completed_time,
        initial_correction_sla_hours: 24,
        recorrection_sla_hours: 48,
      })
    ).toThrow(/時刻順序/);
  });
});