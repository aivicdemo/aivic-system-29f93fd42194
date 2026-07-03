import { describe, test, expect } from "@jest/globals";
import { calculateVerificationDeadline } from "../../src/logic/it-1-1-1";

describe("営業成果データの自動検証ルール定義と異常検出機能", () => {
  test("SCEN-866: 契約変更検証期限自動計算機能 - 営業カレンダーの休場日が除外される", () => {
    // 営業カレンダー: 2024-01-13(土), 2024-01-14(日), 2024-01-15(祝), 2024-01-22(臨時休場)
    const businessCalendar = [
      { date: "2024-01-13", isBusinessDay: false, reason: "Saturday" },
      { date: "2024-01-14", isBusinessDay: false, reason: "Sunday" },
      { date: "2024-01-15", isBusinessDay: false, reason: "Holiday" },
      { date: "2024-01-22", isBusinessDay: false, reason: "TemporaryClosure" },
    ];

    // 契約変更情報
    const contractChangeData = {
      contractChangeId: "CC-2024-001",
      changeType: "PlanChange",
      changeContent: "プラン変更",
      verificationStartDate: "2024-01-12", // 金曜日（営業日）
      standardVerificationDays: 5, // 標準検証期間: 5営業日
    };

    // 期待される検証期限: 2024-01-12から5営業日後
    // 2024-01-12(金) -> 2024-01-16(火) -> 2024-01-17(水) -> 2024-01-18(木) -> 2024-01-19(金) -> 2024-01-23(火)
    // ※ 1/13(土), 1/14(日), 1/15(祝), 1/22(臨時休場)をスキップ
    const expectedDeadlineDate = "2024-01-23";

    const result = calculateVerificationDeadline({
      startDate: contractChangeData.verificationStartDate,
      businessDays: contractChangeData.standardVerificationDays,
      businessCalendar: businessCalendar,
    });

    // 検証期限が正確に計算されていることを確認
    expect(result.deadlineDate).toBe(expectedDeadlineDate);

    // 営業日カウントが正確であることを確認
    expect(result.businessDayCount).toBe(5);

    // スキップされた休場日が記録されていることを確認
    expect(result.skippedNonBusinessDays).toContain("2024-01-13");
    expect(result.skippedNonBusinessDays).toContain("2024-01-14");
    expect(result.skippedNonBusinessDays).toContain("2024-01-15");
    expect(result.skippedNonBusinessDays).toContain("2024-01-22");
    expect(result.skippedNonBusinessDays.length).toBe(4);

    // 実際の経過日数が営業日数よりも多いことを確認
    // 2024-01-12から2024-01-23までは11日間だが、営業日は5日
    expect(result.totalCalendarDays).toBe(11);
    expect(result.businessDayCount).toBe(5);
    expect(result.totalCalendarDays).toBeGreaterThan(
      result.businessDayCount
    );

    // 計算ロジックの妥当性: 経過日数 = 営業日数 + 休場日数
    expect(result.totalCalendarDays).toBe(
      result.businessDayCount + result.skippedNonBusinessDays.length
    );
  });
});