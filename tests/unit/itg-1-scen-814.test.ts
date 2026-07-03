import { consultationPriorityRouting } from "../../src/logic/it-1-1-1";

describe("営業成果データの自動検証ルール定義と異常検出機能", () => {
  // SCEN-814: 相談内容の優先度ベース自動ルーティング機能
  test("営業責任者が代表への確認が必要と判断した高優先度の相談が自動ルーティングされ、代表に割り当てられ、優先度に応じた対応期限が設定される", () => {
    // Arrange
    const consultation_input = {
      consultation_id: "CONS-2024-001",
      consultant_user_id: "USER-SALES-001",
      consultant_name: "営業責任者太郎",
      consultation_content: "契約金額の変更について代表の確認が必要です",
      is_representative_confirmation_required: true,
      priority_level: "HIGH",
      created_at: new Date("2024-02-15T10:30:00Z"),
      assigned_to_user_id: null,
      notification_sent: false,
      response_deadline: null,
      routing_executed_at: null,
      routing_log_entry: null,
    };

    const representative_user_id = "USER-REPR-001";
    const representative_user_name = "代表田中";
    const high_priority_response_hours = 24;
    const system_timestamp = new Date("2024-02-15T11:00:00Z");

    // Act
    const routing_result = consultationPriorityRouting({
      consultation: consultation_input,
      representative_user_id: representative_user_id,
      representative_user_name: representative_user_name,
      priority_response_hours_map: {
        HIGH: 24,
        MEDIUM: 48,
        LOW: 72,
      },
      current_timestamp: system_timestamp,
    });

    // Assert: ルーティング成功確認
    expect(routing_result.success).toBe(true);

    // Assert: 相談が代表ユーザーに割り当てられたか
    expect(routing_result.assigned_to_user_id).toBe("USER-REPR-001");
    expect(routing_result.assigned_to_user_name).toBe("代表田中");

    // Assert: 通知が送信されたか
    expect(routing_result.notification_sent).toBe(true);
    expect(routing_result.notification_details).toBeDefined();
    expect(routing_result.notification_details.recipient_user_id).toBe(
      "USER-REPR-001"
    );
    expect(routing_result.notification_details.notification_type).toBe(
      "consultation_routed"
    );

    // Assert: 対応期限が設定されたか（高優先度は24時間）
    const expected_deadline = new Date("2024-02-16T11:00:00Z");
    expect(routing_result.response_deadline).toEqual(expected_deadline);

    // Assert: 対応期限が優先度に基づいた適切な期間であるか
    const actual_deadline_hours =
      (routing_result.response_deadline.getTime() -
        system_timestamp.getTime()) /
      (1000 * 60 * 60);
    expect(actual_deadline_hours).toBe(high_priority_response_hours);

    // Assert: ルーティング実行タイムスタンプが記録されたか
    expect(routing_result.routing_executed_at).toEqual(system_timestamp);

    // Assert: ルーティングログエントリが作成されたか
    expect(routing_result.routing_log_entry).toBeDefined();
    expect(routing_result.routing_log_entry.consultation_id).toBe(
      "CONS-2024-001"
    );
    expect(routing_result.routing_log_entry.action_type).toBe(
      "auto_routing_executed"
    );
    expect(routing_result.routing_log_entry.source_user_id).toBe(
      "USER-SALES-001"
    );
    expect(routing_result.routing_log_entry.target_user_id).toBe(
      "USER-REPR-001"
    );
    expect(routing_result.routing_log_entry.priority_applied).toBe("HIGH");
    expect(routing_result.routing_log_entry.assigned_deadline_hours).toBe(24);
    expect(routing_result.routing_log_entry.timestamp).toEqual(system_timestamp);

    // Assert: 相談情報が更新されたか（戻り値の状態確認）
    expect(routing_result.updated_consultation).toBeDefined();
    expect(routing_result.updated_consultation.assigned_to_user_id).toBe(
      "USER-REPR-001"
    );
    expect(routing_result.updated_consultation.response_deadline).toEqual(
      expected_deadline
    );
    expect(routing_result.updated_consultation.routing_executed_at).toEqual(
      system_timestamp
    );

    // Assert: ルーティング対象が代表確認必要フラグ有効かつ高優先度であることを確認
    expect(routing_result.routing_criteria_met).toBe(true);
    expect(
      routing_result.routing_criteria_met &&
        consultation_input.is_representative_confirmation_required &&
        consultation_input.priority_level === "HIGH"
    ).toBe(true);

    // Assert: エラーメッセージがないこと
    expect(routing_result.error_message).toBeUndefined();
  });
});