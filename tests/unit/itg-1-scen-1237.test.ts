import { determineContractChangeTaskPriority, executeTaskQueueByPriority } from "../../src/logic/it-1781935279444-2-1-1";

describe("複数契約変更優先順位自動判定とキュー処理の精密実行", () => {
  test("SCEN-1237: 複数変更の優先順位判定完了直後、1ms以内にキュー処理が正確に開始され、判定順序通りにタスク実行される", () => {
    // ========== 前提条件: 複数契約変更タスク同時登録 ==========
    const task_high_priority = {
      task_id: "CT-001",
      contract_id: "CUST-A-2024-001",
      change_type: "billing_rule_update",
      impact_amount: 250000,
      registration_timestamp: new Date("2024-02-15T10:00:00.000Z").getTime(),
      is_registered: true,
    };

    const task_medium_priority = {
      task_id: "CT-002",
      contract_id: "CUST-B-2024-002",
      change_type: "service_addition",
      impact_amount: 80000,
      registration_timestamp: new Date("2024-02-15T10:00:00.100Z").getTime(),
      is_registered: true,
    };

    const task_low_priority = {
      task_id: "CT-003",
      contract_id: "CUST-C-2024-003",
      change_type: "contract_extension",
      impact_amount: 15000,
      registration_timestamp: new Date("2024-02-15T10:00:00.200Z").getTime(),
      is_registered: true,
    };

    const task_same_priority_a = {
      task_id: "CT-004",
      contract_id: "CUST-D-2024-004",
      change_type: "discount_application",
      impact_amount: 80000,
      registration_timestamp: new Date("2024-02-15T10:00:00.050Z").getTime(),
      is_registered: true,
    };

    const task_same_priority_b = {
      task_id: "CT-005",
      contract_id: "CUST-E-2024-005",
      change_type: "discount_application",
      impact_amount: 80000,
      registration_timestamp: new Date("2024-02-15T10:00:00.060Z").getTime(),
      is_registered: true,
    };

    const input_tasks = [task_high_priority, task_medium_priority, task_low_priority, task_same_priority_a, task_same_priority_b];

    // ========== アクション1: 優先順位自動判定機能を実行し、判定完了時刻を記録 ==========
    const priority_judgment_timestamp_before = Date.now();
    const priority_result = determineContractChangeTaskPriority(input_tasks);
    const priority_judgment_timestamp_after = Date.now();

    // ========== 期待結果1: 優先順位判定完了 ==========
    expect(priority_result).toBeDefined();
    expect(priority_result.judged_task_count).toBe(5);
    expect(priority_result.priority_order).toEqual(["CT-001", "CT-004", "CT-005", "CT-002", "CT-003"]);
    expect(priority_result.priority_mapping).toEqual({
      "CT-001": { priority_level: 1, impact_amount: 250000, ranking_reason: "highest_impact" },
      "CT-004": { priority_level: 2, impact_amount: 80000, ranking_reason: "same_priority_by_registration_order" },
      "CT-005": { priority_level: 2, impact_amount: 80000, ranking_reason: "same_priority_by_registration_order" },
      "CT-002": { priority_level: 3, impact_amount: 80000, ranking_reason: "medium_impact" },
      "CT-003": { priority_level: 4, impact_amount: 15000, ranking_reason: "lowest_impact" },
    });

    // ========== 期待結果2: 判定完了時刻の精度検証（ナノ秒単位の差分） ==========
    const judgment_latency_ms = priority_judgment_timestamp_after - priority_judgment_timestamp_before;
    expect(judgment_latency_ms).toBeLessThan(100);
    expect(priority_result.judgment_completed_at_iso).toBeDefined();
    const judgment_date = new Date(priority_result.judgment_completed_at_iso);
    expect(judgment_date.getTime()).toBeGreaterThanOrEqual(priority_judgment_timestamp_before);
    expect(judgment_date.getTime()).toBeLessThanOrEqual(priority_judgment_timestamp_after);

    // ========== アクション2: キュー処理を実行し、開始時刻を記録 ==========
    const queue_execution_timestamp_before = Date.now();
    const queue_result = executeTaskQueueByPriority({
      priority_order: priority_result.priority_order,
      priority_mapping: priority_result.priority_mapping,
      tasks_to_queue: input_tasks,
      queue_start_trigger_timestamp_iso: priority_result.judgment_completed_at_iso,
    });
    const queue_execution_timestamp_after = Date.now();

    // ========== 期待結果3: キュー処理が判定完了後1ms以内に開始 ==========
    const queue_start_latency_ms = new Date(queue_result.queue_started_at_iso).getTime() - judgment_date.getTime();
    expect(queue_start_latency_ms).toBeLessThanOrEqual(1);
    expect(queue_start_latency_ms).toBeGreaterThanOrEqual(0);

    // ========== 期待結果4: キュー内のタスク順序が判定された優先順位と一致 ==========
    expect(queue_result.queued_task_order).toEqual(["CT-001", "CT-004", "CT-005", "CT-002", "CT-003"]);
    expect(queue_result.queue_length).toBe(5);

    // ========== 期待結果5: キュー内の各タスクの状態が正確に記録 ==========
    expect(queue_result.queued_task_details).toEqual([
      {
        queue_position: 1,
        task_id: "CT-001",
        priority_level: 1,
        task_state: "queued",
        enqueue_timestamp_iso: queue_result.queue_started_at_iso,
      },
      {
        queue_position: 2,
        task_id: "CT-004",
        priority_level: 2,
        task_state: "queued",
        enqueue_timestamp_iso: queue_result.queue_started_at_iso,
      },
      {
        queue_position: 3,
        task_id: "CT-005",
        priority_level: 2,
        task_state: "queued",
        enqueue_timestamp_iso: queue_result.queue_started_at_iso,
      },
      {
        queue_position: 4,
        task_id: "CT-002",
        priority_level: 3,
        task_state: "queued",
        enqueue_timestamp_iso: queue_result.queue_started_at_iso,
      },
      {
        queue_position: 5,
        task_id: "CT-003",
        priority_level: 4,
        task_state: "queued",
        enqueue_timestamp_iso: queue_result.queue_started_at_iso,
      },
    ]);

    // ========== 期待結果6: 実行ログがタイムスタンプ、優先順位、タスク順序すべて矛盾なく記録 ==========
    expect(queue_result.execution_log_entries).toBeDefined();
    expect(queue_result.execution_log_entries.length).toBeGreaterThanOrEqual(5);

    const log_judgment_event = queue_result.execution_log_entries.find((entry) => entry.event_type === "priority_judgment_completed");
    expect(log_judgment_event).toBeDefined();
    expect(log_judgment_event?.event_timestamp_iso).toEqual(priority_result.judgment_completed_at_iso);
    expect(log_judgment_event?.event_detail).toEqual({ priority_count: 5, high_priority_task_id: "CT-001" });

    const log_queue_start_event = queue_result.execution_log_entries.find((entry) => entry.event_type === "queue_processing_started");
    expect(log_queue_start_event).toBeDefined();
    expect(log_queue_start_event?.event_timestamp_iso).toEqual(queue_result.queue_started_at_iso);
    expect(log_queue_start_event?.event_detail).toEqual({ queued_task_count: 5, first_task_id: "CT-001" });

    // ========== 期待結果7: 同一優先度タスクの処理順序が決定的ルール（登録時刻順）に従う ==========
    const same_priority_tasks_in_queue = queue_result.queued_task_details.filter((detail) => detail.priority_level === 2);
    expect(same_priority_tasks_in_queue.length).toBe(2);
    expect(same_priority_tasks_in_queue[0].task_id).toBe("CT-004");
    expect(same_priority_tasks_in_queue[1].task_id).toBe("CT-005");

    // CT-004 登録時刻: 2024-02-15T10:00:00.050Z
    // CT-005 登録時刻: 2024-02-15T10:00:00.060Z
    // CT-004 のほうが先に登録されたので CT-004 が先に処理される
    expect(task_same_priority_a.registration_timestamp).toBeLessThan(task_same_priority_b.registration_timestamp);
    expect(same_priority_tasks_in_queue[0].task_id).toBe("CT-004");
    expect(same_priority_tasks_in_queue[1].task_id).toBe("CT-005");

    // ========== 期待結果8: レース条件・競合状態がないことを確認（キュー内タスク順序の一貫性） ==========
    const task_order_consistency_checks = queue_result.queued_task_order.map((task_id, index) => ({
      task_id,
      queue_position: index + 1,
      priority_level: queue_result.queued_task_details[index].priority_level,
    }));

    for (let i = 0; i < task_order_consistency_checks.length - 1; i++) {
      const current_task = task_order_consistency_checks[i];
      const next_task = task_order_consistency_checks[i + 1];

      // 優先度が低下していく（または同一優先度で登録時刻順）
      if (current_task.priority_level < next_task.priority_level) {
        // OK: 優先度が正しく低下している
        expect(true).toBe(true);
      } else if (current_task.priority_level === next_task.priority_level) {
        // OK: 同一優先度の場合は登録時刻順に従う
        const current_input_task = input_tasks.find((t) => t.task_id === current_task.task_id);
        const next_input_task = input_tasks.find((t) => t.task_id === next_task.task_id);
        if (current_input_task && next_input_task) {
          expect(current_input_task.registration_timestamp).toBeLessThanOrEqual(next_input_task.registration_timestamp);
        }
      } else {
        throw new Error(`Task order violation: ${current_task.task_id} (priority ${current_task.priority_level}) followed by ${next_task.task_id} (priority ${next_task.priority_level})`);
      }
    }

    // ========== 期待結果9: 全体タイムスタンプの整合性確認 ==========
    expect(queue_result.queue_processing_completed_at_iso).toBeDefined();
    const completion_time = new Date(queue_result.queue_processing_completed_at_iso).getTime();
    const queue_start_time = new Date(queue_result.queue_started_at_iso).getTime();
    expect(completion_time).toBeGreaterThanOrEqual(queue_start_time);

    // ========== 期待結果10: 統計情報の正確性 ==========
    expect(queue_result.statistics).toEqual({
      total_tasks_judged: 5,
      total_tasks_queued: 5,
      priority_level_distribution: {
        "1": 1,
        "2": 2,
        "3": 1,
        "4": 1,
      },
      latency_from_judgment_to_queue_start_ms: queue_start_latency_ms,
      queue_processing_duration_ms: completion_time - queue_start_time,
      has_race_condition_detected: false,
      all_timestamps_consistent: true,
    });
  });
});