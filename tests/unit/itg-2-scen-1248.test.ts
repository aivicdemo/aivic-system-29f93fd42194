import { describe, test, expect } from "@jest/globals";
import { planRolloutWithNewPrecisionStandard } from "../../src/logic/it-6-2-1-1";

describe("新精度基準の段階的ロールアウト計画立案", () => {
  test("SCEN-1248: 新精度基準の値が無効である場合、ロールアウト計画立案がエラーとなる", () => {
    const validCurrentStandard = {
      ocrAccuracyThreshold: 85.0,
      aiJudgmentAccuracyThreshold: 80.0,
      processingTimeTarget: 30,
    };

    const validImplementationGroups = [
      {
        groupId: "group_001",
        groupName: "グループA",
        targetCount: 15,
        expectedRolloutDate: "2024-02-15",
      },
      {
        groupId: "group_002",
        groupName: "グループB",
        targetCount: 10,
        expectedRolloutDate: "2024-02-22",
      },
    ];

    const validRolloutSchedule = {
      startDate: "2024-02-15",
      completionDate: "2024-03-01",
      phaseCount: 2,
    };

    // テスト1: 新精度基準がnullの場合
    expect(() =>
      planRolloutWithNewPrecisionStandard({
        currentStandard: validCurrentStandard,
        newPrecisionStandard: null as any,
        implementationGroups: validImplementationGroups,
        rolloutSchedule: validRolloutSchedule,
      })
    ).toThrow(/精度基準/);

    // テスト2: 新精度基準がundefinedの場合
    expect(() =>
      planRolloutWithNewPrecisionStandard({
        currentStandard: validCurrentStandard,
        newPrecisionStandard: undefined as any,
        implementationGroups: validImplementationGroups,
        rolloutSchedule: validRolloutSchedule,
      })
    ).toThrow(/精度基準/);

    // テスト3: 新精度基準のOCR精度が負の数の場合
    expect(() =>
      planRolloutWithNewPrecisionStandard({
        currentStandard: validCurrentStandard,
        newPrecisionStandard: {
          ocrAccuracyThreshold: -5.0,
          aiJudgmentAccuracyThreshold: 82.0,
          processingTimeTarget: 28,
        },
        implementationGroups: validImplementationGroups,
        rolloutSchedule: validRolloutSchedule,
      })
    ).toThrow(/OCR精度/);

    // テスト4: 新精度基準のOCR精度が100を超える場合
    expect(() =>
      planRolloutWithNewPrecisionStandard({
        currentStandard: validCurrentStandard,
        newPrecisionStandard: {
          ocrAccuracyThreshold: 105.0,
          aiJudgmentAccuracyThreshold: 82.0,
          processingTimeTarget: 28,
        },
        implementationGroups: validImplementationGroups,
        rolloutSchedule: validRolloutSchedule,
      })
    ).toThrow(/OCR精度/);

    // テスト5: 新精度基準のAI判定精度が負の数の場合
    expect(() =>
      planRolloutWithNewPrecisionStandard({
        currentStandard: validCurrentStandard,
        newPrecisionStandard: {
          ocrAccuracyThreshold: 87.0,
          aiJudgmentAccuracyThreshold: -10.0,
          processingTimeTarget: 28,
        },
        implementationGroups: validImplementationGroups,
        rolloutSchedule: validRolloutSchedule,
      })
    ).toThrow(/AI判定精度/);

    // テスト6: 新精度基準のAI判定精度が100を超える場合
    expect(() =>
      planRolloutWithNewPrecisionStandard({
        currentStandard: validCurrentStandard,
        newPrecisionStandard: {
          ocrAccuracyThreshold: 87.0,
          aiJudgmentAccuracyThreshold: 102.5,
          processingTimeTarget: 28,
        },
        implementationGroups: validImplementationGroups,
        rolloutSchedule: validRolloutSchedule,
      })
    ).toThrow(/AI判定精度/);

    // テスト7: 処理時間目標が負の数の場合
    expect(() =>
      planRolloutWithNewPrecisionStandard({
        currentStandard: validCurrentStandard,
        newPrecisionStandard: {
          ocrAccuracyThreshold: 87.0,
          aiJudgmentAccuracyThreshold: 82.0,
          processingTimeTarget: -5,
        },
        implementationGroups: validImplementationGroups,
        rolloutSchedule: validRolloutSchedule,
      })
    ).toThrow(/処理時間/);

    // テスト8: 処理時間目標がゼロの場合
    expect(() =>
      planRolloutWithNewPrecisionStandard({
        currentStandard: validCurrentStandard,
        newPrecisionStandard: {
          ocrAccuracyThreshold: 87.0,
          aiJudgmentAccuracyThreshold: 82.0,
          processingTimeTarget: 0,
        },
        implementationGroups: validImplementationGroups,
        rolloutSchedule: validRolloutSchedule,
      })
    ).toThrow(/処理時間/);

    // テスト9: 新精度基準が空オブジェクトの場合
    expect(() =>
      planRolloutWithNewPrecisionStandard({
        currentStandard: validCurrentStandard,
        newPrecisionStandard: {} as any,
        implementationGroups: validImplementationGroups,
        rolloutSchedule: validRolloutSchedule,
      })
    ).toThrow(/精度基準/);

    // テスト10: 正常な新精度基準で正常にロールアウト計画が立案される場合
    const validNewPrecisionStandard = {
      ocrAccuracyThreshold: 87.5,
      aiJudgmentAccuracyThreshold: 82.5,
      processingTimeTarget: 28,
    };

    const result = planRolloutWithNewPrecisionStandard({
      currentStandard: validCurrentStandard,
      newPrecisionStandard: validNewPrecisionStandard,
      implementationGroups: validImplementationGroups,
      rolloutSchedule: validRolloutSchedule,
    });

    expect(result).toBeDefined();
    expect(result.rolloutPlanId).toBeDefined();
    expect(typeof result.rolloutPlanId).toBe("string");
    expect(result.status).toBe("approved");
    expect(result.phases).toHaveLength(2);
    expect(result.phases[0].groupId).toBe("group_001");
    expect(result.phases[0].groupName).toBe("グループA");
    expect(result.phases[0].targetCount).toBe(15);
    expect(result.phases[0].rolloutDate).toBe("2024-02-15");
    expect(result.phases[1].groupId).toBe("group_002");
    expect(result.phases[1].groupName).toBe("グループB");
    expect(result.phases[1].targetCount).toBe(10);
    expect(result.phases[1].rolloutDate).toBe("2024-02-22");
    expect(result.newPrecisionStandard).toEqual(validNewPrecisionStandard);
    expect(result.scheduledCompletionDate).toBe("2024-03-01");
    expect(result.createdAt).toBeDefined();
  });
});