import { evaluateGraduationRequirements } from "../../src/logic/it-1781935279444-2-2-1";

describe("卒業要件達成状況判定機能", () => {
  // SCEN-1090
  test("要件充足率が100%に達したとき卒業判定フラグが立つ", () => {
    const requirements = [
      {
        id: "req_001",
        name: "請求書作成業務",
        fulfilled: true,
        completionRate: 100,
      },
      {
        id: "req_002",
        name: "営業報告書集計業務",
        fulfilled: true,
        completionRate: 100,
      },
      {
        id: "req_003",
        name: "契約書管理業務",
        fulfilled: true,
        completionRate: 100,
      },
      {
        id: "req_004",
        name: "営業データ品質検証",
        fulfilled: true,
        completionRate: 100,
      },
      {
        id: "req_005",
        name: "請求額計算検証",
        fulfilled: true,
        completionRate: 100,
      },
    ];

    const result = evaluateGraduationRequirements(requirements);

    expect(result.requirementFulfillmentRate).toBe(100);
    expect(result.graduationFlag).toBe(true);
  });
});