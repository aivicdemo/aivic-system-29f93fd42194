import { it, describe, beforeEach, afterEach } from "@jest/globals";
import { determineMonthlyCutoffPeriod } from "../../src/logic/it-1-1-1";

describe("営業成果データの自動検証ルール定義と異常検出機能", () => {
  // SCEN-589: [normal] 月次集計期間確定機能 - 月次締め日の営業データから集計対象期間が正確に確定される
  it("should correctly determine monthly cutoff period from sales activity data", () => {
    // 準備: テストデータの営業活動レコード
    const sales_activity_records = [
      {
        id: 1,
        activity_date: new Date("2024-01-05T09:00:00Z"),
        customer_id: "CUST001",
        activity_type: "appointment",
        quantity: 1,
      },
      {
        id: 2,
        activity_date: new Date("2024-01-15T14:30:00Z"),
        customer_id: "CUST002",
        activity_type: "contract",
        quantity: 1,
      },
      {
        id: 3,
        activity_date: new Date("2024-01-31T23:59:00Z"),
        customer_id: "CUST001",
        activity_type: "appointment",
        quantity: 2,
      },
      {
        id: 4,
        activity_date: new Date("2024-02-01T08:00:00Z"),
        customer_id: "CUST003",
        activity_type: "contract",
        quantity: 1,
      },
      {
        id: 5,
        activity_date: new Date("2023-12-31T10:00:00Z"),
        customer_id: "CUST002",
        activity_type: "appointment",
        quantity: 1,
      },
    ];

    // 実行: 月次集計期間確定機能を実行（2024年1月の月末日を基準日として）
    const cutoff_date = new Date("2024-01-31T23:59:59Z");
    const result = determineMonthlyCutoffPeriod(
      sales_activity_records,
      cutoff_date
    );

    // 検証1: 集計対象期間の開始日が2024年1月1日であることを確認
    expect(result.period_start_date).toEqual(new Date("2024-01-01T00:00:00Z"));

    // 検証2: 集計対象期間の終了日が2024年1月31日であることを確認
    expect(result.period_end_date).toEqual(new Date("2024-01-31T23:59:59Z"));

    // 検証3: 集計対象期間内のデータレコード数が正確に計算されていることを確認
    // 2024-01-05, 2024-01-15, 2024-01-31 の3件が該当
    expect(result.record_count_in_period).toBe(3);

    // 検証4: 月末日を超えるデータが集計対象外になっていることを確認
    // 2024-02-01 のデータは集計対象外
    expect(result.excluded_records).toEqual([
      {
        id: 4,
        activity_date: new Date("2024-02-01T08:00:00Z"),
        customer_id: "CUST003",
        activity_type: "contract",
        quantity: 1,
      },
      {
        id: 5,
        activity_date: new Date("2023-12-31T10:00:00Z"),
        customer_id: "CUST002",
        activity_type: "appointment",
        quantity: 1,
      },
    ]);

    // 検証5: 集計期間確定のステータスが「確定済み」に更新されていることを確認
    expect(result.status).toBe("確定済み");

    // 検証6: 集計対象期間内のレコード詳細が正確に把握できることを確認
    expect(result.included_records).toEqual([
      {
        id: 1,
        activity_date: new Date("2024-01-05T09:00:00Z"),
        customer_id: "CUST001",
        activity_type: "appointment",
        quantity: 1,
      },
      {
        id: 2,
        activity_date: new Date("2024-01-15T14:30:00Z"),
        customer_id: "CUST002",
        activity_type: "contract",
        quantity: 1,
      },
      {
        id: 3,
        activity_date: new Date("2024-01-31T23:59:00Z"),
        customer_id: "CUST001",
        activity_type: "appointment",
        quantity: 2,
      },
    ]);

    // 検証7: 月次集計期間情報の完全性を確認
    expect(result.month).toBe(1);
    expect(result.year).toBe(2024);
  });
});