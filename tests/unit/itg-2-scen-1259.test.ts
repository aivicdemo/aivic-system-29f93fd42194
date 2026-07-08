import { describe, test, expect, beforeEach, afterEach } from "@jest/globals";
import {
  calculateBusinessDaysElapsed,
  checkImplementationDelayWarning,
  generateDelayNotification,
  recordNotificationHistory,
} from "../../src/logic/it-6-2-2-1";

describe("改善提案実装完了期間の営業日ベース管理機能", () => {
  test("SCEN-1259: 改善提案実装期間が5営業日超過時に遅延警告と部署長通知が正常に機能する", () => {
    // === Setup: 改善提案と日付情報を準備 ===
    const improvement_proposal_id = "IMP-2024-001";
    const department_head_id = "EMP-HEAD-001";

    // 開始日: 2024-01-08 (月) - 改善提案承認日
    const start_date = new Date("2024-01-08T09:00:00Z");

    // === Phase 1: 実装期間が5営業日に達する前の状態を確認 ===
    // 実装開始から4営業日経過時点: 2024-01-12 (金)
    const check_date_before_deadline = new Date("2024-01-12T17:00:00Z");

    const business_days_before = calculateBusinessDaysElapsed(
      start_date,
      check_date_before_deadline
    );
    // 期待: 1/8(月), 1/9(火), 1/10(水), 1/11(木), 1/12(金) = 5営業日
    // ただしこれは期間内なので遅延ではない
    expect(business_days_before).toBe(5);

    // 4営業日経過状態でも実装が完了していない場合の検証
    const warning_before_deadline = checkImplementationDelayWarning(
      improvement_proposal_id,
      start_date,
      check_date_before_deadline,
      false // 実装完了フラグ: false
    );
    expect(warning_before_deadline.has_delay_warning).toBe(false);
    expect(warning_before_deadline.excess_business_days).toBe(0);

    // === Phase 2: 実装期間を6営業日経過させる（5営業日超過） ===
    // 実装開始から6営業日経過時点: 2024-01-15 (月)
    // 1/8(月), 1/9(火), 1/10(水), 1/11(木), 1/12(金), 1/15(月) = 6営業日
    const check_date_after_deadline = new Date("2024-01-15T09:00:00Z");

    const business_days_after = calculateBusinessDaysElapsed(
      start_date,
      check_date_after_deadline
    );
    expect(business_days_after).toBe(6);

    // === Phase 3: 実装期間超過時の遅延警告生成を確認 ===
    const warning_after_deadline = checkImplementationDelayWarning(
      improvement_proposal_id,
      start_date,
      check_date_after_deadline,
      false // 実装完了フラグ: false
    );
    expect(warning_after_deadline.has_delay_warning).toBe(true);
    expect(warning_after_deadline.excess_business_days).toBe(1); // 6 - 5 = 1営業日超過
    expect(warning_after_deadline.improvement_proposal_id).toBe(
      "IMP-2024-001"
    );
    expect(warning_after_deadline.warning_message).toMatch(/遅延/);

    // === Phase 4: 部署長への通知ロジック実行を検証 ===
    const notification_payload = generateDelayNotification(
      improvement_proposal_id,
      department_head_id,
      business_days_after,
      1, // 超過営業日数
      new Date("2024-01-15T09:30:00Z") // 通知生成時刻
    );

    expect(notification_payload.improvement_proposal_id).toBe(
      "IMP-2024-001"
    );
    expect(notification_payload.recipient_department_head_id).toBe(
      "EMP-HEAD-001"
    );
    expect(notification_payload.total_business_days_elapsed).toBe(6);
    expect(notification_payload.excess_business_days).toBe(1);

    // === Phase 5: 通知内容が正しい情報を含んでいることを確認 ===
    expect(notification_payload.notification_content).toMatch(
      /IMP-2024-001/
    );
    expect(notification_payload.notification_content).toMatch(/1営業日/);
    expect(notification_payload.notification_content).toMatch(/超過/);

    // === Phase 6: 部署長の通知受信履歴に記録が生成されることを検証 ===
    const notification_history = recordNotificationHistory(
      improvement_proposal_id,
      department_head_id,
      "DELAY_WARNING",
      notification_payload.notification_content,
      new Date("2024-01-15T09:30:00Z")
    );

    expect(notification_history.improvement_proposal_id).toBe(
      "IMP-2024-001"
    );
    expect(notification_history.recipient_id).toBe("EMP-HEAD-001");
    expect(notification_history.notification_type).toBe("DELAY_WARNING");
    expect(notification_history.message_body).toMatch(/超過/);
    expect(notification_history.notification_timestamp).toEqual(
      new Date("2024-01-15T09:30:00Z")
    );
    expect(notification_history.is_recorded).toBe(true);

    // === Phase 7: 継続的な遅延監視状態を確認 ===
    // さらに5営業日経過した状態: 2024-01-22 (月)
    // 1/8(月), 1/9(火), 1/10(水), 1/11(木), 1/12(金), 1/15(月), 1/16(火), 1/17(水), 1/18(木), 1/19(金), 1/22(月) = 11営業日
    const check_date_extended = new Date("2024-01-22T17:00:00Z");

    const business_days_extended = calculateBusinessDaysElapsed(
      start_date,
      check_date_extended
    );
    expect(business_days_extended).toBe(11);

    const warning_extended = checkImplementationDelayWarning(
      improvement_proposal_id,
      start_date,
      check_date_extended,
      false // 実装完了フラグ: false
    );
    expect(warning_extended.has_delay_warning).toBe(true);
    expect(warning_extended.excess_business_days).toBe(6); // 11 - 5 = 6営業日超過
    expect(warning_extended.warning_message).toMatch(/遅延/);

    // === Phase 8: 実装完了後は遅延警告が終了することを確認 ===
    const check_date_completed = new Date("2024-01-16T14:00:00Z");

    const warning_completed = checkImplementationDelayWarning(
      improvement_proposal_id,
      start_date,
      check_date_completed,
      true // 実装完了フラグ: true
    );
    expect(warning_completed.has_delay_warning).toBe(false);
    expect(warning_completed.implementation_completed).toBe(true);
  });
});