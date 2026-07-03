import { searchSalesActivities } from "../../src/logic/it-1-2-1";

describe("営業活動データの検索・抽出機能", () => {
  test("SCEN-1164: 複数の検索条件を組み合わせた場合に全条件を満たすデータのみが抽出される", () => {
    // 検索条件の準備
    const staffName = "田中太郎";
    const startDate = "2024-01-01";
    const endDate = "2024-01-31";
    const status = "completed";

    // テストデータ：複数の営業活動データを用意
    const mockSalesActivities = [
      {
        id: 1,
        staffName: "田中太郎",
        activityDate: "2024-01-15",
        status: "completed",
        customerId: "cust001",
        appointmentCount: 5,
        contractCount: 2,
      },
      {
        id: 2,
        staffName: "田中太郎",
        activityDate: "2024-01-20",
        status: "completed",
        customerId: "cust002",
        appointmentCount: 3,
        contractCount: 1,
      },
      {
        id: 3,
        staffName: "佐藤次郎",
        activityDate: "2024-01-10",
        status: "completed",
        customerId: "cust001",
        appointmentCount: 2,
        contractCount: 1,
      },
      {
        id: 4,
        staffName: "田中太郎",
        activityDate: "2024-02-05",
        status: "completed",
        customerId: "cust003",
        appointmentCount: 4,
        contractCount: 2,
      },
      {
        id: 5,
        staffName: "田中太郎",
        activityDate: "2024-01-25",
        status: "pending",
        customerId: "cust004",
        appointmentCount: 1,
        contractCount: 0,
      },
      {
        id: 6,
        staffName: "田中太郎",
        activityDate: "2024-01-12",
        status: "completed",
        customerId: "cust005",
        appointmentCount: 6,
        contractCount: 3,
      },
    ];

    // 検索実行
    const searchConditions = {
      staffName,
      startDate,
      endDate,
      status,
    };

    const result = searchSalesActivities(mockSalesActivities, searchConditions);

    // 期待結果：条件1（営業担当者名）、条件2（期間指定）、条件3（ステータス）をすべて満たすデータのみ抽出
    // 該当するデータ：id 1, 2, 6
    expect(result).toEqual([
      {
        id: 1,
        staffName: "田中太郎",
        activityDate: "2024-01-15",
        status: "completed",
        customerId: "cust001",
        appointmentCount: 5,
        contractCount: 2,
      },
      {
        id: 2,
        staffName: "田中太郎",
        activityDate: "2024-01-20",
        status: "completed",
        customerId: "cust002",
        appointmentCount: 3,
        contractCount: 1,
      },
      {
        id: 6,
        staffName: "田中太郎",
        activityDate: "2024-01-12",
        status: "completed",
        customerId: "cust005",
        appointmentCount: 6,
        contractCount: 3,
      },
    ]);

    // 検証1：返されたデータが条件1（営業担当者名）を満たしていることを確認
    result.forEach((record) => {
      expect(record.staffName).toBe("田中太郎");
    });

    // 検証2：返されたデータが条件2（期間指定）を満たしていることを確認
    result.forEach((record) => {
      const recordDate = new Date(record.activityDate);
      const start = new Date(startDate);
      const end = new Date(endDate);
      expect(recordDate.getTime()).toBeGreaterThanOrEqual(start.getTime());
      expect(recordDate.getTime()).toBeLessThanOrEqual(end.getTime());
    });

    // 検証3：返されたデータが条件3（ステータス）を満たしていることを確認
    result.forEach((record) => {
      expect(record.status).toBe("completed");
    });

    // 検証4：すべての返されたデータが全3つの条件を同時に満たしていることを確認
    expect(result.length).toBe(3);
    result.forEach((record) => {
      expect(record.staffName).toBe("田中太郎");
      const recordDate = new Date(record.activityDate);
      const start = new Date(startDate);
      const end = new Date(endDate);
      expect(recordDate.getTime()).toBeGreaterThanOrEqual(start.getTime());
      expect(recordDate.getTime()).toBeLessThanOrEqual(end.getTime());
      expect(record.status).toBe("completed");
    });

    // 検証5：条件を満たさないデータが結果に含まれていないことを確認
    expect(result.every((r) => r.id !== 3)).toBe(true); // 佐藤次郎なので除外
    expect(result.every((r) => r.id !== 4)).toBe(true); // 2024年02月なので除外
    expect(result.every((r) => r.id !== 5)).toBe(true); // statusがpendingなので除外
  });
});