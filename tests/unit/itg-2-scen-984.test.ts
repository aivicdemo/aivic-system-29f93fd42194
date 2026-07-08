import { determineMonthlyAggregationPeriod } from "../../src/logic/it-6-3-1";

describe("月次データ集計対象期間の確定", () => {
  // SCEN-984
  test("開始日と終了日が同じ日付の場合、その1日分のデータのみが抽出される", () => {
    const start_date = new Date("2024-01-15T00:00:00Z");
    const end_date = new Date("2024-01-15T23:59:59Z");

    const result = determineMonthlyAggregationPeriod({
      start_date,
      end_date,
    });

    expect(result.start_date).toEqual(new Date("2024-01-15T00:00:00Z"));
    expect(result.end_date).toEqual(new Date("2024-01-15T23:59:59Z"));
    expect(result.days_count).toBe(1);
    expect(result.is_same_day).toBe(true);

    const sample_records = [
      {
        record_id: "REC001",
        date: new Date("2024-01-14T10:00:00Z"),
        value: 100,
      },
      {
        record_id: "REC002",
        date: new Date("2024-01-15T08:30:00Z"),
        value: 200,
      },
      {
        record_id: "REC003",
        date: new Date("2024-01-15T14:20:00Z"),
        value: 300,
      },
      {
        record_id: "REC004",
        date: new Date("2024-01-16T09:00:00Z"),
        value: 150,
      },
    ];

    const filtered_records = sample_records.filter(
      (rec) => rec.date >= start_date && rec.date <= end_date
    );

    expect(filtered_records).toHaveLength(2);
    expect(filtered_records[0].record_id).toBe("REC002");
    expect(filtered_records[1].record_id).toBe("REC003");
    expect(filtered_records.every((rec) => rec.date.toDateString() === "Mon Jan 15 2024")).toBe(true);

    const record_count = filtered_records.length;
    const expected_count = result.days_count;
    expect(record_count).toBe(expected_count);
  });
});