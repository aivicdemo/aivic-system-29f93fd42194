import { describe, test, expect } from "@jest/globals";
import { defineMonthlyReportPeriod } from "../../src/logic/it-1-br-1781935279444-1-2-1";

describe("月次サマリーテンプレートの定義・管理機能", () => {
  test("SCEN-1023: 月初00:00:00から月末23:59:59の境界日時がレポート期間として正確に設定される", () => {
    const targetYear = 2024;
    const targetMonth = 1;

    const result = defineMonthlyReportPeriod({
      year: targetYear,
      month: targetMonth,
    });

    const expectedStartDateTime = new Date("2024-01-01T00:00:00Z");
    const expectedEndDateTime = new Date("2024-01-31T23:59:59Z");

    expect(result.periodStartDateTime).toEqual(expectedStartDateTime);
    expect(result.periodEndDateTime).toEqual(expectedEndDateTime);

    expect(result.periodStartDateTime.getFullYear()).toBe(2024);
    expect(result.periodStartDateTime.getMonth()).toBe(0);
    expect(result.periodStartDateTime.getDate()).toBe(1);
    expect(result.periodStartDateTime.getHours()).toBe(0);
    expect(result.periodStartDateTime.getMinutes()).toBe(0);
    expect(result.periodStartDateTime.getSeconds()).toBe(0);

    expect(result.periodEndDateTime.getFullYear()).toBe(2024);
    expect(result.periodEndDateTime.getMonth()).toBe(0);
    expect(result.periodEndDateTime.getDate()).toBe(31);
    expect(result.periodEndDateTime.getHours()).toBe(23);
    expect(result.periodEndDateTime.getMinutes()).toBe(59);
    expect(result.periodEndDateTime.getSeconds()).toBe(59);

    const boundaryDateAtStartOfMonth = new Date("2024-01-01T00:00:00Z");
    expect(result.isIncludedInPeriod(boundaryDateAtStartOfMonth)).toBe(true);

    const boundaryDateAtEndOfMonth = new Date("2024-01-31T23:59:59Z");
    expect(result.isIncludedInPeriod(boundaryDateAtEndOfMonth)).toBe(true);

    const dateAtNextMonthStart = new Date("2024-02-01T00:00:00Z");
    expect(result.isIncludedInPeriod(dateAtNextMonthStart)).toBe(false);

    const dateBeforePeriodStart = new Date("2023-12-31T23:59:59Z");
    expect(result.isIncludedInPeriod(dateBeforePeriodStart)).toBe(false);

    const dateInMiddleOfMonth = new Date("2024-01-15T14:30:45Z");
    expect(result.isIncludedInPeriod(dateInMiddleOfMonth)).toBe(true);

    expect(result.status).toBe("confirmed");
    expect(result.year).toBe(2024);
    expect(result.month).toBe(1);
  });
});