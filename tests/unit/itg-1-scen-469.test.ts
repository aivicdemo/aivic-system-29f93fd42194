import { determineMonthlyReportMeetingDate } from '../../src/logic/it-1780551315784-1-2-1';

describe("工程別作業履歴と担当者情報の検索・照合機能", () => {
  test("月次報告会開催日自動決定機能 - 25日未満で前回報告会から30日未満の場合に開催日決定処理でエラーを返す", () => {
    // SCEN-469
    const currentDate = new Date("2024-02-05T10:00:00Z");
    const lastReportDate = new Date("2024-01-15T15:00:00Z");
    const managementSchedule = [
      { date: new Date("2024-03-01T09:00:00Z"), available: true },
      { date: new Date("2024-03-02T09:00:00Z"), available: true }
    ];
    const meetingRoomAvailability = [
      { date: new Date("2024-03-01T09:00:00Z"), roomId: "ROOM-A", available: true },
      { date: new Date("2024-03-02T09:00:00Z"), roomId: "ROOM-B", available: true }
    ];

    expect(() => determineMonthlyReportMeetingDate(
      currentDate,
      lastReportDate,
      managementSchedule,
      meetingRoomAvailability
    )).toThrow(/報告会/);
  });
});