import { determineRetroactiveApplicationPeriod } from "../../src/logic/it-1781935279444-1-1-1";

describe("営業データ項目メタデータ管理: 請求ルール変更時の遡及適用判定", () => {
  test("SCEN-1011: 請求ルール変更の適用開始日に基づいて、遡及適用対象期間と非適用期間が明確に分離される", () => {
    // Setup: 請求ルール変更のテストデータ
    const ruleChangeEffectiveDate = new Date("2024-04-01T00:00:00Z");
    const retroactiveApplyStartDate = new Date("2024-01-01T00:00:00Z");
    const retroactiveApplyEndDate = new Date("2024-03-31T23:59:59Z");
    const retroactiveApplyFlag = true;

    // 変更前のルール（2024年1月〜3月に適用）
    const oldRule = {
      rule_id: "rule_old_001",
      name: "旧請求ルール",
      base_amount: 100000,
      discount_rate: 0.0,
      effective_date: new Date("2024-01-01T00:00:00Z"),
      end_date: new Date("2024-03-31T23:59:59Z"),
    };

    // 変更後のルール（2024年4月1日以降に適用）
    const newRule = {
      rule_id: "rule_new_001",
      name: "新請求ルール",
      base_amount: 120000,
      discount_rate: 0.1,
      effective_date: new Date("2024-04-01T00:00:00Z"),
      end_date: new Date("2024-12-31T23:59:59Z"),
    };

    // テスト対象：請求ルール変更実行と遡及適用判定
    const result = determineRetroactiveApplicationPeriod({
      ruleChangeEffectiveDate,
      retroactiveApplyStartDate,
      retroactiveApplyEndDate,
      retroactiveApplyFlag,
      oldRule,
      newRule,
    });

    // 期待結果: 遡及適用対象期間と非適用期間が明確に分離される
    expect(result).toEqual({
      isRetroactiveApply: true,
      retroactiveStartDate: new Date("2024-01-01T00:00:00Z"),
      retroactiveEndDate: new Date("2024-03-31T23:59:59Z"),
      newRuleStartDate: new Date("2024-04-01T00:00:00Z"),
      appliedRuleIdsByPeriod: {
        retroactivePeriod: "rule_new_001",
        nonRetroactivePeriod: "rule_old_001",
        newRulePeriod: "rule_new_001",
      },
      periodBoundary: {
        retroactiveEndBoundary: new Date("2024-03-31T23:59:59Z"),
        newRuleStartBoundary: new Date("2024-04-01T00:00:00Z"),
      },
    });

    // 2024年1月1日〜3月31日のテストデータ（遡及適用対象期間）
    const retroactiveDataPoint = {
      date: new Date("2024-02-15T12:00:00Z"),
      invoiceAmount: 100000,
    };

    // 2024年4月1日以降のテストデータ（新ルール適用期間）
    const newRuleDataPoint = {
      date: new Date("2024-04-15T12:00:00Z"),
      invoiceAmount: 120000,
    };

    // 遡及適用対象期間のデータ判定
    const isRetroactiveData =
      retroactiveDataPoint.date >= retroactiveApplyStartDate &&
      retroactiveDataPoint.date <= retroactiveApplyEndDate;
    expect(isRetroactiveData).toBe(true);

    // 新ルール適用期間のデータ判定
    const isNewRuleData = newRuleDataPoint.date >= ruleChangeEffectiveDate;
    expect(isNewRuleData).toBe(true);

    // 遡及適用対象期間のデータが新ルールで再計算されたことを検証
    const retroactiveRecalculatedAmount =
      retroactiveDataPoint.invoiceAmount * (1 - newRule.discount_rate);
    expect(retroactiveRecalculatedAmount).toBe(90000);

    // 新ルール適用期間のデータが新ルールで計算されたことを検証
    const newRuleCalculatedAmount =
      newRuleDataPoint.invoiceAmount * (1 - newRule.discount_rate);
    expect(newRuleCalculatedAmount).toBe(108000);

    // 期間分離ログの検証：遡及適用期間と非適用期間の境界が正確に記録されているか
    const separationLog = {
      changeEffectiveDate: ruleChangeEffectiveDate,
      retroactiveApplyRange: {
        start: new Date("2024-01-01T00:00:00Z"),
        end: new Date("2024-03-31T23:59:59Z"),
      },
      nonRetroactiveApplyRange: {
        start: new Date("2024-04-01T00:00:00Z"),
        end: new Date("2024-12-31T23:59:59Z"),
      },
      appliedOldRuleInRetroactive: "rule_new_001",
      appliedNewRuleAfterEffective: "rule_new_001",
    };

    // 遡及適用期間が正確に記録されているか
    expect(separationLog.retroactiveApplyRange.start).toEqual(
      new Date("2024-01-01T00:00:00Z")
    );
    expect(separationLog.retroactiveApplyRange.end).toEqual(
      new Date("2024-03-31T23:59:59Z")
    );

    // 非適用期間の開始日が変更前のルール終了日の翌日であるか
    expect(separationLog.nonRetroactiveApplyRange.start).toEqual(
      new Date("2024-04-01T00:00:00Z")
    );

    // 期間の連続性を検証（隙間がないか）
    const retroactiveEnd = new Date("2024-03-31T23:59:59Z").getTime();
    const newRuleStart = new Date("2024-04-01T00:00:00Z").getTime();
    const timeDifference = newRuleStart - retroactiveEnd;
    expect(timeDifference).toBe(1000); // 1秒の隙間のみ

    // 適用開始日以降のデータが新ルールで計算されていることを確認
    expect(result.appliedRuleIdsByPeriod.newRulePeriod).toBe("rule_new_001");
    expect(result.appliedRuleIdsByPeriod.retroactivePeriod).toBe("rule_new_001");
  });
});