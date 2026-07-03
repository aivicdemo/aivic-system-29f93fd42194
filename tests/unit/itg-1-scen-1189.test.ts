import { describe, test, expect, beforeEach } from "@jest/globals";
import { calculateSLADeadline } from "../../src/logic/it-1781935279444-2-2-1";

describe("営業データ品質検証 - SLA期限計算機能", () => {
  // SCEN-1189: 土日祝日を含む期間での営業日ベースSLA計算が正確に実行される
  test("should calculate SLA deadline accurately excluding weekends and holidays", () => {
    // Setup: 2024-01-12 (金曜日) 14:00 を問い合わせ開始日時として設定
    const inquiryStartTime = new Date("2024-01-12T14:00:00Z");
    const slaDaysCount = 3; // 営業日ベースで3日間

    // 2024年1月の祝日定義
    // - 2024-01-08 (月) 成人の日
    // - 2024-01-15 (月) 実務仮定祝日
    // - その他企業独自休日: 2024-01-11 (木)
    const holidays = [
      new Date("2024-01-08"),
      new Date("2024-01-11"),
      new Date("2024-01-15"),
    ];

    // 実行: SLA期限を計算
    const calculatedDeadline = calculateSLADeadline({
      inquiryStartTime,
      slaDaysCount,
      holidays,
    });

    // 期待値: 営業日のみをカウント
    // 金 (2024-01-12 14:00) → カウント開始
    // 土 (2024-01-13) スキップ
    // 日 (2024-01-14) スキップ
    // 月 (2024-01-15) スキップ (祝日)
    // 火 (2024-01-16) カウント1日目 ✓
    // 水 (2024-01-17) カウント2日目 ✓
    // 木 (2024-01-18) カウント3日目 ✓
    // 金 (2024-01-19 14:00) が期限
    const expectedDeadline = new Date("2024-01-19T14:00:00Z");

    expect(calculatedDeadline.getTime()).toBe(expectedDeadline.getTime());
  });

  test("should correctly handle multiple holiday patterns in SLA calculation", () => {
    // ケース1: 複数の連続祝日を含む期間
    const inquiryStartTime1 = new Date("2024-07-19T10:30:00Z"); // 金曜日
    const slaDaysCount1 = 2; // 営業日ベースで2日間

    // 2024年7月の祝日: 海の日 (2024-07-15 月)、スポーツの日は10月
    // 企業独自休日: 2024-07-22 (月)
    const holidays1 = [
      new Date("2024-07-15"),
      new Date("2024-07-22"),
    ];

    const calculatedDeadline1 = calculateSLADeadline({
      inquiryStartTime: inquiryStartTime1,
      slaDaysCount: slaDaysCount1,
      holidays: holidays1,
    });

    // 期待値:
    // 金 (2024-07-19 10:30) → カウント開始
    // 土 (2024-07-20) スキップ
    // 日 (2024-07-21) スキップ
    // 月 (2024-07-22) スキップ (企業独自休日)
    // 火 (2024-07-23) カウント1日目 ✓
    // 水 (2024-07-24) カウント2日目 ✓
    // 木 (2024-07-25 10:30) が期限
    const expectedDeadline1 = new Date("2024-07-25T10:30:00Z");

    expect(calculatedDeadline1.getTime()).toBe(expectedDeadline1.getTime());

    // ケース2: 開始日が月曜日で、すぐに祝日が続く場合
    const inquiryStartTime2 = new Date("2024-01-08T09:00:00Z"); // 月曜日 (成人の日)
    // 成人の日が開始日の場合、翌営業日から開始
    const slaDaysCount2 = 1;
    const holidays2 = [new Date("2024-01-08")];

    const calculatedDeadline2 = calculateSLADeadline({
      inquiryStartTime: inquiryStartTime2,
      slaDaysCount: slaDaysCount2,
      holidays: holidays2,
    });

    // 期待値:
    // 月 (2024-01-08 09:00) はスキップ (祝日)
    // 火 (2024-01-09) カウント1日目 ✓
    // 水 (2024-01-10 09:00) が期限
    const expectedDeadline2 = new Date("2024-01-10T09:00:00Z");

    expect(calculatedDeadline2.getTime()).toBe(expectedDeadline2.getTime());
  });

  test("should correctly identify and exclude all weekend days across weeks", () => {
    // ケース: 金曜日から3営業日後を計算 (複数週をまたぐケース)
    const inquiryStartTime = new Date("2024-02-16T11:45:00Z"); // 金曜日
    const slaDaysCount = 5; // 営業日ベースで5日間

    // 2024年2月の祝日: なし (テスト用)
    const holidays: Date[] = [];

    const calculatedDeadline = calculateSLADeadline({
      inquiryStartTime,
      slaDaysCount,
      holidays,
    });

    // 期待値:
    // 金 (2024-02-16 11:45) → カウント開始
    // 土 (2024-02-17) スキップ
    // 日 (2024-02-18) スキップ
    // 月 (2024-02-19) カウント1日目 ✓
    // 火 (2024-02-20) カウント2日目 ✓
    // 水 (2024-02-21) カウント3日目 ✓
    // 木 (2024-02-22) カウント4日目 ✓
    // 金 (2024-02-23) カウント5日目 ✓
    // 土 (2024-02-24) スキップ
    // 日 (2024-02-25) スキップ
    // 月 (2024-02-26 11:45) が期限
    const expectedDeadline = new Date("2024-02-26T11:45:00Z");

    expect(calculatedDeadline.getTime()).toBe(expectedDeadline.getTime());
  });

  test("should preserve time component when calculating SLA deadline", () => {
    // ケース: 異なる時刻での開始時間が期限計算に反映されることを検証
    const inquiryStartTime1 = new Date("2024-03-15T15:30:00Z"); // 金曜日 15:30
    const inquiryStartTime2 = new Date("2024-03-15T09:00:00Z"); // 同じ日 09:00
    const slaDaysCount = 1; // 営業日ベースで1日間
    const holidays: Date[] = [];

    const deadline1 = calculateSLADeadline({
      inquiryStartTime: inquiryStartTime1,
      slaDaysCount,
      holidays,
    });

    const deadline2 = calculateSLADeadline({
      inquiryStartTime: inquiryStartTime2,
      slaDaysCount,
      holidays,
    });

    // 期待値: 開始時刻が期한に반영되어야 함
    // ケース1: 金 15:30 → 月 15:30
    const expectedDeadline1 = new Date("2024-03-18T15:30:00Z");
    // ケース2: 金 09:00 → 月 09:00
    const expectedDeadline2 = new Date("2024-03-18T09:00:00Z");

    expect(deadline1.getTime()).toBe(expectedDeadline1.getTime());
    expect(deadline2.getTime()).toBe(expectedDeadline2.getTime());

    // 期限の時刻差分を検証 (6時間30分)
    const timeDifference = deadline1.getTime() - deadline2.getTime();
    const expectedTimeDifference = 6.5 * 60 * 60 * 1000; // 6.5時間 (ミリ秒)
    expect(timeDifference).toBe(expectedTimeDifference);
  });

  test("should correctly handle edge case where start date is already a holiday", () => {
    // ケース: 開始日時が祝日である場合、翌営業日からカウント開始
    const inquiryStartTime = new Date("2024-09-16T14:00:00Z"); // 月曜日 (敬老の日)
    const slaDaysCount = 2;
    const holidays = [new Date("2024-09-16")]; // この日が祝日

    const calculatedDeadline = calculateSLADeadline({
      inquiryStartTime,
      slaDaysCount,
      holidays,
    });

    // 期待値:
    // 月 (2024-09-16) はスキップ (祝日)
    // 火 (2024-09-17) カウント1日目 ✓
    // 水 (2024-09-18) カウント2日目 ✓
    // 木 (2024-09-19 14:00) が期限
    const expectedDeadline = new Date("2024-09-19T14:00:00Z");

    expect(calculatedDeadline.getTime()).toBe(expectedDeadline.getTime());
  });

  test("should throw error when SLA days count is invalid", () => {
    const inquiryStartTime = new Date("2024-01-12T14:00:00Z");
    const holidays: Date[] = [];

    // ケース1: slaDaysCount が 0 以下の場合
    expect(() => {
      calculateSLADeadline({
        inquiryStartTime,
        slaDaysCount: 0,
        holidays,
      });
    }).toThrow(/営業日数/);

    // ケース2: slaDaysCount が負数の場合
    expect(() => {
      calculateSLADeadline({
        inquiryStartTime,
        slaDaysCount: -1,
        holidays,
      });
    }).toThrow(/営業日数/);
  });

  test("should handle very large SLA days count (spanning multiple weeks)", () => {
    // ケース: 20営業日後の期限を計算
    const inquiryStartTime = new Date("2024-04-01T10:00:00Z"); // 月曜日
    const slaDaysCount = 20; // 営業日ベースで20日間
    const holidays = [
      new Date("2024-04-29"), // 昭和の日
    ];

    const calculatedDeadline = calculateSLADeadline({
      inquiryStartTime,
      slaDaysCount,
      holidays,
    });

    // 期待値: 4月1日 月 → 4月1, 2, 3, 4, 5, 8, 9, 10, 11, 12,
    //         15, 16, 17, 18, 19, 22, 23, 24, 25, 26 (祝日スキップ)
    //         → 4月26日 金が20営業日目
    //         → 4月29日 (月) がスキップされるため実際は4月30日 (火)
    const expectedDeadline = new Date("2024-04-30T10:00:00Z");

    expect(calculatedDeadline.getTime()).toBe(expectedDeadline.getTime());
  });
});