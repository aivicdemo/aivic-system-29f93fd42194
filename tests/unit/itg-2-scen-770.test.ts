import { generatePersonnelScenarios } from "../../src/logic/it-6-2-1-1";

describe("査定担当者別・工種別・金額帯別の判定精度指標の自動集計と可視化", () => {
  test("SCEN-770: 人員配置シナリオの複数案自動生成機能 - 必要人員数と応援要請のタイミングが正確に提示される", () => {
    // 初期パラメータ設定
    const assessmentCaseCount = 450; // 査定案件件数
    const assessmentDeadlineDays = 30; // 査定期限（日数）
    const assessmentDifficultyFactor = 1.2; // 査定難度係数
    const currentStaffCount = 30; // 現在の人員体制（査定員数）
    const experiencedStaffRatio = 0.6; // 経験者の比率

    // 査定処理能力の基礎データ
    const avgProcessingTimeMinutes = 18; // 平均処理時間（分）
    const workingHoursPerDay = 7; // 1日の査定作業時間（時間）
    const workingDaysPerMonth = 22; // 月間稼働日数

    // 業務負荷計算
    // 必要総処理時間 = 450件 × 18分 = 8,100分
    const totalProcessingTimeMinutes = assessmentCaseCount * avgProcessingTimeMinutes;
    // 必要総処理時間（時間） = 8,100分 ÷ 60 = 135時間
    const totalProcessingTimeHours = totalProcessingTimeMinutes / 60;
    // 査定難度補正 = 135時間 × 1.2 = 162時間
    const adjustedProcessingHours =
      totalProcessingTimeHours * assessmentDifficultyFactor;
    // 期間内総作業時間（時間） = 30日 × 7時間/日 = 210時間
    const availableWorkingHours = assessmentDeadlineDays * workingHoursPerDay;
    // 期間内総作業時間（全体） = 210時間 × 30人 = 6,300時間
    const totalAvailableCapacity = availableWorkingHours * currentStaffCount;

    // シナリオ生成の入力パラメータ
    const input = {
      assessmentCaseCount,
      assessmentDeadlineDays,
      assessmentDifficultyFactor,
      currentStaffCount,
      experiencedStaffRatio,
      avgProcessingTimeMinutes,
      workingHoursPerDay,
      workingDaysPerMonth,
    };

    // 関数実行
    const result = generatePersonnelScenarios(input);

    // =====================================================
    // 期待値計算
    // =====================================================

    // シナリオ1: 通常期対応シナリオ
    // 必要人員数（通常期） = 補正処理時間 ÷ 期間内1人あたり作業時間
    // = 162時間 ÷ (30日 × 7時間/日) = 162 ÷ 210 ≈ 0.771
    // 実際の必要人員数（小数点以下切り上げ） = 1人
    // ただしバッファ（10%）を加算して実運用では必要人員 ≈ 1人（通常30人で対応可能）
    const normalScenarioNeededStaff = 0; // 現在の30人で対応可能なため応援不要
    const normalScenarioSupportTiming = null; // 応援要請なし

    // シナリオ2: 中繁忙期対応シナリオ
    // 処理効率を15%低下させた場合のシミュレーション
    // 調整処理時間 = 162時間 ÷ 0.85 ≈ 190.6時間
    // 必要人員数 = 190.6時間 ÷ 210時間 ≈ 0.908
    // 実際の必要人員数 = 1人（バッファ考慮で追加対応検討）
    const mediumBusyScenarioNeededStaff = 1; // 応援要員1名追加が望ましい
    const mediumBusyScenarioSupportTiming = 5; // 事前通知：開始日の5営業日前

    // シナリオ3: 繁忙期対応シナリオ
    // 処理効率を30%低下させた場合のシミュレーション
    // 調整処理時間 = 162時間 ÷ 0.70 ≈ 231.4時間
    // 必要人員数 = 231.4時間 ÷ 210時間 ≈ 1.101
    // 実際の必要人員数 = 2人（端数切り上げ + バッファ）
    const busyScenarioNeededStaff = 2; // 応援要員2名追加が必要
    const busyScenarioSupportTiming = 10; // 事前通知：開始日の10営業日前

    // =====================================================
    // アサーション: 結果構造の検証
    // =====================================================

    // 結果の型チェック
    expect(result).toBeDefined();
    expect(Array.isArray(result.scenarios)).toBe(true);
    expect(result.scenarios.length).toBe(3); // 3シナリオが生成される

    // シナリオ1の検証
    const scenario1 = result.scenarios[0];
    expect(scenario1.scenarioName).toBe("通常期対応シナリオ");
    expect(scenario1.requiredAdditionalStaff).toBe(normalScenarioNeededStaff);
    expect(scenario1.supportRequestDaysInAdvance).toBe(
      normalScenarioSupportTiming
    );
    expect(scenario1.totalCapacityHours).toBeLessThanOrEqual(totalAvailableCapacity);
    expect(scenario1.totalCapacityHours).toBeGreaterThan(0);

    // シナリオ2の検証
    const scenario2 = result.scenarios[1];
    expect(scenario2.scenarioName).toBe("中繁忙期対応シナリオ");
    expect(scenario2.requiredAdditionalStaff).toBe(mediumBusyScenarioNeededStaff);
    expect(scenario2.supportRequestDaysInAdvance).toBe(
      mediumBusyScenarioSupportTiming
    );
    expect(scenario2.totalCapacityHours).toBeGreaterThan(
      scenario1.totalCapacityHours
    );

    // シナリオ3の検証
    const scenario3 = result.scenarios[2];
    expect(scenario3.scenarioName).toBe("繁忙期対応シナリオ");
    expect(scenario3.requiredAdditionalStaff).toBe(busyScenarioNeededStaff);
    expect(scenario3.supportRequestDaysInAdvance).toBe(
      busyScenarioSupportTiming
    );
    expect(scenario3.totalCapacityHours).toBeGreaterThan(
      scenario2.totalCapacityHours
    );

    // =====================================================
    // 必要人員数の精度検証
    // =====================================================

    // シナリオ1: 通常期は既存人員で対応可能
    expect(scenario1.requiredAdditionalStaff).toBeLessThanOrEqual(0);

    // シナリオ2: 中繁忙期は追加1名が必要
    expect(scenario2.requiredAdditionalStaff).toBeGreaterThan(
      scenario1.requiredAdditionalStaff
    );
    expect(scenario2.requiredAdditionalStaff).toBeLessThanOrEqual(2);

    // シナリオ3: 繁忙期は追加2名が必要
    expect(scenario3.requiredAdditionalStaff).toBeGreaterThanOrEqual(2);

    // =====================================================
    // 応援要請タイミングの検証
    // =====================================================

    // 事前通知のタイミングは、応援が不要なシナリオではnull
    if (scenario1.requiredAdditionalStaff === 0) {
      expect(scenario1.supportRequestDaysInAdvance).toBeNull();
    } else {
      expect(scenario1.supportRequestDaysInAdvance).toBeGreaterThan(0);
    }

    // 繁忙度が高いほど、より早期の通知が必要
    if (
      scenario2.supportRequestDaysInAdvance !== null &&
      scenario3.supportRequestDaysInAdvance !== null
    ) {
      expect(scenario3.supportRequestDaysInAdvance).toBeGreaterThanOrEqual(
        scenario2.supportRequestDaysInAdvance
      );
    }

    // =====================================================
    // 複数案の比較可能性の検証
    // =====================================================

    // 各シナリオが適切な詳細情報を含むことを確認
    for (const scenario of result.scenarios) {
      expect(scenario.scenarioName).toBeDefined();
      expect(typeof scenario.scenarioName).toBe("string");

      expect(scenario.requiredAdditionalStaff).toBeDefined();
      expect(typeof scenario.requiredAdditionalStaff).toBe("number");
      expect(scenario.requiredAdditionalStaff).toBeGreaterThanOrEqual(-1);

      expect(scenario.totalCapacityHours).toBeDefined();
      expect(typeof scenario.totalCapacityHours).toBe("number");
      expect(scenario.totalCapacityHours).toBeGreaterThan(0);

      expect(scenario.processEfficiencyRatio).toBeDefined();
      expect(typeof scenario.processEfficiencyRatio).toBe("number");
      expect(scenario.processEfficiencyRatio).toBeGreaterThan(0);
      expect(scenario.processEfficiencyRatio).toBeLessThanOrEqual(1);

      // supportRequestDaysInAdvanceはnullまたは正の整数
      if (scenario.supportRequestDaysInAdvance !== null) {
        expect(typeof scenario.supportRequestDaysInAdvance).toBe("number");
        expect(scenario.supportRequestDaysInAdvance).toBeGreaterThan(0);
      }
    }

    // =====================================================
    // 全体的な妥当性検証
    // =====================================================

    // 必要な処理を期間内で完了可能であることを確認
    const maxCapacityNeeded = Math.max(
      ...result.scenarios.map((s) => s.totalCapacityHours)
    );
    // 繁忙期シナリオでも、現有人員にわずかな応援を加えれば対応可能な範囲に収まる
    expect(maxCapacityNeeded).toBeLessThanOrEqual(totalAvailableCapacity * 1.15);

    // 結果に必要な集計データが含まれていることを確認
    expect(result.totalRequestedCases).toBe(assessmentCaseCount);
    expect(result.totalRequestedCases).toBeGreaterThan(0);
    expect(result.baselineStaffCount).toBe(currentStaffCount);
    expect(result.planningDeadlineDays).toBe(assessmentDeadlineDays);
  });
});