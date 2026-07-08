import { assessmentComprehensiveJudgment } from "../../src/logic/it-6-2-2-2";

describe("査定員別の判定精度・乖離パターン分析ダッシュボード", () => {
  // SCEN-840: [error] 相場乖離総合判定と承認・修正決定 - 補正係数が無効値の場合、総合判定プロセスが失敗し例外が発生する
  test("補正係数が無効値（null）の場合、総合判定プロセスが失敗し例外が発生する", () => {
    const input_null = {
      assessed_amount: 5000000,
      market_price: 4800000,
      deviation_rate: 4.17,
      deviation_amount: 200000,
      reference_data_count: 25,
      correction_coefficient: null,
      applied_logic_id: "LOGIC_20240115_001",
      assessor_id: "ASR_001",
      assessment_timestamp: new Date("2024-01-15T11:00:00Z"),
    };
    expect(() => assessmentComprehensiveJudgment(input_null)).toThrow(
      /補正係数/
    );
  });

  test("補正係数が無効値（undefined）の場合、総合判定プロセスが失敗し例外が発生する", () => {
    const input_undefined = {
      assessed_amount: 5000000,
      market_price: 4800000,
      deviation_rate: 4.17,
      deviation_amount: 200000,
      reference_data_count: 25,
      correction_coefficient: undefined,
      applied_logic_id: "LOGIC_20240115_001",
      assessor_id: "ASR_001",
      assessment_timestamp: new Date("2024-01-15T11:00:00Z"),
    };
    expect(() => assessmentComprehensiveJudgment(input_undefined)).toThrow(
      /補正係数/
    );
  });

  test("補正係数が無効値（NaN）の場合、総合判定プロセスが失敗し例外が発生する", () => {
    const input_nan = {
      assessed_amount: 5000000,
      market_price: 4800000,
      deviation_rate: 4.17,
      deviation_amount: 200000,
      reference_data_count: 25,
      correction_coefficient: NaN,
      applied_logic_id: "LOGIC_20240115_001",
      assessor_id: "ASR_001",
      assessment_timestamp: new Date("2024-01-15T11:00:00Z"),
    };
    expect(() => assessmentComprehensiveJudgment(input_nan)).toThrow(
      /補正係数/
    );
  });

  test("補正係数が無効値（空文字列）の場合、総合判定プロセスが失敗し例外が発生する", () => {
    const input_empty = {
      assessed_amount: 5000000,
      market_price: 4800000,
      deviation_rate: 4.17,
      deviation_amount: 200000,
      reference_data_count: 25,
      correction_coefficient: "" as any,
      applied_logic_id: "LOGIC_20240115_001",
      assessor_id: "ASR_001",
      assessment_timestamp: new Date("2024-01-15T11:00:00Z"),
    };
    expect(() => assessmentComprehensiveJudgment(input_empty)).toThrow(
      /補正係数/
    );
  });

  test("補正係数が有効値の場合、総合判定プロセスが成功し判定結果が返される", () => {
    const input_valid = {
      assessed_amount: 5000000,
      market_price: 4800000,
      deviation_rate: 4.17,
      deviation_amount: 200000,
      reference_data_count: 25,
      correction_coefficient: 0.95,
      applied_logic_id: "LOGIC_20240115_001",
      assessor_id: "ASR_001",
      assessment_timestamp: new Date("2024-01-15T11:00:00Z"),
    };
    const result = assessmentComprehensiveJudgment(input_valid);
    expect(result).toBeDefined();
    expect(result.judgment_result).toBe("APPROVED");
    expect(result.corrected_market_price).toBe(4560000);
    expect(result.final_deviation_rate).toBeCloseTo(8.77, 2);
    expect(result.error_message).toBeNull();
  });

  test("補正係数が無効値の場合、エラーメッセージに『補正係数が無効です』が含まれる", () => {
    const input_invalid = {
      assessed_amount: 5000000,
      market_price: 4800000,
      deviation_rate: 4.17,
      deviation_amount: 200000,
      reference_data_count: 25,
      correction_coefficient: null,
      applied_logic_id: "LOGIC_20240115_001",
      assessor_id: "ASR_001",
      assessment_timestamp: new Date("2024-01-15T11:00:00Z"),
    };
    try {
      assessmentComprehensiveJudgment(input_invalid);
      fail("例外がスローされるべきです");
    } catch (error: any) {
      expect(error.message).toMatch(/補正係数が無効/);
    }
  });
});