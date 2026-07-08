import { calculateExpectedEffectFor700NamekiScale } from '../../src/logic/it-6-2-2-1';

describe('展開可能性判定と期待効果の定量抽出 - 700名規模展開', () => {
  test('SCEN-1316: 700名規模展開時の期待効果（総処理時間短縮、人員配置最適化による削減人数）が正確に計算される', () => {
    // ========== テストケース 1: 基本ケース ==========
    // 前提条件：
    // - 初期30名運用での平均処理時間：40分/件
    // - 初期30名の月間総処理件数：600件
    // - 初期30名の月間総処理時間：600件 × 40分 = 24,000分
    // - 1人あたり月間平均処理時間：24,000分 ÷ 30人 = 800分

    const initialSetupInput_1 = {
      currentPersonnelCount: 30,
      averageProcessingTimePerCaseInMinutes: 40,
      monthlyTotalCasesProcessed: 600,
      targetExpansionScale: 700,
    };

    // 700名規模展開の計算ロジック：
    // - 700名での必要処理能力 = 初期30名比の人員増加率 = 700 / 30 = 23.33倍
    // - 700名規模での月間総処理能力 = 600件 × 23.33 = 14,000件
    // - 700名での1人あたり平均処理時間（効率改善を加味）= 40分 × (30/700) × 効率係数
    // 簡略化：700名規模では同じ処理時間40分で、月間14,000件を処理可能
    // - 700名規模での月間総処理時間 = 14,000件 × 40分 = 560,000分
    // - 初期30名での月間総処理時間 = 600件 × 40分 = 24,000分
    // 
    // 期待効果の計算：
    // 総処理時間短縮 = 24,000分 - 14,000分 × (40分/件) ÷ 70名相当削減による効率化
    // 簡略計算（1人あたり月間処理能力が線形スケール）：
    // - 初期1人あたり月間処理件数 = 600件 ÷ 30人 = 20件/人
    // - 700名規模での月間処理件数 = 20件/人 × 700人 = 14,000件
    // - 実務効率を加味した削減人員 = 700人 - (600件 × 30人) ÷ (600件) = 700人 - 30人 = 670人削減相当
    // 実際の期待効果：
    // 総処理時間短縮量（分） = (600件 × 40分) - (600件 × 40分 × 30/700) = 24,000 - 1,028.57 ≈ 22,971分
    // 削減人数 = 700人 - (600件 × 30人) ÷ 600件 = 700人 - 30人 = 670人

    const result_1 = calculateExpectedEffectFor700NamekiScale(initialSetupInput_1);

    // 検証：総処理時間短縮量
    // 計算式：総処理時間短縮 = 初期月間総処理時間 - (初期月間総処理時間 × 初期人員数 / 展開人員数)
    // = 24,000 - (24,000 × 30 / 700) = 24,000 - 1,028.57 ≈ 22,971.43分
    expect(result_1.totalProcessingTimeSavingsInMinutes).toBeCloseTo(22971.43, 0);

    // 検証：人員配置最適化による削減人数
    // 計算式：削減人数 = 展開人員数 - (初期人員数)
    // ただし効率改善を加味すると：削減人数 = 700 - 30 = 670人
    expect(result_1.optimizedPersonnelReductionCount).toBe(670);

    // ========== テストケース 2: 処理時間が長い場合 ==========
    const initialSetupInput_2 = {
      currentPersonnelCount: 30,
      averageProcessingTimePerCaseInMinutes: 60,
      monthlyTotalCasesProcessed: 400,
      targetExpansionScale: 700,
    };

    // 計算：
    // - 初期月間総処理時間 = 400件 × 60分 = 24,000分
    // - 700名規模での月間総処理時間短縮 = 24,000 - (24,000 × 30 / 700) = 22,971.43分
    const result_2 = calculateExpectedEffectFor700NamekiScale(initialSetupInput_2);

    expect(result_2.totalProcessingTimeSavingsInMinutes).toBeCloseTo(22971.43, 0);
    expect(result_2.optimizedPersonnelReductionCount).toBe(670);

    // ========== テストケース 3: 少人数初期運用 ==========
    const initialSetupInput_3 = {
      currentPersonnelCount: 20,
      averageProcessingTimePerCaseInMinutes: 45,
      monthlyTotalCasesProcessed: 500,
      targetExpansionScale: 700,
    };

    // 計算：
    // - 初期月間総処理時間 = 500件 × 45分 = 22,500分
    // - 700名規模での効率性を考慮した削減人数 = 700 - 20 = 680人
    // - 総処理時間短縮 = 22,500 - (22,500 × 20 / 700) = 22,500 - 642.86 ≈ 21,857.14分
    const result_3 = calculateExpectedEffectFor700NamekiScale(initialSetupInput_3);

    expect(result_3.totalProcessingTimeSavingsInMinutes).toBeCloseTo(21857.14, 0);
    expect(result_3.optimizedPersonnelReductionCount).toBe(680);

    // ========== テストケース 4: 大規模月間処理件数 ==========
    const initialSetupInput_4 = {
      currentPersonnelCount: 30,
      averageProcessingTimePerCaseInMinutes: 35,
      monthlyTotalCasesProcessed: 1200,
      targetExpansionScale: 700,
    };

    // 計算：
    // - 初期月間総処理時間 = 1200件 × 35分 = 42,000分
    // - 700名規模での総処理時間短縮 = 42,000 - (42,000 × 30 / 700) = 42,000 - 1,800 = 40,200分
    const result_4 = calculateExpectedEffectFor700NamekiScale(initialSetupInput_4);

    expect(result_4.totalProcessingTimeSavingsInMinutes).toBeCloseTo(40200, 0);
    expect(result_4.optimizedPersonnelReductionCount).toBe(670);

    // ========== テストケース 5: 一貫性検証 ==========
    // 同じ入力で再度計算して一貫性を確認
    const result_1_recheck = calculateExpectedEffectFor700NamekiScale(initialSetupInput_1);
    expect(result_1_recheck.totalProcessingTimeSavingsInMinutes).toBeCloseTo(
      result_1.totalProcessingTimeSavingsInMinutes,
      5
    );
    expect(result_1_recheck.optimizedPersonnelReductionCount).toBe(
      result_1.optimizedPersonnelReductionCount
    );

    // ========== テストケース 6: 計算式の妥当性検証 ==========
    // 総処理時間短縮 = 初期月間総処理時間 - (初期月間総処理時間 × 初期人員数 / 展開人員数)
    const input_validation = {
      currentPersonnelCount: 30,
      averageProcessingTimePerCaseInMinutes: 50,
      monthlyTotalCasesProcessed: 750,
      targetExpansionScale: 700,
    };

    const result_validation = calculateExpectedEffectFor700NamekiScale(input_validation);

    // 手動計算：
    // - 初期月間総処理時間 = 750件 × 50分 = 37,500分
    // - 総処理時間短縮 = 37,500 - (37,500 × 30 / 700) = 37,500 - 1,607.14 ≈ 35,892.86分
    const expectedSavings = 37500 - (37500 * 30) / 700;
    expect(result_validation.totalProcessingTimeSavingsInMinutes).toBeCloseTo(expectedSavings, 0);

    // 削減人数の計算式検証：削減人数 = 展開人員数 - 初期人員数
    // = 700 - 30 = 670人
    expect(result_validation.optimizedPersonnelReductionCount).toBe(700 - 30);

    // ========== エラーケース ==========
    // 無効な人員数
    expect(() =>
      calculateExpectedEffectFor700NamekiScale({
        currentPersonnelCount: 0,
        averageProcessingTimePerCaseInMinutes: 40,
        monthlyTotalCasesProcessed: 600,
        targetExpansionScale: 700,
      })
    ).toThrow(/人員数/);

    // 無効な処理時間
    expect(() =>
      calculateExpectedEffectFor700NamekiScale({
        currentPersonnelCount: 30,
        averageProcessingTimePerCaseInMinutes: -10,
        monthlyTotalCasesProcessed: 600,
        targetExpansionScale: 700,
      })
    ).toThrow(/処理時間/);

    // 無効な月間総処理件数
    expect(() =>
      calculateExpectedEffectFor700NamekiScale({
        currentPersonnelCount: 30,
        averageProcessingTimePerCaseInMinutes: 40,
        monthlyTotalCasesProcessed: 0,
        targetExpansionScale: 700,
      })
    ).toThrow(/処理件数/);

    // 無効な展開規模（初期人員数より小さい）
    expect(() =>
      calculateExpectedEffectFor700NamekiScale({
        currentPersonnelCount: 30,
        averageProcessingTimePerCaseInMinutes: 40,
        monthlyTotalCasesProcessed: 600,
        targetExpansionScale: 20,
      })
    ).toThrow(/展開規模/);
  });
});