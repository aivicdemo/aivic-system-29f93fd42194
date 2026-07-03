import { validateAggregationFormula } from "../../src/logic/it-1781935279444-2-2-1";

describe("営業報告書集計自動検証機能 - 異常値検出と通知", () => {
  test("SCEN-1076: 計算式適用結果が異常値である場合に検出・通知される", () => {
    // 前提：営業報告書集計自動検証機能にアクセス可能な状態
    // テストデータ：異常値を含む営業報告書

    // ケース 1: 売上金額が負数の場合
    const negative_revenue_input = {
      revenue: -50000,
      quantity: 10,
      unit_price: 5000,
      timestamp: new Date("2024-01-15T09:30:00Z").toISOString(),
    };

    const negative_result = validateAggregationFormula(negative_revenue_input);

    expect(negative_result.is_valid).toBe(false);
    expect(negative_result.error_type).toBe("negative_revenue");
    expect(negative_result.error_message).toMatch(/売上金額/);
    expect(negative_result.detection_timestamp).toBeDefined();
    expect(negative_result.detected_value).toBe(-50000);
    expect(negative_result.notification_sent).toBe(true);

    // ケース 2: 数量が極端に大きい値の場合
    const extreme_quantity_input = {
      revenue: 500000,
      quantity: 999999999,
      unit_price: 5000,
      timestamp: new Date("2024-01-15T10:00:00Z").toISOString(),
    };

    const extreme_result = validateAggregationFormula(extreme_quantity_input);

    expect(extreme_result.is_valid).toBe(false);
    expect(extreme_result.error_type).toBe("quantity_overflow");
    expect(extreme_result.error_message).toMatch(/数量/);
    expect(extreme_result.detection_timestamp).toBeDefined();
    expect(extreme_result.detected_value).toBe(999999999);
    expect(extreme_result.notification_sent).toBe(true);

    // ケース 3: 計算式適用により NaN が生成される場合
    const nan_input = {
      revenue: 0,
      quantity: 0,
      unit_price: 0,
      timestamp: new Date("2024-01-15T10:30:00Z").toISOString(),
    };

    const nan_result = validateAggregationFormula(nan_input);

    expect(nan_result.is_valid).toBe(false);
    expect(nan_result.error_type).toMatch(/NaN|calculation/);
    expect(nan_result.error_message).toBeDefined();
    expect(nan_result.detection_timestamp).toBeDefined();
    expect(nan_result.notification_sent).toBe(true);

    // ケース 4: 計算式適用により Infinity が生成される場合
    const infinity_input = {
      revenue: Number.MAX_VALUE,
      quantity: 1000000,
      unit_price: Number.MAX_VALUE,
      timestamp: new Date("2024-01-15T11:00:00Z").toISOString(),
    };

    const infinity_result = validateAggregationFormula(infinity_input);

    expect(infinity_result.is_valid).toBe(false);
    expect(infinity_result.error_type).toMatch(/Infinity|overflow/);
    expect(infinity_result.error_message).toBeDefined();
    expect(infinity_result.detection_timestamp).toBeDefined();
    expect(infinity_result.notification_sent).toBe(true);

    // ケース 5: 正常値（境界値：最小正の値）
    const valid_minimal_input = {
      revenue: 0.01,
      quantity: 1,
      unit_price: 0.01,
      timestamp: new Date("2024-01-15T11:30:00Z").toISOString(),
    };

    const valid_minimal_result = validateAggregationFormula(
      valid_minimal_input
    );

    expect(valid_minimal_result.is_valid).toBe(true);
    expect(valid_minimal_result.error_type).toBeNull();
    expect(valid_minimal_result.error_message).toBeNull();
    expect(valid_minimal_result.notification_sent).toBe(false);
    expect(valid_minimal_result.calculated_value).toBeGreaterThan(0);

    // ケース 6: 正常値（通常のケース）
    const valid_normal_input = {
      revenue: 1000000,
      quantity: 100,
      unit_price: 10000,
      timestamp: new Date("2024-01-15T12:00:00Z").toISOString(),
    };

    const valid_normal_result = validateAggregationFormula(valid_normal_input);

    expect(valid_normal_result.is_valid).toBe(true);
    expect(valid_normal_result.error_type).toBeNull();
    expect(valid_normal_result.error_message).toBeNull();
    expect(valid_normal_result.notification_sent).toBe(false);
    expect(valid_normal_result.calculated_value).toBe(1000000);

    // ケース 7: エラー検出ログ記録確認
    expect(negative_result.log_record).toBeDefined();
    expect(negative_result.log_record.error_id).toBeDefined();
    expect(negative_result.log_record.error_id).toMatch(/^ERR_/);
    expect(negative_result.log_record.error_occurred_at).toBeDefined();
    expect(negative_result.log_record.error_location).toMatch(/revenue/);
    expect(negative_result.log_record.error_severity).toBe("high");

    // ケース 8: 管理者ダッシュボード記録確認
    expect(negative_result.admin_dashboard_record).toBeDefined();
    expect(negative_result.admin_dashboard_record.recorded).toBe(true);
    expect(negative_result.admin_dashboard_record.record_timestamp).toBeDefined();
    expect(negative_result.admin_dashboard_record.admin_action_required).toBe(
      true
    );

    // ケース 9: ユーザー通知機能確認
    expect(negative_result.user_notification).toBeDefined();
    expect(negative_result.user_notification.notification_channels).toContain(
      "email"
    );
    expect(negative_result.user_notification.notification_channels).toContain(
      "dashboard"
    );
    expect(
      negative_result.user_notification.notification_channels
    ).toContain("log");
    expect(negative_result.user_notification.email_sent_at).toBeDefined();
  });
});