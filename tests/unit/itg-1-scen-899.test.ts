import { describe, test, expect } from "@jest/globals";
import { applyDiscountAndCampaignRules } from "../../src/logic/it-1781935279444-1-1-1";

describe("営業データ項目のメタデータ管理機能 - 割引・キャンペーン適用判定", () => {
  // SCEN-899: [normal] 割引・キャンペーン適用判定機能 - 契約条件と成果データが一致し、割引率が正しく計算される
  test("SCEN-899: 契約条件と成果データが完全に一致した場合、正しい割引率が計算・適用される", () => {
    // 【前提】契約条件（契約期間、契約金額、顧客区分）が設定され、
    // 対応する成果データ（売上実績、達成率、キャンペーン参加状況）が入力された状態
    const contractCondition = {
      contractId: "CONTRACT-20240115-001",
      contractPeriodStart: new Date("2024-01-01"),
      contractPeriodEnd: new Date("2024-12-31"),
      contractAmount: 1000000,
      customerCategory: "premium", // 顧客区分：プレミアム
      baseDiscountRate: 0.1, // 基本割引率：10%
      campaignCode: "CAMPAIGN-2024-Q1",
    };

    const performanceData = {
      contractId: "CONTRACT-20240115-001",
      reportedSalesAmount: 1200000, // 売上実績：120万
      targetAchievementRate: 1.2, // 達成率：120%
      campaignParticipationStatus: "active", // キャンペーン参加状況：参加中
      reportPeriod: "2024-Q1",
    };

    const campaignRuleSet = {
      "CAMPAIGN-2024-Q1": {
        campaignDiscountRate: 0.05, // キャンペーン割引率：5%
        achievementThreshold: 1.0, // 達成率閾値：100%
        achievementBonusRate: 0.02, // 達成率ボーナス：2%（達成率100%超過につき）
        maxCumulativeDiscount: 0.2, // 最大累積割引率：20%
      },
    };

    // 【実行】割引・キャンペーン適用判定機能を実行
    const result = applyDiscountAndCampaignRules({
      contractCondition,
      performanceData,
      campaignRuleSet,
    });

    // 【検証】期待される計算結果
    // 基本割引率: 10%
    // + キャンペーン割引率: 5%
    // + 達成率ボーナス（120% - 100% = 20% → 20% × 2% = 0.4%）: 0.4%
    // = 小計: 15.4%
    // 最大累積割引率 20% 以下なので: 15.4% が適用
    const expectedTotalDiscountRate = 0.154; // 15.4%

    expect(result.isApplicable).toBe(true);
    expect(result.contractConditionMatch).toBe(true);
    expect(result.performanceDataMatch).toBe(true);
    expect(result.totalDiscountRate).toBeCloseTo(expectedTotalDiscountRate, 5);
    expect(result.baseDiscountRate).toBeCloseTo(0.1, 5);
    expect(result.campaignDiscountRate).toBeCloseTo(0.05, 5);
    expect(result.achievementBonusRate).toBeCloseTo(0.004, 5);
    expect(result.appliedDiscountAmount).toBe(154000); // 1,000,000 × 0.154
    expect(result.finalBillingAmount).toBe(846000); // 1,000,000 - 154,000

    // 【複数割引ルール組み合わせパターン検証】
    // パターン2: 達成率が高く、複数割引ルールが最大値に近づくケース
    const contractCondition2 = {
      contractId: "CONTRACT-20240115-002",
      contractPeriodStart: new Date("2024-01-01"),
      contractPeriodEnd: new Date("2024-12-31"),
      contractAmount: 500000,
      customerCategory: "enterprise",
      baseDiscountRate: 0.15, // 基本割引率：15%
      campaignCode: "CAMPAIGN-2024-Q1",
    };

    const performanceData2 = {
      contractId: "CONTRACT-20240115-002",
      reportedSalesAmount: 700000,
      targetAchievementRate: 1.4, // 達成率：140%
      campaignParticipationStatus: "active",
      reportPeriod: "2024-Q1",
    };

    const result2 = applyDiscountAndCampaignRules({
      contractCondition: contractCondition2,
      performanceData: performanceData2,
      campaignRuleSet,
    });

    // 期待される計算結果
    // 基本割引率: 15%
    // + キャンペーン割引率: 5%
    // + 達成率ボーナス（140% - 100% = 40% → 40% × 2% = 0.8%）: 0.8%
    // = 小計: 20.8%
    // 最大累積割引率 20% で制限: 20.0% が適用
    const expectedTotalDiscountRate2 = 0.2; // 20% (最大値に制限)

    expect(result2.isApplicable).toBe(true);
    expect(result2.contractConditionMatch).toBe(true);
    expect(result2.performanceDataMatch).toBe(true);
    expect(result2.totalDiscountRate).toBeCloseTo(expectedTotalDiscountRate2, 5);
    expect(result2.appliedDiscountAmount).toBe(100000); // 500,000 × 0.2
    expect(result2.finalBillingAmount).toBe(400000); // 500,000 - 100,000

    // 【パターン3: 達成率が閾値未満の場合、ボーナス不適用】
    const performanceData3 = {
      contractId: "CONTRACT-20240115-001",
      reportedSalesAmount: 800000,
      targetAchievementRate: 0.8, // 達成率：80% (閾値 100% 未満)
      campaignParticipationStatus: "active",
      reportPeriod: "2024-Q1",
    };

    const result3 = applyDiscountAndCampaignRules({
      contractCondition,
      performanceData: performanceData3,
      campaignRuleSet,
    });

    // 期待される計算結果
    // 基本割引率: 10%
    // + キャンペーン割引率: 5%
    // + 達成率ボーナス: 0% (閾値未満)
    // = 小計: 15%
    const expectedTotalDiscountRate3 = 0.15; // 15%

    expect(result3.isApplicable).toBe(true);
    expect(result3.totalDiscountRate).toBeCloseTo(expectedTotalDiscountRate3, 5);
    expect(result3.achievementBonusRate).toBeCloseTo(0.0, 5);
    expect(result3.appliedDiscountAmount).toBe(150000); // 1,000,000 × 0.15
    expect(result3.finalBillingAmount).toBe(850000); // 1,000,000 - 150,000

    // 【パターン4: キャンペーン非参加の場合】
    const performanceData4 = {
      contractId: "CONTRACT-20240115-001",
      reportedSalesAmount: 1200000,
      targetAchievementRate: 1.2,
      campaignParticipationStatus: "inactive", // キャンペーン非参加
      reportPeriod: "2024-Q1",
    };

    const result4 = applyDiscountAndCampaignRules({
      contractCondition,
      performanceData: performanceData4,
      campaignRuleSet,
    });

    // 期待される計算結果
    // 基本割引率: 10%
    // + キャンペーン割引率: 0% (非参加)
    // + 達成率ボーナス: 0% (キャンペーン非参加のため不適用)
    // = 小計: 10%
    const expectedTotalDiscountRate4 = 0.1; // 10%

    expect(result4.isApplicable).toBe(true);
    expect(result4.totalDiscountRate).toBeCloseTo(expectedTotalDiscountRate4, 5);
    expect(result4.campaignDiscountRate).toBeCloseTo(0.0, 5);
    expect(result4.achievementBonusRate).toBeCloseTo(0.0, 5);
    expect(result4.appliedDiscountAmount).toBe(100000); // 1,000,000 × 0.1
    expect(result4.finalBillingAmount).toBe(900000); // 1,000,000 - 100,000
  });
});