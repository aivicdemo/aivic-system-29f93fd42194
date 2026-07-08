import { determineUpdateTriggerPriority } from "../../src/logic/it-6-2-2-1";

describe("学習データ更新トリガー自動判定機能", () => {
  // SCEN-1123
  test("複数トリガーが同時に検知された場合に優先順位を正しく決定できる", () => {
    // 複数トリガー条件を構築
    // 精度低下トリガー: OCR精度が月比-5%以上低下（優先度：高）
    // データ件数閾値超過トリガー: 新規案件データが100件以上追加（優先度：中）
    // スケジュール更新トリガー: 定期物価本更新日に到達（優先度：低）

    const trigger_precision_drop = {
      trigger_type: "precision_drop",
      priority_level: 1,
      precision_current: 65.0,
      precision_previous_month: 72.0,
      threshold_negative_percent: 5.0,
    };

    const trigger_data_count_exceeded = {
      trigger_type: "data_count_exceeded",
      priority_level: 2,
      new_case_count: 150,
      threshold_case_count: 100,
    };

    const trigger_scheduled_update = {
      trigger_type: "scheduled_update",
      priority_level: 3,
      update_scheduled_date: "2024-06-01",
      current_date: "2024-06-01",
    };

    // トリガーを同時に検知した状態
    const detected_triggers = [
      trigger_precision_drop,
      trigger_data_count_exceeded,
      trigger_scheduled_update,
    ];

    // トリガー判定ロジック実行
    const result = determineUpdateTriggerPriority({
      triggers: detected_triggers,
      priority_rule: {
        precision_drop: 1,
        data_count_exceeded: 2,
        scheduled_update: 3,
      },
    });

    // 最優先トリガーが正しく決定されたことを検証
    expect(result.top_priority_trigger_type).toBe("precision_drop");
    expect(result.top_priority_level).toBe(1);

    // 処理順序がシステム仕様の優先順位ルールに従っていることを確認
    expect(result.execution_order).toEqual([
      "precision_drop",
      "data_count_exceeded",
      "scheduled_update",
    ]);

    // 各トリガーの優先度レベルが正しく記録されたことを検証
    expect(result.triggers_with_priority).toEqual([
      {
        trigger_type: "precision_drop",
        priority_level: 1,
      },
      {
        trigger_type: "data_count_exceeded",
        priority_level: 2,
      },
      {
        trigger_type: "scheduled_update",
        priority_level: 3,
      },
    ]);

    // 最優先トリガーに基づいた更新処理実行フラグが true であることを検証
    expect(result.should_execute_update).toBe(true);

    // 更新処理の実行対象が最優先トリガーに基づいていることを検証
    expect(result.update_target_trigger).toBe("precision_drop");

    // ログレコードに最優先トリガーの詳細が記録されていることを検証
    expect(result.execution_log).toEqual({
      timestamp: expect.any(String),
      triggered_at: expect.any(String),
      top_priority_trigger: "precision_drop",
      top_priority_level: 1,
      total_triggers_detected: 3,
      execution_sequence: ["precision_drop", "data_count_exceeded", "scheduled_update"],
      update_execution_status: "triggered",
    });

    // 精度低下トリガーの詳細条件が正しく判定されたことを検証
    expect(result.trigger_details.precision_drop).toEqual({
      current_precision: 65.0,
      previous_precision: 72.0,
      drop_rate_percent: 7.0,
      threshold_drop_percent: 5.0,
      is_threshold_exceeded: true,
    });

    // データ件数超過トリガーの詳細条件が正しく判定されたことを検証
    expect(result.trigger_details.data_count_exceeded).toEqual({
      new_case_count: 150,
      threshold_count: 100,
      exceeded_count: 50,
      is_threshold_exceeded: true,
    });

    // スケジュール更新トリガーの詳細条件が正しく判定されたことを検証
    expect(result.trigger_details.scheduled_update).toEqual({
      scheduled_date: "2024-06-01",
      current_date: "2024-06-01",
      is_scheduled_date_reached: true,
    });
  });
});