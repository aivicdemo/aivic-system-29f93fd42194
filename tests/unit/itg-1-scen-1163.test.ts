import { searchSalesActivities } from "../../src/logic/it-1-2-1";

describe("営業活動データの検索・抽出機能", () => {
  test("SCEN-1163: 指定期間・顧客・営業担当者の営業活動データが正確に抽出される", () => {
    // 準備: 検索条件を設定
    const search_start_date = "2024-01-01";
    const search_end_date = "2024-01-31";
    const search_customer_id = "CUST001";
    const search_sales_rep_id = "REP001";

    // モック営業活動データ
    const mock_all_activities = [
      {
        activity_id: "ACT001",
        customer_id: "CUST001",
        sales_rep_id: "REP001",
        activity_date: "2024-01-05",
        activity_type: "appointment",
        content: "商談実施",
      },
      {
        activity_id: "ACT002",
        customer_id: "CUST001",
        sales_rep_id: "REP001",
        activity_date: "2024-01-15",
        activity_type: "follow_up",
        content: "提案資料送付",
      },
      {
        activity_id: "ACT003",
        customer_id: "CUST001",
        sales_rep_id: "REP002",
        activity_date: "2024-01-20",
        activity_type: "appointment",
        content: "商談実施",
      },
      {
        activity_id: "ACT004",
        customer_id: "CUST002",
        sales_rep_id: "REP001",
        activity_date: "2024-01-10",
        activity_type: "appointment",
        content: "商談実施",
      },
      {
        activity_id: "ACT005",
        customer_id: "CUST001",
        sales_rep_id: "REP001",
        activity_date: "2024-02-05",
        activity_type: "appointment",
        content: "商談実施",
      },
      {
        activity_id: "ACT006",
        customer_id: "CUST001",
        sales_rep_id: "REP001",
        activity_date: "2024-01-25",
        activity_type: "deal",
        content: "成約",
      },
    ];

    // 実行: 検索条件に基づいてデータを抽出
    const result = searchSalesActivities({
      all_activities: mock_all_activities,
      start_date: search_start_date,
      end_date: search_end_date,
      customer_id: search_customer_id,
      sales_rep_id: search_sales_rep_id,
    });

    // 検証1: 期間条件を満たすデータのみが抽出される
    expect(result.filtered_activities.every((act) => {
      const act_date = new Date(act.activity_date);
      const start = new Date(search_start_date);
      const end = new Date(search_end_date);
      return act_date >= start && act_date <= end;
    })).toBe(true);

    // 検証2: 指定顧客のデータのみが抽出される
    expect(result.filtered_activities.every((act) => act.customer_id === search_customer_id)).toBe(true);

    // 検証3: 指定営業担当者のデータのみが抽出される
    expect(result.filtered_activities.every((act) => act.sales_rep_id === search_sales_rep_id)).toBe(true);

    // 検証4: 期間内・顧客・営業担当者条件を満たすデータが過不足なく含まれている
    // 条件を満たすデータは: ACT001, ACT002, ACT006 の3件
    expect(result.filtered_activities.length).toBe(3);
    expect(result.filtered_activities.map((act) => act.activity_id)).toEqual(
      expect.arrayContaining(["ACT001", "ACT002", "ACT006"])
    );

    // 検証5: 条件外のデータが除外されている
    // ACT003 (営業担当者が異なる)、ACT004 (顧客が異なる)、ACT005 (期間外) は含まれていない
    expect(result.filtered_activities.map((act) => act.activity_id)).not.toEqual(
      expect.arrayContaining(["ACT003", "ACT004", "ACT005"])
    );

    // 検証6: 抽出されたデータの日付が正確である
    const extracted_dates = result.filtered_activities.map((act) => act.activity_date);
    expect(extracted_dates).toEqual(expect.arrayContaining(["2024-01-05", "2024-01-15", "2024-01-25"]));

    // 検証7: 抽出件数が正確である
    expect(result.total_count).toBe(3);

    // 検証8: 内容の正確性を確認 (活動タイプと内容)
    const act001 = result.filtered_activities.find((act) => act.activity_id === "ACT001");
    expect(act001?.activity_type).toBe("appointment");
    expect(act001?.content).toBe("商談実施");

    const act006 = result.filtered_activities.find((act) => act.activity_id === "ACT006");
    expect(act006?.activity_type).toBe("deal");
    expect(act006?.content).toBe("成約");
  });
});