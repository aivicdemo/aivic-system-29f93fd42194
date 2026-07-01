import { setConsultationDeadline } from "../../src/logic/it-1781935279444-2-1-1";

describe("営業データ入力時の品質検証ルール定義・実行機能", () => {
  test("SCEN-829: 超高優先度の相談は対応期限が当日に設定される", () => {
    // 超高優先度フラグが有効で、受付日時が2024年1月15日10:00の場合
    const consultationData = {
      id: "CONS-001",
      priority: "超高優先度",
      receivedAt: new Date("2024-01-15T10:00:00Z"),
      businessHoursEndTime: "17:00",
    };

    // システムが対応期限の自動設定機能を実行
    const result = setConsultationDeadline(consultationData);

    // 設定された対応期限が相談受付日の当日の営業時間終了時刻に設定されていることを確認
    // 受付日2024-01-15、営業時間終了17:00なので、期限は2024-01-15T17:00:00Z
    expect(result.deadline).toEqual(new Date("2024-01-15T17:00:00Z"));
    expect(result.priority).toBe("超高優先度");
    expect(result.id).toBe("CONS-001");
  });
});