import { searchSalesActivities } from "../../src/logic/it-1781935279444-1-1-1";

describe("営業活動データ検索・抽出・検証", () => {
  // SCEN-1184
  test("複数検索条件を組み合わせた場合、全条件を満たすデータのみが抽出される", () => {
    const searchConditions = {
      salesRepName: "田中太郎",
      activityStartDate: "2024-01-01",
      activityEndDate: "2024-03-31",
      activityType: "提案",
      customerStatus: "見込み客",
    };

    const mockResults = [
      {
        activityId: "ACT001",
        salesRepName: "田中太郎",
        activityDate: "2024-01-15",
        activityType: "提案",
        customerName: "顧客A",
        customerStatus: "見込み客",
      },
      {
        activityId: "ACT002",
        salesRepName: "田中太郎",
        activityDate: "2024-02-20",
        activityType: "提案",
        customerName: "顧客B",
        customerStatus: "見込み客",
      },
      {
        activityId: "ACT003",
        salesRepName: "田中太郎",
        activityDate: "2024-03-10",
        activityType: "提案",
        customerName: "顧客C",
        customerStatus: "見込み客",
      },
      {
        activityId: "ACT004",
        salesRepName: "田中太郎",
        activityDate: "2024-01-05",
        activityType: "提案",
        customerName: "顧客D",
        customerStatus: "見込み客",
      },
      {
        activityId: "ACT005",
        salesRepName: "田中太郎",
        activityDate: "2024-03-28",
        activityType: "提案",
        customerName: "顧客E",
        customerStatus: "見込み客",
      },
      {
        activityId: "ACT006",
        salesRepName: "田中太郎",
        activityDate: "2024-03-31",
        activityType: "提案",
        customerName: "顧客F",
        customerStatus: "見込み客",
      },
    ];

    const result = searchSalesActivities(searchConditions);

    // 検索結果が配列であることを確認
    expect(Array.isArray(result)).toBe(true);

    // 検索結果が5件以上であることを確認
    expect(result.length).toBeGreaterThanOrEqual(5);

    // すべての結果が検索条件を満たしていることを確認
    result.forEach((record) => {
      // 営業担当者が田中太郎であること
      expect(record.salesRepName).toBe("田中太郎");

      // 活動日付が2024年1月1日～3月31日の範囲内であること
      const activityDate = new Date(record.activityDate);
      const startDate = new Date("2024-01-01");
      const endDate = new Date("2024-03-31");
      expect(activityDate.getTime()).toBeGreaterThanOrEqual(startDate.getTime());
      expect(activityDate.getTime()).toBeLessThanOrEqual(
        endDate.getTime() + 86400000
      );

      // 活動種別が提案であること
      expect(record.activityType).toBe("提案");

      // 顧客ステータスが見込み客であること
      expect(record.customerStatus).toBe("見込み客");
    });

    // 条件外のデータが混在していないことを確認
    const nonMatchingCount = result.filter(
      (record) =>
        record.salesRepName !== "田中太郎" ||
        record.activityType !== "提案" ||
        record.customerStatus !== "見込み客"
    ).length;
    expect(nonMatchingCount).toBe(0);

    // 該当するデータが確実に表示されていることを確認（期待される6件すべてが抽出されていること）
    expect(result.length).toBe(6);

    // 最初の3件について詳細検証
    expect(result[0].activityId).toBe("ACT001");
    expect(result[0].customerName).toBe("顧客A");
    expect(result[0].activityDate).toBe("2024-01-15");

    expect(result[1].activityId).toBe("ACT002");
    expect(result[1].customerName).toBe("顧客B");
    expect(result[1].activityDate).toBe("2024-02-20");

    expect(result[2].activityId).toBe("ACT003");
    expect(result[2].customerName).toBe("顧客C");
    expect(result[2].activityDate).toBe("2024-03-10");
  });
});