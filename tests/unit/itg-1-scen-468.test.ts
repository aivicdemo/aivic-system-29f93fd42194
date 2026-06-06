import { determineMonthlyReportMeetingDate } from '../../src/logic/it-1780551315784-1-2-1';

describe('工程別作業履歴と担当者情報の検索・照合機能', () => {
  test('25日以降に翌月第1-2営業日で報告会開催日を正常に決定する', () => {
    // SCEN-468
    const currentDate = new Date('2024-01-25T10:00:00Z');
    const lastReportDate = null;
    const managementSchedule = [
      { date: new Date('2024-02-01T10:00:00Z'), available: true },
      { date: new Date('2024-02-02T10:00:00Z'), available: true }
    ];
    const meetingRoomAvailability = [
      { date: new Date('2024-02-01T10:00:00Z'), roomId: 'room-001', available: true },
      { date: new Date('2024-02-02T10:00:00Z'), roomId: 'room-002', available: true }
    ];

    const result = determineMonthlyReportMeetingDate(
      currentDate,
      lastReportDate,
      managementSchedule,
      meetingRoomAvailability
    );

    expect(result.meetingDate).toEqual(new Date('2024-02-01T10:00:00Z'));
    expect(result.roomId).toBe('room-001');
    expect(result.shouldSchedule).toBe(true);
    expect(result.notificationRequired).toBe(true);
  });
});