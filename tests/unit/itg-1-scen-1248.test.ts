import { determineContractChangeReminderNotification } from "../../src/logic/it-1781935279444-2-1-1";

describe("営業データ入力時の品質検証ルール定義・実行機能", () => {
  // SCEN-1248: [edge] 契約変更確認催促通知機能 - 顧客合意受領から確認処理開始までの時間が設定値と正確に一致する境界値で催促通知の判定が正しく動作する
  test("should correctly determine reminder notification at boundary values", () => {
    const threshold_hours = 72;
    const threshold_ms = threshold_hours * 60 * 60 * 1000;

    // Base timestamp: 顧客合意受領のタイムスタンプ
    const agreement_received_timestamp = new Date("2024-01-15T09:00:00Z");

    // ケース1: 設定値ちょうど（72時間）
    const exactly_72_hours = new Date(
      agreement_received_timestamp.getTime() + threshold_ms
    );
    const result_exactly_72 = determineContractChangeReminderNotification({
      agreement_received_timestamp,
      confirmation_start_timestamp: exactly_72_hours,
      threshold_hours,
    });
    expect(result_exactly_72.should_send_reminder).toBe(true);
    expect(result_exactly_72.elapsed_ms).toBe(threshold_ms);
    expect(result_exactly_72.status).toBe("reminder_sent");
    expect(result_exactly_72.notification_timestamp).toEqual(exactly_72_hours);

    // ケース2: 設定値より1秒少ない（71時間59分59秒）
    const one_second_less = new Date(
      agreement_received_timestamp.getTime() + threshold_ms - 1000
    );
    const result_one_second_less = determineContractChangeReminderNotification({
      agreement_received_timestamp,
      confirmation_start_timestamp: one_second_less,
      threshold_hours,
    });
    expect(result_one_second_less.should_send_reminder).toBe(false);
    expect(result_one_second_less.elapsed_ms).toBe(threshold_ms - 1000);
    expect(result_one_second_less.status).toBe("no_reminder_needed");

    // ケース3: 設定値より1秒多い（72時間0分1秒）
    const one_second_more = new Date(
      agreement_received_timestamp.getTime() + threshold_ms + 1000
    );
    const result_one_second_more = determineContractChangeReminderNotification({
      agreement_received_timestamp,
      confirmation_start_timestamp: one_second_more,
      threshold_hours,
    });
    expect(result_one_second_more.should_send_reminder).toBe(true);
    expect(result_one_second_more.elapsed_ms).toBe(threshold_ms + 1000);
    expect(result_one_second_more.status).toBe("reminder_sent");
    expect(result_one_second_more.notification_timestamp).toEqual(
      one_second_more
    );

    // 各ケースのタイムスタンプとステータスが正しく記録されていることを検証
    expect(result_exactly_72.recorded_at).toBeDefined();
    expect(result_one_second_less.recorded_at).toBeDefined();
    expect(result_one_second_more.recorded_at).toBeDefined();

    // 催促通知履歴の記録確認
    expect(result_exactly_72.history_entry).toEqual({
      agreement_received: agreement_received_timestamp,
      confirmation_started: exactly_72_hours,
      elapsed_hours: 72,
      reminder_sent: true,
      created_at: result_exactly_72.recorded_at,
    });

    expect(result_one_second_less.history_entry).toEqual({
      agreement_received: agreement_received_timestamp,
      confirmation_started: one_second_less,
      elapsed_hours: expect.closeTo(71.9997, 4),
      reminder_sent: false,
      created_at: result_one_second_less.recorded_at,
    });

    expect(result_one_second_more.history_entry).toEqual({
      agreement_received: agreement_received_timestamp,
      confirmation_started: one_second_more,
      elapsed_hours: expect.closeTo(72.0003, 4),
      reminder_sent: true,
      created_at: result_one_second_more.recorded_at,
    });
  });
});