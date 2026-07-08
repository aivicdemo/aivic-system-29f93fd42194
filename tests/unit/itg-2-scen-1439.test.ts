import { computeSLAAchievementStatus } from "../../src/logic/it-6-2-2-2";

describe("読取誤り修正SLA可視化機能", () => {
  test("SCEN-1439: 段階完了時間がSLA設定値と完全に一致する場合に達成と判定される", () => {
    // Arrange
    const slaSettingMinutes = 120;
    const actualCompletionTimeMinutes = 120;

    // Act
    const result = computeSLAAchievementStatus({
      slaSettingMinutes,
      actualCompletionTimeMinutes,
    });

    // Assert
    expect(result.achieved).toBe(true);
    expect(result.status).toBe("達成");
    expect(result.slaSettingMinutes).toBe(120);
    expect(result.actualCompletionTimeMinutes).toBe(120);
    expect(result.differenceMinutes).toBe(0);
    expect(result.achievementPercentage).toBe(100);
  });
});