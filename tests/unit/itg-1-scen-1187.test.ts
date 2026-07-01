import { searchSalesActivities } from "../../src/logic/it-1781935279444-1-1-1";

describe("営業活動データ検索・抽出・検証 - 検索対象期間の境界日時が正確に判定される", () => {
  test("SCEN-1187: 検索対象期間の開始日時と終了日時の境界値が正確に判定される", () => {
    // テスト用の営業活動データセット
    const test_sales_activities = [
      {
        activity_id: "ACT001",
        customer_name: "顧客A",
        contact_datetime: new Date("2023-12-31T23:59:59Z"),
        contact_type: "電話",
        outcome: "対応予定",
        appointment_status: "未確定",
      },
      {
        activity_id: "ACT002",
        customer_name: "顧客B",
        contact_datetime: new Date("2024-01-01T00:00:00Z"),
        contact_type: "訪問",
        outcome: "アポ確定",
        appointment_status: "確定",
      },
      {
        activity_id: "ACT003",
        customer_name: "顧客C",
        contact_datetime: new Date("2024-01-15T12:30:45Z"),
        contact_type: "メール",
        outcome: "成約",
        appointment_status: "完了",
      },
      {
        activity_id: "ACT004",
        customer_name: "顧客D",
        contact_datetime: new Date("2024-01-31T23:59:59Z"),
        contact_type: "訪問",
        outcome: "成約",
        appointment_status: "完了",
      },
      {
        activity_id: "ACT005",
        customer_name: "顧客E",
        contact_datetime: new Date("2024-02-01T00:00:00Z"),
        contact_type: "電話",
        outcome: "対応予定",
        appointment_status: "未確定",
      },
    ];

    // ケース1: 開始日時2024年1月1日 00:00:00、終了日時2024年1月31日 23:59:59
    const search_result_1 = searchSalesActivities(test_sales_activities, {
      start_datetime: new Date("2024-01-01T00:00:00Z"),
      end_datetime: new Date("2024-01-31T23:59:59Z"),
    });

    expect(search_result_1).toHaveLength(3);
    expect(search_result_1.map((a: any) => a.activity_id)).toEqual([
      "ACT002",
      "ACT003",
      "ACT004",
    ]);
    expect(search_result_1.some((a: any) => a.activity_id === "ACT001")).toBe(
      false
    );
    expect(search_result_1.some((a: any) => a.activity_id === "ACT005")).toBe(
      false
    );

    // ケース2: 開始日時を2024年1月1日 00:00:01に変更
    const search_result_2 = searchSalesActivities(test_sales_activities, {
      start_datetime: new Date("2024-01-01T00:00:01Z"),
      end_datetime: new Date("2024-01-31T23:59:59Z"),
    });

    expect(search_result_2).toHaveLength(2);
    expect(search_result_2.map((a: any) => a.activity_id)).toEqual([
      "ACT003",
      "ACT004",
    ]);
    expect(search_result_2.some((a: any) => a.activity_id === "ACT002")).toBe(
      false
    );

    // ケース3: 終了日時を2024年1月31日 23:59:58に変更
    const search_result_3 = searchSalesActivities(test_sales_activities, {
      start_datetime: new Date("2024-01-01T00:00:00Z"),
      end_datetime: new Date("2024-01-31T23:59:58Z"),
    });

    expect(search_result_3).toHaveLength(2);
    expect(search_result_3.map((a: any) => a.activity_id)).toEqual([
      "ACT002",
      "ACT003",
    ]);
    expect(search_result_3.some((a: any) => a.activity_id === "ACT004")).toBe(
      false
    );

    // 境界値の正確性確認
    const boundary_check_result = searchSalesActivities(
      test_sales_activities,
      {
        start_datetime: new Date("2024-01-01T00:00:00Z"),
        end_datetime: new Date("2024-01-31T23:59:59Z"),
      }
    );

    const included_activities = boundary_check_result.map(
      (a: any) => a.activity_id
    );
    expect(included_activities.includes("ACT002")).toBe(true);
    expect(included_activities.includes("ACT004")).toBe(true);
    expect(included_activities.includes("ACT001")).toBe(false);
    expect(included_activities.includes("ACT005")).toBe(false);
  });
});