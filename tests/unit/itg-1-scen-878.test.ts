import { calculateContractChangeVerificationDeadline } from "../../src/logic/it-1-1-1";

describe("営業成果データの自動検証ルール定義と異常検出機能", () => {
  // SCEN-878: [edge] 契約変更検証完了期限の自動計算 - 営業日ベースの期限計算で休業日が正しく除外される
  test("開始日が金曜日で営業日ベース5日間設定時、土日と祝日を除外して翌週金曜日を期限とする", () => {
    // 前提: 開始日が金曜日（2024年1月12日）、営業日ベース5日間の期限設定、システムカレンダーに土日と祝日が登録済み
    // 手順: 契約変更検証完了期限の自動計算を実行
    const start_date = new Date("2024-01-12T09:00:00Z"); // 金曜日
    const business_days_required = 5;
    const holidays = [
      new Date("2024-01-15T00:00:00Z"), // 成人の日（月曜日）
    ];

    const result = calculateContractChangeVerificationDeadline({
      start_date: start_date,
      business_days_required: business_days_required,
      holidays: holidays,
    });

    // 期待結果: 土曜日・日曜日・祝日を除外して営業日5日間後の金曜日（2024年1月19日）が期限として計算される
    // 計算ロジック:
    // - 開始日: 2024-01-12（金曜日）
    // - 営業日1日目: 2024-01-12（金曜日）
    // - 営業日2日目: 2024-01-15を除外（成人の日・祝日）、2024-01-16（火曜日）
    // - 営業日3日目: 2024-01-17（水曜日）
    // - 営業日4日目: 2024-01-18（木曜日）
    // - 営業日5日目: 2024-01-19（金曜日）
    // - 期限日付: 2024-01-19T23:59:59Z

    expect(result.deadline).toEqual(new Date("2024-01-19T23:59:59Z"));
    expect(result.business_days_count).toBe(5);
    expect(result.excluded_weekends).toBe(2); // 土曜日（2024-01-13）、日曜日（2024-01-14）
    expect(result.excluded_holidays).toBe(1); // 成人の日（2024-01-15）
    expect(result.total_excluded_days).toBe(3);
  });
});