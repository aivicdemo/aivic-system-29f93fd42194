import { generateReminderNotificationForUnconfirmedGuidelines } from "../../src/logic/it-6-2-2-2";

describe("査定員別の判定精度・乖離パターン分析ダッシュボード", () => {
  test("SCEN-1572: 受領確認がタイムアウト期間内に取得されない場合に督促通知が自動生成される", () => {
    // テストデータ: ガイドライン配信記録
    const guideline_distribution_id = "guid_dist_20240115_001";
    const user_id = "assessor_user_123";
    const user_name = "査定員太郎";
    const user_email = "assessor.taro@company.com";
    const guideline_id = "guideline_v2_20240101";
    const guideline_title = "見積査定ガイドライン第2版";

    // システム設定: 受領確認タイムアウト期間 = 7日間
    const timeout_days = 7;
    const distribution_datetime = new Date("2024-01-08T09:00:00Z");
    const timeout_period_ms = timeout_days * 24 * 60 * 60 * 1000;

    // 配信日時 + タイムアウト期間を経過した日時
    const current_datetime = new Date(distribution_datetime.getTime() + timeout_period_ms + 1000);
    const expected_reminder_generated_datetime = current_datetime;

    // テストデータセット: 配信済みだが受領確認がないガイドライン
    const unconfirmed_guideline = {
      guideline_distribution_id,
      user_id,
      user_name,
      user_email,
      guideline_id,
      guideline_title,
      distribution_datetime: distribution_datetime.toISOString(),
      confirmation_datetime: null as string | null,
      timeout_days,
    };

    // 実行: タイムアウト期間経過後、自動督促通知生成ジョブを実行
    const reminder_notification = generateReminderNotificationForUnconfirmedGuidelines(
      unconfirmed_guideline,
      current_datetime
    );

    // 検証1: 督促通知が正常に生成されたこと
    expect(reminder_notification).toBeDefined();
    expect(reminder_notification).not.toBeNull();

    // 検証2: 督促通知に必須フィールドが含まれていること
    expect(reminder_notification.reminder_notification_id).toBeDefined();
    expect(reminder_notification.reminder_notification_id.length).toBeGreaterThan(0);

    // 検証3: 対象ユーザー情報が正しく含まれていること
    expect(reminder_notification.target_user_id).toBe(user_id);
    expect(reminder_notification.target_user_name).toBe(user_name);
    expect(reminder_notification.target_user_email).toBe(user_email);

    // 検証4: ガイドライン情報が正しく含まれていること
    expect(reminder_notification.guideline_distribution_id).toBe(guideline_distribution_id);
    expect(reminder_notification.guideline_id).toBe(guideline_id);
    expect(reminder_notification.guideline_title).toBe(guideline_title);

    // 検証5: 生成日時がタイムアウト期間経過後の正確な時刻であること
    const reminder_generated_datetime = new Date(reminder_notification.generated_datetime);
    expect(reminder_generated_datetime.getTime()).toBe(expected_reminder_generated_datetime.getTime());

    // 検証6: 配信日時とタイムアウト期間が記録されていること
    expect(reminder_notification.original_distribution_datetime).toBe(distribution_datetime.toISOString());
    expect(reminder_notification.timeout_days).toBe(timeout_days);

    // 検証7: 督促通知のステータスが「未送信」であること
    expect(reminder_notification.status).toBe("pending");

    // 検証8: 重複生成防止チェック - 同一ガイドラインに対して2回目の督促を生成しないこと
    const duplicate_attempt = generateReminderNotificationForUnconfirmedGuidelines(
      unconfirmed_guideline,
      current_datetime
    );

    // 2回目の生成は重複と判定され、エラーまたは null が返されることを期待
    expect(
      () =>
        generateReminderNotificationForUnconfirmedGuidelines({
          ...unconfirmed_guideline,
          reminder_already_sent: true,
        }, current_datetime)
    ).toThrow(/重複/);

    // 検証9: 通知内容に「受領確認を促す」メッセージが含まれていること
    expect(reminder_notification.notification_content).toContain("受領確認");
    expect(reminder_notification.notification_content).toContain("ガイドライン");

    // 検証10: タイムアウト期間未経過の場合は督促通知が生成されないこと
    const within_timeout_datetime = new Date(distribution_datetime.getTime() + timeout_period_ms - 1000);
    const no_reminder = generateReminderNotificationForUnconfirmedGuidelines(
      unconfirmed_guideline,
      within_timeout_datetime
    );
    expect(no_reminder).toBeNull();

    // 検証11: 既に受領確認がある場合は督促通知が生成されないこと
    const confirmed_guideline = {
      ...unconfirmed_guideline,
      confirmation_datetime: new Date("2024-01-10T10:00:00Z").toISOString(),
    };
    const no_reminder_confirmed = generateReminderNotificationForUnconfirmedGuidelines(
      confirmed_guideline,
      current_datetime
    );
    expect(no_reminder_confirmed).toBeNull();

    // 検証12: 通知優先度が適切に設定されていること
    expect(reminder_notification.priority).toBe("high");
  });
});