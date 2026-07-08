import { evaluateExpansionFeasibility } from "../../src/logic/it-6-2-2-1";

describe("展開可能性判定と期待効果の定量抽出", () => {
  // SCEN-1318: [edge] 展開可能性判定と期待効果の定量抽出 - OCR精度低下リスクが5%以上の場合、警告フラグが正確に設定される
  test("OCR精度低下リスクが閾値5%で正確に警告フラグを制御する", () => {
    // ========== ケース1: OCR精度低下リスク = 5.0% (閾値境界値、警告あり) ==========
    const testCase1Input = {
      ocrAccuracyDeclineRiskPercent: 5.0,
      initialOperationOcrAccuracy: 95.5,
      initialOperationAiJudgmentAccuracy: 92.3,
      initialOperationProcessingTimeReductionPercent: 28.5,
      initialOperationQualityUniformityIndex: 87.2,
      initialOperationSystemUptimePercent: 99.8,
      expansionTargetDepartmentCount: 5,
      learningDataPreparationDaysEstimate: 21,
    };

    const result1 = evaluateExpansionFeasibility(testCase1Input);
    
    expect(result1.warningFlagOcrDeclineRisk).toBe(true);
    expect(result1.ocrAccuracyDeclineRiskPercent).toBe(5.0);
    expect(result1.shouldExpand).toBe(true);
    expect(typeof result1.expectedEffectProcessingTimeReductionPercent).toBe(
      "number"
    );
    expect(typeof result1.expectedEffectQualityUniformityImprovement).toBe(
      "number"
    );

    // ========== ケース2: OCR精度低下リスク = 5.1% (閾値超過、警告あり) ==========
    const testCase2Input = {
      ocrAccuracyDeclineRiskPercent: 5.1,
      initialOperationOcrAccuracy: 95.5,
      initialOperationAiJudgmentAccuracy: 92.3,
      initialOperationProcessingTimeReductionPercent: 28.5,
      initialOperationQualityUniformityIndex: 87.2,
      initialOperationSystemUptimePercent: 99.8,
      expansionTargetDepartmentCount: 5,
      learningDataPreparationDaysEstimate: 21,
    };

    const result2 = evaluateExpansionFeasibility(testCase2Input);
    
    expect(result2.warningFlagOcrDeclineRisk).toBe(true);
    expect(result2.ocrAccuracyDeclineRiskPercent).toBe(5.1);
    expect(result2.shouldExpand).toBe(true);
    expect(typeof result2.expectedEffectProcessingTimeReductionPercent).toBe(
      "number"
    );
    expect(typeof result2.expectedEffectQualityUniformityImprovement).toBe(
      "number"
    );

    // ========== ケース3: OCR精度低下リスク = 4.9% (閾値未満、警告なし) ==========
    const testCase3Input = {
      ocrAccuracyDeclineRiskPercent: 4.9,
      initialOperationOcrAccuracy: 95.5,
      initialOperationAiJudgmentAccuracy: 92.3,
      initialOperationProcessingTimeReductionPercent: 28.5,
      initialOperationQualityUniformityIndex: 87.2,
      initialOperationSystemUptimePercent: 99.8,
      expansionTargetDepartmentCount: 5,
      learningDataPreparationDaysEstimate: 21,
    };

    const result3 = evaluateExpansionFeasibility(testCase3Input);
    
    expect(result3.warningFlagOcrDeclineRisk).toBe(false);
    expect(result3.ocrAccuracyDeclineRiskPercent).toBe(4.9);
    expect(result3.shouldExpand).toBe(true);
    expect(typeof result3.expectedEffectProcessingTimeReductionPercent).toBe(
      "number"
    );
    expect(typeof result3.expectedEffectQualityUniformityImprovement).toBe(
      "number"
    );

    // ========== 3つのテストケースの比較検証 ==========
    // ケース1とケース2は警告フラグが true（閾値5%以上）
    expect(result1.warningFlagOcrDeclineRisk).toBe(
      result2.warningFlagOcrDeclineRisk
    );
    expect(result1.warningFlagOcrDeclineRisk).toBe(true);

    // ケース1とケース3の警告フラグは異なる（5%以上と未満の分岐）
    expect(result1.warningFlagOcrDeclineRisk).not.toBe(
      result3.warningFlagOcrDeclineRisk
    );
    expect(result3.warningFlagOcrDeclineRisk).toBe(false);

    // すべてのケースで期待効果データが存在すること
    expect(result1.expectedEffectProcessingTimeReductionPercent).toBeGreaterThanOrEqual(
      0
    );
    expect(result1.expectedEffectQualityUniformityImprovement).toBeGreaterThanOrEqual(
      0
    );
    expect(result2.expectedEffectProcessingTimeReductionPercent).toBeGreaterThanOrEqual(
      0
    );
    expect(result2.expectedEffectQualityUniformityImprovement).toBeGreaterThanOrEqual(
      0
    );
    expect(result3.expectedEffectProcessingTimeReductionPercent).toBeGreaterThanOrEqual(
      0
    );
    expect(result3.expectedEffectQualityUniformityImprovement).toBeGreaterThanOrEqual(
      0
    );

    // 閾値判定が正確に機能していることを確認
    const allWarningFlagsCorrect =
      result1.warningFlagOcrDeclineRisk === true &&
      result2.warningFlagOcrDeclineRisk === true &&
      result3.warningFlagOcrDeclineRisk === false;
    expect(allWarningFlagsCorrect).toBe(true);
  });
});