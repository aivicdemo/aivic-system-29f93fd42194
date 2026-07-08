import { describe, test, expect } from "@jest/globals";
import { calculateAccuracyImprovementVerification } from "../../src/logic/it-6-2-1-1";

describe("改善対策効果検証 - 査定員別・工種別・金額帯別判定精度指標", () => {
  // SCEN-1268: [normal] 改善対策効果検証機能 - 改善後精度が期待改善率に達した場合、改善効果が十分と判定される
  test("改善後精度が期待改善率以上に達した場合、改善効果が十分と判定される", () => {
    // Arrange
    const input = {
      assessor_id: "ASS-001",
      work_type: "鉄骨工事",
      amount_band: "1000万～5000万円",
      accuracy_before: 80,
      target_improvement_rate: 10,
      accuracy_after: 90.5,
      measurement_date: "2024-02-15T10:30:00Z",
      measurement_count: 150,
    };

    // Act
    const result = calculateAccuracyImprovementVerification(input);

    // Assert
    expect(result).toEqual({
      assessor_id: "ASS-001",
      work_type: "鉄骨工事",
      amount_band: "1000万～5000万円",
      accuracy_before: 80,
      target_improvement_rate: 10,
      accuracy_after: 90.5,
      required_accuracy: 88,
      accuracy_improvement_rate: 10.5,
      verification_status: "合格",
      improvement_judgment: "十分",
      is_adequate: true,
      measurement_date: "2024-02-15T10:30:00Z",
      measurement_count: 150,
      verification_timestamp: "2024-02-15T10:30:00Z",
    });
    expect(result.is_adequate).toBe(true);
    expect(result.improvement_judgment).toBe("十分");
    expect(result.verification_status).toBe("合格");
    expect(result.accuracy_improvement_rate).toBe(10.5);
  });

  // 境界値テスト: 改善後精度が期待改善率と完全に一致する場合
  test("改善後精度が期待改善率と完全に一致する場合、改善効果が十分と判定される", () => {
    const input = {
      assessor_id: "ASS-002",
      work_type: "コンクリート工事",
      amount_band: "5000万円以上",
      accuracy_before: 75,
      target_improvement_rate: 12,
      accuracy_after: 87,
      measurement_date: "2024-02-16T14:00:00Z",
      measurement_count: 200,
    };

    const result = calculateAccuracyImprovementVerification(input);

    expect(result).toEqual({
      assessor_id: "ASS-002",
      work_type: "コンクリート工事",
      amount_band: "5000万円以上",
      accuracy_before: 75,
      target_improvement_rate: 12,
      accuracy_after: 87,
      required_accuracy: 87,
      accuracy_improvement_rate: 12,
      verification_status: "合格",
      improvement_judgment: "十分",
      is_adequate: true,
      measurement_date: "2024-02-16T14:00:00Z",
      measurement_count: 200,
      verification_timestamp: "2024-02-16T14:00:00Z",
    });
    expect(result.is_adequate).toBe(true);
  });

  // エラーテスト: 改善後精度が期待改善率に達しない場合
  test("改善後精度が期待改善率に達しない場合、改善効果が不十分と判定される", () => {
    const input = {
      assessor_id: "ASS-003",
      work_type: "電気工事",
      amount_band: "500万～1000万円",
      accuracy_before: 80,
      target_improvement_rate: 10,
      accuracy_after: 87,
      measurement_date: "2024-02-17T09:15:00Z",
      measurement_count: 120,
    };

    const result = calculateAccuracyImprovementVerification(input);

    expect(result).toEqual({
      assessor_id: "ASS-003",
      work_type: "電気工事",
      amount_band: "500万～1000万円",
      accuracy_before: 80,
      target_improvement_rate: 10,
      accuracy_after: 87,
      required_accuracy: 88,
      accuracy_improvement_rate: 7,
      verification_status: "不合格",
      improvement_judgment: "不十分",
      is_adequate: false,
      measurement_date: "2024-02-17T09:15:00Z",
      measurement_count: 120,
      verification_timestamp: "2024-02-17T09:15:00Z",
    });
    expect(result.is_adequate).toBe(false);
    expect(result.improvement_judgment).toBe("不十分");
    expect(result.verification_status).toBe("不合格");
  });

  // エラーテスト: 改善前精度が無効な値の場合
  test("改善前精度が100を超える場合、例外が発生する", () => {
    const input = {
      assessor_id: "ASS-004",
      work_type: "躯体工事",
      amount_band: "1000万～5000万円",
      accuracy_before: 105,
      target_improvement_rate: 10,
      accuracy_after: 95,
      measurement_date: "2024-02-18T11:00:00Z",
      measurement_count: 100,
    };

    expect(() =>
      calculateAccuracyImprovementVerification(input)
    ).toThrow(/精度/);
  });

  // エラーテスト: 改善後精度が無効な値の場合
  test("改善後精度が負数の場合、例外が発生する", () => {
    const input = {
      assessor_id: "ASS-005",
      work_type: "設備工事",
      amount_band: "500万円未満",
      accuracy_before: 85,
      target_improvement_rate: 8,
      accuracy_after: -5,
      measurement_date: "2024-02-19T13:30:00Z",
      measurement_count: 80,
    };

    expect(() =>
      calculateAccuracyImprovementVerification(input)
    ).toThrow(/精度/);
  });

  // エラーテスト: 期待改善率が負数の場合
  test("期待改善率が負数の場合、例外が発生する", () => {
    const input = {
      assessor_id: "ASS-006",
      work_type: "内装工事",
      amount_band: "1000万～5000万円",
      accuracy_before: 80,
      target_improvement_rate: -5,
      accuracy_after: 88,
      measurement_date: "2024-02-20T15:45:00Z",
      measurement_count: 110,
    };

    expect(() =>
      calculateAccuracyImprovementVerification(input)
    ).toThrow(/改善率/);
  });

  // エラーテスト: 測定件数が0の場合
  test("測定件数が0の場合、例外が発生する", () => {
    const input = {
      assessor_id: "ASS-007",
      work_type: "鉄骨工事",
      amount_band: "5000万円以上",
      accuracy_before: 80,
      target_improvement_rate: 10,
      accuracy_after: 92,
      measurement_date: "2024-02-21T10:00:00Z",
      measurement_count: 0,
    };

    expect(() =>
      calculateAccuracyImprovementVerification(input)
    ).toThrow(/測定件数/);
  });

  // エラーテスト: assessor_id が空文字列の場合
  test("assessor_id が空文字列の場合、例外が発生する", () => {
    const input = {
      assessor_id: "",
      work_type: "コンクリート工事",
      amount_band: "1000万～5000万円",
      accuracy_before: 80,
      target_improvement_rate: 10,
      accuracy_after: 91,
      measurement_date: "2024-02-22T12:00:00Z",
      measurement_count: 140,
    };

    expect(() =>
      calculateAccuracyImprovementVerification(input)
    ).toThrow(/査定員ID/);
  });

  // エラーテスト: work_type が空文字列の場合
  test("work_type が空文字列の場合、例外が発生する", () => {
    const input = {
      assessor_id: "ASS-008",
      work_type: "",
      amount_band: "1000万～5000万円",
      accuracy_before: 80,
      target_improvement_rate: 10,
      accuracy_after: 91,
      measurement_date: "2024-02-23T14:15:00Z",
      measurement_count: 160,
    };

    expect(() =>
      calculateAccuracyImprovementVerification(input)
    ).toThrow(/工種/);
  });

  // 複数の査定員による比較テスト
  test("複数の査定員の改善効果を同時に検証できる", () => {
    const inputs = [
      {
        assessor_id: "ASS-009",
        work_type: "鉄骨工事",
        amount_band: "1000万～5000万円",
        accuracy_before: 78,
        target_improvement_rate: 12,
        accuracy_after: 91,
        measurement_date: "2024-02-24T09:00:00Z",
        measurement_count: 180,
      },
      {
        assessor_id: "ASS-010",
        work_type: "鉄骨工事",
        amount_band: "1000万～5000万円",
        accuracy_before: 82,
        target_improvement_rate: 12,
        accuracy_after: 88,
        measurement_date: "2024-02-24T09:00:00Z",
        measurement_count: 170,
      },
    ];

    const results = inputs.map((input) =>
      calculateAccuracyImprovementVerification(input)
    );

    expect(results[0].is_adequate).toBe(true);
    expect(results[0].improvement_judgment).toBe("十分");
    expect(results[0].accuracy_improvement_rate).toBe(13);

    expect(results[1].is_adequate).toBe(false);
    expect(results[1].improvement_judgment).toBe("不十分");
    expect(results[1].accuracy_improvement_rate).toBe(6);
  });

  // 高精度からのさらなる改善テスト
  test("既に高精度の状態からの改善効果を検証できる", () => {
    const input = {
      assessor_id: "ASS-011",
      work_type: "設備工事",
      amount_band: "5000万円以上",
      accuracy_before: 92,
      target_improvement_rate: 5,
      accuracy_after: 97.5,
      measurement_date: "2024-02-25T16:30:00Z",
      measurement_count: 220,
    };

    const result = calculateAccuracyImprovementVerification(input);

    expect(result).toEqual({
      assessor_id: "ASS-011",
      work_type: "設備工事",
      amount_band: "5000万円以上",
      accuracy_before: 92,
      target_improvement_rate: 5,
      accuracy_after: 97.5,
      required_accuracy: 96.6,
      accuracy_improvement_rate: 5.5,
      verification_status: "合格",
      improvement_judgment: "十分",
      is_adequate: true,
      measurement_date: "2024-02-25T16:30:00Z",
      measurement_count: 220,
      verification_timestamp: "2024-02-25T16:30:00Z",
    });
    expect(result.accuracy_improvement_rate).toBeCloseTo(5.5, 1);
  });

  // 最小精度の改善テスト
  test("低精度からの改善効果を検証できる", () => {
    const input = {
      assessor_id: "ASS-012",
      work_type: "電気工事",
      amount_band: "500万円未満",
      accuracy_before: 50,
      target_improvement_rate: 30,
      accuracy_after: 81,
      measurement_date: "2024-02-26T11:20:00Z",
      measurement_count: 100,
    };

    const result = calculateAccuracyImprovementVerification(input);

    expect(result).toEqual({
      assessor_id: "ASS-012",
      work_type: "電気工事",
      amount_band: "500万円未満",
      accuracy_before: 50,
      target_improvement_rate: 30,
      accuracy_after: 81,
      required_accuracy: 65,
      accuracy_improvement_rate: 31,
      verification_status: "合格",
      improvement_judgment: "十分",
      is_adequate: true,
      measurement_date: "2024-02-26T11:20:00Z",
      measurement_count: 100,
      verification_timestamp: "2024-02-26T11:20:00Z",
    });
    expect(result.is_adequate).toBe(true);
    expect(result.accuracy_improvement_rate).toBe(31);
  });

  // 異なる金額帯での改善効果テスト
  test("異なる金額帯の査定員の改善効果を独立して検証できる", () => {
    const band_inputs = [
      {
        assessor_id: "ASS-013",
        work_type: "躯体工事",
        amount_band: "500万円未満",
        accuracy_before: 85,
        target_improvement_rate: 8,
        accuracy_after: 93.5,
        measurement_date: "2024-02-27T08:45:00Z",
        measurement_count: 90,
      },
      {
        assessor_id: "ASS-014",
        work_type: "躯体工事",
        amount_band: "500万～1000万円",
        accuracy_before: 80,
        target_improvement_rate: 15,
        accuracy_after: 96,
        measurement_date: "2024-02-27T08:45:00Z",
        measurement_count: 125,
      },
      {
        assessor_id: "ASS-015",
        work_type: "躯体工事",
        amount_band: "5000万円以上",
        accuracy_before: 88,
        target_improvement_rate: 10,
        accuracy_after: 98.5,
        measurement_date: "2024-02-27T08:45:00Z",
        measurement_count: 210,
      },
    ];

    const band_results = band_inputs.map((input) =>
      calculateAccuracyImprovementVerification(input)
    );

    expect(band_results[0].is_adequate).toBe(true);
    expect(band_results[0].accuracy_improvement_rate).toBe(8.5);

    expect(band_results[1].is_adequate).toBe(true);
    expect(band_results[1].accuracy_improvement_rate).toBe(16);

    expect(band_results[2].is_adequate).toBe(true);
    expect(band_results[2].accuracy_improvement_rate).toBe(10.5);
  });

  // 改善率が0に近い場合のテスト
  test("改善率がごく小さい場合、改善不足と判定される", () => {
    const input = {
      assessor_id: "ASS-016",
      work_type: "内装工事",
      amount_band: "1000万～5000万円",
      accuracy_before: 80,
      target_improvement_rate: 10,
      accuracy_after: 80.3,
      measurement_date: "2024-02-28T13:00:00Z",
      measurement_count: 95,
    };

    const result = calculateAccuracyImprovementVerification(input);

    expect(result.is_adequate).toBe(false);
    expect(result.improvement_judgment).toBe("不十分");
    expect(result.accuracy_improvement_rate).toBe(0.3);
  });

  // 精度が最大値100に近い状態での改善テスト
  test("精度が99に近い高精度状態での改善を検証できる", () => {
    const input = {
      assessor_id: "ASS-017",
      work_type: "防水工事",
      amount_band: "5000万円以上",
      accuracy_before: 95,
      target_improvement_rate: 4,
      accuracy_after: 99.2,
      measurement_date: "2024-03-01T10:30:00Z",
      measurement_count: 250,
    };

    const result = calculateAccuracyImprovementVerification(input);

    expect(result).toEqual({
      assessor_id: "ASS-017",
      work_type: "防水工事",
      amount_band: "5000万円以上",
      accuracy_before: 95,
      target_improvement_rate: 4,
      accuracy_after: 99.2,
      required_accuracy: 98.8,
      accuracy_improvement_rate: 4.2,
      verification_status: "合格",
      improvement_judgment: "十分",
      is_adequate: true,
      measurement_date: "2024-03-01T10:30:00Z",
      measurement_count: 250,
      verification_timestamp: "2024-03-01T10:30:00Z",
    });
    expect(result.is_adequate).toBe(true);
  });
});