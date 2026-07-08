import { searchRevisionHistoryByDateRange } from "../../src/logic/it-6-2-2-1";

describe("査定部署長による修正履歴検索機能", () => {
  // SCEN-741
  test("指定した日付範囲内の修正履歴のみを検索結果として返す", () => {
    const start_date = "2024-01-01";
    const end_date = "2024-01-31";

    const mock_revisions = [
      {
        revision_id: "REV001",
        revision_date: "2024-01-05T10:30:00Z",
        reviser_name: "査定員A",
        revision_content: "相場乖離率を-5%に修正",
        revision_reason: "参照データの更新に基づく修正",
        original_value: "10.5",
        revised_value: "10.0",
      },
      {
        revision_id: "REV002",
        revision_date: "2024-01-15T14:20:00Z",
        reviser_name: "査定員B",
        revision_content: "金額を修正",
        revision_reason: "物価本の最新版を反映",
        original_value: "1000000",
        revised_value: "950000",
      },
      {
        revision_id: "REV003",
        revision_date: "2024-01-28T09:45:00Z",
        reviser_name: "査定部署長C",
        revision_content: "判定理由を追記",
        revision_reason: "査定根拠の透明性向上",
        original_value: "標準範囲内と判定",
        revised_value: "標準範囲内（地域補正済み）と判定",
      },
      {
        revision_id: "REV004",
        revision_date: "2024-02-05T11:00:00Z",
        reviser_name: "査定員D",
        revision_content: "補正係数を更新",
        revision_reason: "季節変動の反映",
        original_value: "1.0",
        revised_value: "1.15",
      },
      {
        revision_id: "REV005",
        revision_date: "2023-12-28T16:30:00Z",
        reviser_name: "査定員E",
        revision_content: "見積金額を修正",
        revision_reason: "読取誤りの修正",
        original_value: "2000000",
        revised_value: "1800000",
      },
    ];

    const result = searchRevisionHistoryByDateRange(
      mock_revisions,
      start_date,
      end_date
    );

    expect(result).toEqual([
      {
        revision_id: "REV001",
        revision_date: "2024-01-05T10:30:00Z",
        reviser_name: "査定員A",
        revision_content: "相場乖離率を-5%に修正",
        revision_reason: "参照データの更新に基づく修正",
        original_value: "10.5",
        revised_value: "10.0",
      },
      {
        revision_id: "REV002",
        revision_date: "2024-01-15T14:20:00Z",
        reviser_name: "査定員B",
        revision_content: "金額を修正",
        revision_reason: "物価本の最新版を反映",
        original_value: "1000000",
        revised_value: "950000",
      },
      {
        revision_id: "REV003",
        revision_date: "2024-01-28T09:45:00Z",
        reviser_name: "査定部署長C",
        revision_content: "判定理由を追記",
        revision_reason: "査定根拠の透明性向上",
        original_value: "標準範囲内と判定",
        revised_value: "標準範囲内（地域補正済み）と判定",
      },
    ]);

    expect(result.length).toBe(3);

    result.forEach((revision) => {
      const revision_timestamp = new Date(revision.revision_date);
      const start_timestamp = new Date(start_date);
      const end_timestamp = new Date(end_date);
      end_timestamp.setHours(23, 59, 59, 999);

      expect(revision_timestamp.getTime()).toBeGreaterThanOrEqual(
        start_timestamp.getTime()
      );
      expect(revision_timestamp.getTime()).toBeLessThanOrEqual(
        end_timestamp.getTime()
      );
    });

    expect(result[0]).toHaveProperty("revision_id");
    expect(result[0]).toHaveProperty("revision_date");
    expect(result[0]).toHaveProperty("reviser_name");
    expect(result[0]).toHaveProperty("revision_content");
    expect(result[0]).toHaveProperty("revision_reason");
    expect(result[0]).toHaveProperty("original_value");
    expect(result[0]).toHaveProperty("revised_value");

    expect(result[0].revision_id).toBe("REV001");
    expect(result[0].reviser_name).toBe("査定員A");
    expect(result[0].revision_content).toBe("相場乖離率を-5%に修正");
    expect(result[0].original_value).toBe("10.5");
    expect(result[0].revised_value).toBe("10.0");

    expect(result[1].revision_id).toBe("REV002");
    expect(result[1].reviser_name).toBe("査定員B");
    expect(result[1].revision_content).toBe("金額を修正");
    expect(result[1].original_value).toBe("1000000");
    expect(result[1].revised_value).toBe("950000");

    expect(result[2].revision_id).toBe("REV003");
    expect(result[2].reviser_name).toBe("査定部署長C");
    expect(result[2].revision_content).toBe("判定理由を追記");
    expect(result[2].original_value).toBe("標準範囲内と判定");
    expect(result[2].revised_value).toBe("標準範囲内（地域補正済み）と判定");

    const outside_revisions = result.filter((rev) => {
      const rev_date = new Date(rev.revision_date);
      return (
        rev_date < new Date(start_date) || rev_date > new Date(end_date)
      );
    });
    expect(outside_revisions.length).toBe(0);
  });
});