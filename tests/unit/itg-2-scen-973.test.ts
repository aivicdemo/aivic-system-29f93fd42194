import { determineApprovals } from '../../src/logic/it-6-2-2-1';

describe('応援要請タイミングと規模の決定 (IT-6-2-2-1)', () => {
  test('SCEN-973: 繁忙度ピークまで3日以下の時点で応援要請タイミングが決定された場合、最速手配日が要請開始日として設定される', () => {
    // Arrange: テスト用のモック時刻を設定
    const mockCurrentDate = new Date('2024-01-15T09:00:00Z');
    const peakDate = new Date('2024-01-17T18:00:00Z'); // 現在時刻から2日後

    // 繁忙度ピークまでの日数を計算（3日以下）
    const daysUntilPeak = Math.ceil(
      (peakDate.getTime() - mockCurrentDate.getTime()) / (1000 * 60 * 60 * 24)
    );
    expect(daysUntilPeak).toBeLessThanOrEqual(3);

    // 応援要請タイミング決定ロジックの入力データ
    const staffingInput = {
      current_date: mockCurrentDate,
      peak_date: peakDate,
      required_staff_count: 5,
      available_staff_count: 2,
      forecastCaseCount: 150,
      average_processing_time_minutes: 20,
      current_capacity_cases_per_day: 36,
      earliest_available_date: new Date('2024-01-16T08:00:00Z'), // 最速手配日：明日
    };

    // Act: 応援要請タイミング決定ロジックを実行
    const result = determineApprovals({
      current_date: staffingInput.current_date,
      peak_date: staffingInput.peak_date,
      required_staff_count: staffingInput.required_staff_count,
      available_staff_count: staffingInput.available_staff_count,
      forecast_case_count: staffingInput.forecastCaseCount,
      average_processing_time_minutes: staffingInput.average_processing_time_minutes,
      current_capacity_cases_per_day: staffingInput.current_capacity_cases_per_day,
      earliest_available_date: staffingInput.earliest_available_date,
    });

    // Assert: 要請開始日が最速手配日と一致していることを確認
    expect(result.request_start_date).toEqual(staffingInput.earliest_available_date);

    // 要請開始日が現在時刻から3日以内であることを検証
    const daysFromCurrentToRequestStart = Math.ceil(
      (result.request_start_date.getTime() - mockCurrentDate.getTime()) /
        (1000 * 60 * 60 * 24)
    );
    expect(daysFromCurrentToRequestStart).toBeLessThanOrEqual(3);

    // 要請開始日が繁忙度ピークまでの期間内であることを確認
    expect(result.request_start_date.getTime()).toBeLessThan(peakDate.getTime());

    // 応援要請の状態が「確定」になっていることを確認
    expect(result.status).toBe('確定');

    // 応援要請規模が正しく計算されていることを確認
    const required_additional_staff = staffingInput.required_staff_count - staffingInput.available_staff_count;
    expect(result.additional_staff_required).toBe(required_additional_staff);

    // 応援要請の根拠データが記録されていることを確認
    expect(result.basis_data).toBeDefined();
    expect(result.basis_data.forecast_case_count).toBe(staffingInput.forecastCaseCount);
    expect(result.basis_data.days_until_peak).toBe(daysUntilPeak);
  });
});