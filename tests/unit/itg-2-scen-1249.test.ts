import { describe, test, expect } from "@jest/globals";
import { planRolloutWithTargetGroups } from "../../src/logic/it-6-2-1-1";

describe("新精度基準の段階的ロールアウト計画立案", () => {
  test("SCEN-1249: 対象グループがゼロの場合、ロールアウト計画立案がエラーとなる", () => {
    const input = {
      targetGroups: [],
      implementationScheduleStartDate: "2024-02-01",
      verificationMethod: "段階別検証",
      rolloutPriority: "高",
    };

    expect(() => planRolloutWithTargetGroups(input)).toThrow(/対象グループ/);
  });
});