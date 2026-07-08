import { describe, test, expect, beforeEach } from "@jest/globals";
import {
  calculateImprovementCycleDaysElapsed,
  flagImprovementCycleOverdue,
} from "../../src/logic/it-1-br-2-2-2-1";

describe("乖離パターン分析・改善サイクル自動化機能", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // SCEN-1523
  test("改善サイクル完了期限（30日）を越える場合に警告フラグが立てられる", () => {
    // Arrange: 改善サイクル開始日を現在日時から30日以上前に設定
    const current_date = new Date("2024-06-15T10:00:00Z");
    const improvement_cycle_start_date = new Date("2024-05-14T10:00:00Z"); // 32日前
    const days_elapsed = 32;
    const max_cycle_days = 30;

    const divergence_pattern_record = {
      divergence_pattern_id: "dp_001",
      improvement_cycle_start_date,
      improvement_cycle_status: "in_progress",
      is_overdue_warned: false,
      warning_message: "",
    };

    // Act: 経過日数を計算
    const calculated_days_elapsed = calculateImprovementCycleDaysElapsed({
      current_date,
      improvement_cycle_start_date,
    });

    // Assert: 経過日数が30日を超えていることを確認
    expect(calculated_days_elapsed).toBe(days_elapsed);

    // Act: 警告フラグの状態を検証
    const flagged_record = flagImprovementCycleOverdue({
      record: divergence_pattern_record,
      days_elapsed: calculated_days_elapsed,
      max_cycle_days,
    });

    // Assert: 警告フラグが立てられ、メッセージが表示されることを確認
    expect(flagged_record.is_overdue_warned).toBe(true);
    expect(flagged_record.warning_message).toMatch(
      /改善サイクル完了期限超過|期限超過/
    );
    expect(flagged_record.improvement_cycle_status).toBe("overdue");
  });
});