import { isVersionValid } from "../../src/logic/it-1781935279444-1-1-1";

describe("営業データ項目のメタデータ管理機能", () => {
  test("SCEN-771: 顧客別・案件別・資料種別バージョン有効性自動判定機能 - 有効期限の開始日時と終了日時の境界値で正確に判定される", () => {
    const versionRecord = {
      id: "v001",
      customerId: "cust_001",
      projectId: "proj_001",
      documentType: "contract",
      versionNumber: 1,
      startDateTime: new Date("2024-01-01T00:00:00Z"),
      endDateTime: new Date("2024-01-31T23:59:59Z"),
      createdAt: new Date("2023-12-25T00:00:00Z"),
      updatedAt: new Date("2024-01-01T00:00:00Z"),
    };

    // 開始当日（2024年1月1日00:00:00）の判定 → true
    const onStartDay = new Date("2024-01-01T00:00:00Z");
    expect(isVersionValid(versionRecord, onStartDay)).toBe(true);

    // 開始前日（2023年12月31日23:59:59）の判定 → false
    const beforeStartDay = new Date("2023-12-31T23:59:59Z");
    expect(isVersionValid(versionRecord, beforeStartDay)).toBe(false);

    // 終了前日（2024年1月30日23:59:59）の判定 → true
    const beforeEndDay = new Date("2024-01-30T23:59:59Z");
    expect(isVersionValid(versionRecord, beforeEndDay)).toBe(true);

    // 終了当日（2024年1月31日23:59:59）の判定 → true
    const onEndDay = new Date("2024-01-31T23:59:59Z");
    expect(isVersionValid(versionRecord, onEndDay)).toBe(true);

    // 終了翌日（2024年2月1日00:00:00）の判定 → false
    const afterEndDay = new Date("2024-02-01T00:00:00Z");
    expect(isVersionValid(versionRecord, afterEndDay)).toBe(false);
  });
});