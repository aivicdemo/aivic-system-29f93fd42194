import { calculateAccuracyIndicatorsByAssessor } from "../../src/logic/it-6-2-1-1";

describe("査定担当者別・工種別・金額帯別の判定精度指標の自動集計と可視化", () => {
  // SCEN-1369: [edge] 他部署フォーマット相場判定精度測定機能 - 乖離率が0%と100%の境界値で合格判定の判定基準が正確に適用される
  test("乖離率0%と100%の境界値で合格判定基準が正確に適用される", () => {
    // 乖離率0%のテストケース
    const testCase0Percent = {
      assessor_id: "ASSESSOR_001",
      construction_type: "RC造",
      amount_range: "1000万～5000万",
      deviation_rate_percent: 0.0,
      reference_data_count: 45,
      sample_count: 150,
    };

    const result0Percent = calculateAccuracyIndicatorsByAssessor(testCase0Percent);

    // 乖離率0%は最高精度（合格）
    expect(result0Percent.deviation_rate_percent).toBe(0.0);
    expect(result0Percent.accuracy_level).toBe("PASS");
    expect(result0Percent.accuracy_score).toBe(100);

    // 乖離率100%のテストケース
    const testCase100Percent = {
      assessor_id: "ASSESSOR_001",
      construction_type: "RC造",
      amount_range: "1000万～5000万",
      deviation_rate_percent: 100.0,
      reference_data_count: 45,
      sample_count: 150,
    };

    const result100Percent = calculateAccuracyIndicatorsByAssessor(testCase100Percent);

    // 乖離率100%は完全外れ（不合格）
    expect(result100Percent.deviation_rate_percent).toBe(100.0);
    expect(result100Percent.accuracy_level).toBe("FAIL");
    expect(result100Percent.accuracy_score).toBe(0);

    // 境界値前後のテストケース（99.9%）
    const testCase99Point9Percent = {
      assessor_id: "ASSESSOR_001",
      construction_type: "RC造",
      amount_range: "1000万～5000万",
      deviation_rate_percent: 99.9,
      reference_data_count: 45,
      sample_count: 150,
    };

    const result99Point9Percent = calculateAccuracyIndicatorsByAssessor(testCase99Point9Percent);

    // 99.9%は不合格（閾値90%以上で不合格）
    expect(result99Point9Percent.deviation_rate_percent).toBe(99.9);
    expect(result99Point9Percent.accuracy_level).toBe("FAIL");
    expect(result99Point9Percent.accuracy_score).toBe(0);

    // 境界値前後のテストケース（100.1%）
    const testCase100Point1Percent = {
      assessor_id: "ASSESSOR_001",
      construction_type: "RC造",
      amount_range: "1000万～5000万",
      deviation_rate_percent: 100.1,
      reference_data_count: 45,
      sample_count: 150,
    };

    const result100Point1Percent = calculateAccuracyIndicatorsByAssessor(testCase100Point1Percent);

    // 100.1%も不合格
    expect(result100Point1Percent.deviation_rate_percent).toBe(100.1);
    expect(result100Point1Percent.accuracy_level).toBe("FAIL");
    expect(result100Point1Percent.accuracy_score).toBe(0);

    // 合格判定の閾値確認（乖離率10%未満で合格）
    const testCasePassThreshold = {
      assessor_id: "ASSESSOR_001",
      construction_type: "RC造",
      amount_range: "1000万～5000万",
      deviation_rate_percent: 9.9,
      reference_data_count: 45,
      sample_count: 150,
    };

    const resultPassThreshold = calculateAccuracyIndicatorsByAssessor(testCasePassThreshold);

    // 9.9%は合格（閾値10%以下）
    expect(resultPassThreshold.deviation_rate_percent).toBe(9.9);
    expect(resultPassThreshold.accuracy_level).toBe("PASS");
    expect(resultPassThreshold.accuracy_score).toBe(99);

    // 不合格判定の閾値確認（乖離率10%以上で不合格）
    const testCaseFailThreshold = {
      assessor_id: "ASSESSOR_001",
      construction_type: "RC造",
      amount_range: "1000万～5000万",
      deviation_rate_percent: 10.0,
      reference_data_count: 45,
      sample_count: 150,
    };

    const resultFailThreshold = calculateAccuracyIndicatorsByAssessor(testCaseFailThreshold);

    // 10.0%は不合格（閾値10%以上）
    expect(resultFailThreshold.deviation_rate_percent).toBe(10.0);
    expect(resultFailThreshold.accuracy_level).toBe("FAIL");
    expect(resultFailThreshold.accuracy_score).toBe(90);

    // 複数の工種・金額帯での検証
    const testCaseMultiple = {
      assessor_id: "ASSESSOR_002",
      construction_type: "鉄骨造",
      amount_range: "5000万～1億",
      deviation_rate_percent: 0.0,
      reference_data_count: 38,
      sample_count: 120,
    };

    const resultMultiple = calculateAccuracyIndicatorsByAssessor(testCaseMultiple);

    // 異なる工種・金額帯でも乖離率0%なら合格
    expect(resultMultiple.deviation_rate_percent).toBe(0.0);
    expect(resultMultiple.accuracy_level).toBe("PASS");
    expect(resultMultiple.accuracy_score).toBe(100);
    expect(resultMultiple.construction_type).toBe("鉄骨造");
    expect(resultMultiple.amount_range).toBe("5000万～1億");

    // 境界値ロジックの一貫性確認
    // 0%～9.9%は合格、10%～100%は不合格
    const boundaryTestCases = [
      { rate: 0.0, expected_level: "PASS" },
      { rate: 5.0, expected_level: "PASS" },
      { rate: 9.9, expected_level: "PASS" },
      { rate: 10.0, expected_level: "FAIL" },
      { rate: 50.0, expected_level: "FAIL" },
      { rate: 100.0, expected_level: "FAIL" },
    ];

    boundaryTestCases.forEach((testCase) => {
      const result = calculateAccuracyIndicatorsByAssessor({
        assessor_id: "ASSESSOR_TEST",
        construction_type: "テスト工種",
        amount_range: "テスト金額帯",
        deviation_rate_percent: testCase.rate,
        reference_data_count: 50,
        sample_count: 200,
      });

      expect(result.accuracy_level).toBe(testCase.expected_level);
      expect(result.deviation_rate_percent).toBe(testCase.rate);
    });
  });
});