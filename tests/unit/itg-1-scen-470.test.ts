import { determineMonthlyReportMeetingDate } from "../../src/logic/it-1780551315784-1-2-1";

describe("工程別作業履歴と担当者情報の検索・照合機能", () => {
  test("月次報告会開催日自動決定機能 - 25日ジャストまたは前回報告会から30日ジャストの境界条件で正しく判定する", () => {
    // SCEN-470
    
    // テストデータ: 当月25日と前回報告会から30日後が同一日となる日付条件を設定
    const currentDate = new Date("2024-01-25T09:00:00Z");
    const lastReportDate = new Date("2023-12-26T10:00:00Z"); // 30日前
    const managementSchedule = [
      { date: new Date("2024-02-01T10:00:00Z"), available: true },
      { date: new Date("2024-02-02T10:00:00Z"), available: true }
    ];
    const meetingRoomAvailability = [
      { date: new Date("2024-02-01T10:00:00Z"), roomId: "ROOM001", available: true },
      { date: new Date("2024-02-02T10:00:00Z"), roomId: "ROOM002", available: true }
    ];
    
    // 月次報告会開催日自動決定機能を実行
    const result = determineMonthlyReportMeetingDate(
      currentDate,
      lastReportDate,
      managementSchedule,
      meetingRoomAvailability
    );
    
    // システムが25日ルールと30日間隔ルールの両方に該当する境界条件を正しく認識することを確認
    expect(result.shouldSchedule).toBe(true);
    
    // 優先順位に基づいて適切な判定ロジックが実行されることを確認
    expect(result.notificationRequired).toBe(true);
    
    // 決定された開催日が期待される日付と一致することを検証
    expect(result.meetingDate).toEqual(new Date("2024-02-01T10:00:00Z"));
    expect(result.roomId).toBe("ROOM001");
  });
});