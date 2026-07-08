import { calculateCompletionDateWithBusinessDays } from "../../src/logic/it-6-2-2-1";

describe("改善提案実装完了期間の営業日ベース管理機能", () => {
  // SCEN-1260: [edge] 改善提案実装完了期間の営業日ベース管理機能 - 土日祝日を除いた営業日ベースで正確に5営業日カウントされる
  test("開始日から5営業日後の日付を正確に計算し、土日祝日を除外した完了予定日を返す", () => {
    // 準備: 2024年11月11日（月）を開始日とする改善提案データを作成
    // 計算対象期間: 2024-11-11(月) 開始
    // 2024-11-11(月), 2024-11-12(火), 2024-11-13(水), 2024-11-14(木), 2024-11-15(金) = 5営業日
    // 次の週: 2024-11-16(土), 2024-11-17(日) = 非営業日
    // その後: 2024-11-18(月), 2024-11-19(火) = 営業日
    // 期待される完了予定日: 2024-11-15(金) (5営業日後)
    
    const start_date = "2024-11-11"; // 月曜日
    const business_days_count = 5;
    const japanese_holidays = ["2024-11-23"]; // 勤労感謝の日（土曜日だが念のため含める）

    const result = calculateCompletionDateWithBusinessDays({
      start_date,
      business_days_count,
      japanese_holidays,
    });

    // 検証1: 戻り値が正しい構造を持つことを確認
    expect(result).toHaveProperty("completion_date");
    expect(result).toHaveProperty("business_days_counted");
    expect(result).toHaveProperty("excluded_weekend_days");
    expect(result).toHaveProperty("excluded_holiday_days");

    // 検証2: ビジネスルール「営業日が正確に5日分カウントされていること」を検証
    expect(result.business_days_counted).toBe(5);

    // 検証3: 計算対象期間の土曜日・日曜日が正確にカウントされていることを検証
    // 2024-11-11(月) 〜 2024-11-15(金) = 5営業日
    // 次の週末: 2024-11-16(土), 2024-11-17(日) = 2日の週末
    expect(result.excluded_weekend_days).toBe(2);

    // 検証4: 計算対象期間に祝日が含まれていないことを検証
    // 指定された期間内に祝日がないため0
    expect(result.excluded_holiday_days).toBe(0);

    // 検証5: 完了予定日が営業日ベースで正確に5日後であることを確認
    // 開始日: 2024-11-11(月)
    // 営業日カウント: 2024-11-11(月), 2024-11-12(火), 2024-11-13(水), 2024-11-14(木), 2024-11-15(金)
    // 期待される完了予定日: 2024-11-15（金）
    expect(result.completion_date).toBe("2024-11-15");

    // 検証6: 完了予定日が金曜日（営業日）であることを確認
    const completion_date_obj = new Date("2024-11-15T00:00:00Z");
    const day_of_week = completion_date_obj.getUTCDay();
    expect(day_of_week).toBe(5); // 5 = 金曜日（UTC: 0=日, 1=月, ..., 5=金, 6=土）
  });
});