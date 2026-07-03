import { calculateInquirySLA } from "../../src/logic/it-1781935279444-2-2-1";

describe("営業日ベースの問い合わせSLA管理", () => {
  // SCEN-1187: 問い合わせ受領から検証結果回答までが営業日ベースで1営業日以内に完了する
  test("月曜09:00受領の問い合わせ検証が火曜営業時間内に完了し、SLA要件を満たす", () => {
    // テストデータ: 月曜日（祝日でない）09:00に問い合わせを受領
    const inquiry = {
      inquiryId: "INQ-20250120-001",
      customerId: "CUST-0001",
      customerName: "テスト顧客A",
      inquiryContent: "請求額計算ロジックの妥当性確認",
      receivedAt: new Date("2025-01-20T09:00:00+09:00"), // 月曜日 09:00
      receivedDateStr: "2025-01-20",
      receivedDayOfWeek: 1, // Monday
      isHoliday: false,
    };

    // 問い合わせ管理システムに登録後、初期検証処理を実行
    const verificationResult = {
      inquiryId: inquiry.inquiryId,
      verificationStartedAt: new Date(
        "2025-01-20T09:30:00+09:00"
      ),
      verificationCompletedAt: new Date("2025-01-21T14:00:00+09:00"), // 火曜日 14:00
      completedDateStr: "2025-01-21",
      completedDayOfWeek: 2, // Tuesday
      verificationStatus: "completed",
      responseReadyAt: new Date("2025-01-21T14:00:00+09:00"),
    };

    // 営業日カレンダー定義（月～金が営業日、09:00～18:00が営業時間）
    const businessDayCalendar = {
      businessDays: [1, 2, 3, 4, 5], // Mon-Fri
      businessHoursStart: 9,
      businessHoursEnd: 18,
      holidays: [] as string[],
    };

    // SLA計算処理を実行
    const slaResult = calculateInquirySLA({
      inquiryReceivedAt: inquiry.receivedAt,
      verificationCompletedAt: verificationResult.verificationCompletedAt,
      businessDayCalendar: businessDayCalendar,
      slaThresholdBusinessDays: 1, // SLA閾値: 1営業日以内
    });

    // 期待結果の検証
    // 1. 問い合わせ受領日時が月曜日09:00に登録されていること
    expect(inquiry.receivedDateStr).toBe("2025-01-20");
    expect(inquiry.receivedDayOfWeek).toBe(1);
    expect(inquiry.isHoliday).toBe(false);

    // 2. 検証完了日時が火曜日の営業時間内（14:00）に設定されていること
    expect(verificationResult.completedDateStr).toBe("2025-01-21");
    expect(verificationResult.completedDayOfWeek).toBe(2);
    expect(verificationResult.verificationCompletedAt.getHours()).toBe(14);
    expect(verificationResult.verificationCompletedAt.getHours()).toBeGreaterThanOrEqual(
      businessDayCalendar.businessHoursStart
    );
    expect(verificationResult.verificationCompletedAt.getHours()).toBeLessThan(
      businessDayCalendar.businessHoursEnd
    );

    // 3. SLA計算結果が1営業日以内に完了したことを示すこと
    expect(slaResult.slaCompliant).toBe(true);
    expect(slaResult.elapsedBusinessDays).toBe(1);

    // 4. 回答可能時刻が営業時間内であること
    expect(slaResult.responseReadyWithinBusinessHours).toBe(true);

    // 5. 実際の経過営業日数が閾値以下であること
    expect(slaResult.elapsedBusinessDays).toBeLessThanOrEqual(
      businessDayCalendar.businessDays.length > 0 ? 1 : 0
    );

    // 6. システムログが記録され、全処理タイムスタンプが営業日カレンダー基準で管理されていること
    expect(slaResult.systemLog).toBeDefined();
    expect(slaResult.systemLog.receivedTimestamp).toEqual(
      inquiry.receivedAt.toISOString()
    );
    expect(slaResult.systemLog.verificationCompletedTimestamp).toEqual(
      verificationResult.verificationCompletedAt.toISOString()
    );
    expect(slaResult.systemLog.slaEvaluationCompleted).toBe(true);

    // 7. 回答が翌営業日の営業時間内に完了していること
    const receivedDayIndex = inquiry.receivedDayOfWeek;
    const completedDayIndex = verificationResult.completedDayOfWeek;
    const daysDifference = completedDayIndex - receivedDayIndex;
    expect(daysDifference).toBe(1); // 1日後
    expect(verificationResult.verificationCompletedAt.getHours()).toBeGreaterThanOrEqual(
      9
    );
    expect(verificationResult.verificationCompletedAt.getHours()).toBeLessThan(18);

    // 8. SLA要件「営業日ベースで1営業日以内」を満たしていること
    expect(slaResult.meetsRequirement).toBe(true);
    expect(slaResult.slaStatus).toBe("compliant");
  });
});