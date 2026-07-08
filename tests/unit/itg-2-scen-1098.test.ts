import { getValidDashboardData } from "../../src/logic/it-6-2-2-2";

describe("査定員別判定精度・乖離パターン分析ダッシュボード", () => {
  test("SCEN-1098: ダッシュボード表示データ検証機能 - 有効な改善効果データのみが正確に反映される", async () => {
    // テストデータの準備
    const validDataApproved1 = {
      id: "data_001",
      status: "承認済み",
      startDate: "2024-01-01",
      endDate: "2024-12-31",
      effectValue: 15.5,
      improvementRate: 0.155,
    };

    const validDataApproved2 = {
      id: "data_002",
      status: "承認済み",
      startDate: "2024-01-01",
      endDate: "2024-12-31",
      effectValue: 8.3,
      improvementRate: 0.083,
    };

    const validDataApproved3 = {
      id: "data_003",
      status: "承認済み",
      startDate: "2024-01-01",
      endDate: "2024-12-31",
      effectValue: 12.7,
      improvementRate: 0.127,
    };

    const invalidDataRejected = {
      id: "data_004",
      status: "却下",
      startDate: "2024-01-01",
      endDate: "2024-12-31",
      effectValue: 5.2,
      improvementRate: 0.052,
    };

    const invalidDataExpired = {
      id: "data_005",
      status: "承認済み",
      startDate: "2023-01-01",
      endDate: "2023-12-31",
      effectValue: 20.1,
      improvementRate: 0.201,
    };

    const allTestData = [
      validDataApproved1,
      validDataApproved2,
      validDataApproved3,
      invalidDataRejected,
      invalidDataExpired,
    ];

    // APIレスポンスのモック
    const fetchMock = require("jest-fetch-mock");
    fetchMock.enableMocks();
    fetchMock.resetMocks();

    fetchMock.mockResponseOnce(
      JSON.stringify({
        data: allTestData,
        count: 5,
      }),
      { status: 200 }
    );

    // 現在日付を固定値で設定（2024-06-15とする）
    const currentDate = new Date("2024-06-15");

    // 関数を実行
    const result = await getValidDashboardData({
      allRecords: allTestData,
      currentDate: currentDate,
    });

    // 返却されたデータの件数が3件であることを確認
    expect(result.validRecords).toHaveLength(3);

    // 返却されたデータが全て有効な改善効果データであることを確認
    result.validRecords.forEach((record: any) => {
      expect(record.status).toBe("承認済み");
      expect(record.startDate).toBeLessThanOrEqual("2024-06-15");
      expect(record.endDate).toBeGreaterThanOrEqual("2024-06-15");
    });

    // 無効なデータが含まれていないことを確認
    const invalidIds = result.validRecords
      .map((r: any) => r.id)
      .filter((id: string) => id === "data_004" || id === "data_005");
    expect(invalidIds).toHaveLength(0);

    // 表示データのIDが正確に反映されていることを確認
    const displayedIds = result.validRecords.map((r: any) => r.id).sort();
    expect(displayedIds).toEqual(["data_001", "data_002", "data_003"]);

    // 表示データの効果値が正確に反映されていることを確認
    const effectValues = result.validRecords
      .map((r: any) => r.effectValue)
      .sort((a: number, b: number) => a - b);
    expect(effectValues).toEqual([8.3, 12.7, 15.5]);

    // 表示データの改善率が正確に反映されていることを確認
    const improvementRates = result.validRecords
      .map((r: any) => r.improvementRate)
      .sort((a: number, b: number) => a - b);
    expect(improvementRates).toEqual([0.083, 0.127, 0.155]);

    // 却下データがフィルタリングされていることを確認
    const rejectedDataExists = result.validRecords.some(
      (r: any) => r.status === "却下"
    );
    expect(rejectedDataExists).toBe(false);

    // 期限切れデータがフィルタリングされていることを確認
    const expiredDataExists = result.validRecords.some(
      (r: any) => r.endDate < "2024-06-15"
    );
    expect(expiredDataExists).toBe(false);

    // 返却されたサマリー情報の検証
    expect(result.totalInputRecords).toBe(5);
    expect(result.validRecordCount).toBe(3);
    expect(result.invalidRecordCount).toBe(2);
    expect(result.filterReason).toEqual({
      statusRejected: 1,
      periodExpired: 1,
    });
  });
});