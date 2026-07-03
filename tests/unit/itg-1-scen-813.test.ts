import { recordDecisionPolicy } from "../../src/logic/it-1781935279444-2-1-1";

describe("営業データ入力時の品質検証ルール定義・実行機能", () => {
  test("SCEN-813: 対応方針決定時に実施予定日時が現在日時より前の場合にバリデーションエラーが発生する", () => {
    const now = new Date("2024-01-15T14:30:00Z");
    const pastDateTime = new Date("2024-01-14T10:00:00Z");

    const input = {
      policyType: "修正対応",
      reason: "営業データ入力誤りを発見",
      plannedExecutionDateTime: pastDateTime.toISOString(),
      currentDateTime: now.toISOString(),
    };

    expect(() => recordDecisionPolicy(input)).toThrow(/実施予定日時/);
  });
});