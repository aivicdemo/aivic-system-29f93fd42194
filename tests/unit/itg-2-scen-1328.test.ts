import { describe, test, expect, beforeEach } from "@jest/globals";
import {
  determineMonthlyReportSchedule,
} from "../../src/logic/it-1-br-2-2-2-1";

describe("月次レポートスケジュール自動決定機能", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // SCEN-1328
  test("経営企画からレポート作成指示発行時に既存スケジュールとの競合を検出し、優先度に基づいて再調整される", () => {
    // 既存スケジュール3件を登録（優先度：低、中、高）
    const existing_schedules = [
      {
        schedule_id: "SCH-001",
        report_name: "月次査定実績レポート",
        priority_level: "low",
        scheduled_start_time: "2024-02-01T09:00:00Z",
        scheduled_end_time: "2024-02-01T11:00:00Z",
        status: "scheduled",
      },
      {
        schedule_id: "SCH-002",
        report_name: "査定品質分析レポート",
        priority_level: "medium",
        scheduled_start_time: "2024-02-01T11:00:00Z",
        scheduled_end_time: "2024-02-01T13:00:00Z",
        status: "scheduled",
      },
      {
        schedule_id: "SCH-003",
        report_name: "ROI実績レポート",
        priority_level: "high",
        scheduled_start_time: "2024-02-01T13:00:00Z",
        scheduled_end_time: "2024-02-01T15:00:00Z",
        status: "scheduled",
      },
    ];

    // 経営企画からの新規レポート作成指示（優先度：最高）
    const new_instruction = {
      instruction_id: "INST-NEW-001",
      report_type: "ROI_TRIAL_CALCULATION",
      priority_level: "highest",
      requested_start_time: "2024-02-01T09:00:00Z",
      requested_completion_deadline: "2024-02-05T17:00:00Z",
      requested_by: "management_planning",
      instruction_timestamp: "2024-01-31T14:30:00Z",
    };

    // システムが既存スケジュールとの競合検出・再調整を実行
    const result = determineMonthlyReportSchedule(
      existing_schedules,
      new_instruction
    );

    // 期待結果の検証
    // 1. 競合検出: 新規指示（最高優先度）と既存スケジュール（優先度：低）の競合が検出される
    expect(result.conflict_detected).toBe(true);
    expect(result.conflicting_schedules).toContain("SCH-001");

    // 2. 優先度に基づいた再調整: 優先度順序が正しく並び替えられる
    expect(result.adjusted_schedules).toHaveLength(4);

    // 最高優先度の新規指示が最初に配置
    expect(result.adjusted_schedules[0]).toEqual({
      schedule_id: "INST-NEW-001",
      report_name: "ROI_TRIAL_CALCULATION",
      priority_level: "highest",
      scheduled_start_time: "2024-02-01T09:00:00Z",
      scheduled_end_time: "2024-02-01T11:00:00Z",
      status: "scheduled",
    });

    // 高優先度スケジュールが次に配置
    expect(result.adjusted_schedules[1]).toEqual({
      schedule_id: "SCH-003",
      report_name: "ROI実績レポート",
      priority_level: "high",
      scheduled_start_time: "2024-02-01T11:00:00Z",
      scheduled_end_time: "2024-02-01T13:00:00Z",
      status: "scheduled",
    });

    // 中優先度スケジュールが次に配置
    expect(result.adjusted_schedules[2]).toEqual({
      schedule_id: "SCH-002",
      report_name: "査定品質分析レポート",
      priority_level: "medium",
      scheduled_start_time: "2024-02-01T13:00:00Z",
      scheduled_end_time: "2024-02-01T15:00:00Z",
      status: "scheduled",
    });

    // 低優先度スケジュールは後続の実行枠へ移動
    expect(result.adjusted_schedules[3]).toEqual({
      schedule_id: "SCH-001",
      report_name: "月次査定実績レポート",
      priority_level: "low",
      scheduled_start_time: "2024-02-01T15:00:00Z",
      scheduled_end_time: "2024-02-01T17:00:00Z",
      status: "scheduled",
    });

    // 3. 新規指示が最高優先度として割り当てられる
    expect(result.new_instruction_assignment).toEqual({
      schedule_id: "INST-NEW-001",
      priority_assigned: "highest",
      execution_order: 1,
    });

    // 4. 全ての変更がシステムに永続化される
    expect(result.persistence_status).toBe("persisted");
    expect(result.persistence_timestamp).toBe("2024-01-31T14:30:00Z");

    // 5. システムログに競合検出と再調整処理の履歴が記録される
    expect(result.audit_log).toHaveLength(3);

    expect(result.audit_log[0]).toEqual({
      log_id: expect.any(String),
      event_type: "conflict_detection",
      detected_conflicts: ["SCH-001"],
      conflict_count: 1,
      timestamp: "2024-01-31T14:30:00Z",
    });

    expect(result.audit_log[1]).toEqual({
      log_id: expect.any(String),
      event_type: "schedule_reassignment",
      reassigned_schedule_ids: ["SCH-001", "SCH-002", "SCH-003"],
      reassignment_reason: "priority_reordering",
      timestamp: "2024-01-31T14:30:00Z",
    });

    expect(result.audit_log[2]).toEqual({
      log_id: expect.any(String),
      event_type: "new_instruction_registered",
      instruction_id: "INST-NEW-001",
      assigned_priority: "highest",
      assigned_execution_order: 1,
      timestamp: "2024-01-31T14:30:00Z",
    });

    // 6. 全スケジュール（新規含む）の優先度順序が正しく並び替えられたことを確認
    const priority_order = {
      highest: 0,
      high: 1,
      medium: 2,
      low: 3,
    };

    for (let i = 0; i < result.adjusted_schedules.length - 1; i++) {
      const current_priority =
        priority_order[
          result.adjusted_schedules[i]
            .priority_level as keyof typeof priority_order
        ];
      const next_priority =
        priority_order[
          result.adjusted_schedules[i + 1]
            .priority_level as keyof typeof priority_order
        ];
      expect(current_priority).toBeLessThanOrEqual(next_priority);
    }

    // 7. 調整前後の時間枠割り当てが正しく実行される
    expect(result.time_slot_allocation).toEqual({
      total_time_slots: 4,
      slot_duration_hours: 2,
      available_time_window: "2024-02-01T09:00:00Z to 2024-02-01T17:00:00Z",
    });

    // 8. 返却結果に必須フィールドがすべて含まれる
    expect(result).toHaveProperty("conflict_detected");
    expect(result).toHaveProperty("conflicting_schedules");
    expect(result).toHaveProperty("adjusted_schedules");
    expect(result).toHaveProperty("new_instruction_assignment");
    expect(result).toHaveProperty("persistence_status");
    expect(result).toHaveProperty("persistence_timestamp");
    expect(result).toHaveProperty("audit_log");
    expect(result).toHaveProperty("time_slot_allocation");
  });
});