import { recordStructuredJudgmentResult } from "../../src/logic/it-6-2-2-1";

describe("査定員別・案件別の判定ロジック・乖離パターン履歴の記録・抽出機能", () => {
  // SCEN-843: [error] 判定結果の構造化記録 - 査定員情報が不完全な場合、記録プロセスが失敗し例外が発生する
  test("査定員情報が不完全な場合、記録プロセスが失敗し例外が発生する", () => {
    const input_incomplete_assessor = {
      assessor_id: "",
      assessor_name: "田中太郎",
      assessment_target_item: "鉄筋工事",
      assessment_datetime: "2024-01-15T14:30:00Z",
      assessment_amount: 1250000,
      assessment_unit_price: 2500,
      assessment_quantity: 500,
      market_deviation_rate: 3.5,
      market_deviation_amount: 43750,
      reference_data_count: 45,
      applied_correction_coefficient: 1.02,
      judgment_basis: "過去案件データと物価本の照合により、相場乖離率3.5%は許容範囲内と判定",
      judgment_result: "承認",
    };

    expect(() => recordStructuredJudgmentResult(input_incomplete_assessor)).toThrow(/査定員ID/);
  });

  test("査定員名が不完全な場合、記録プロセスが失敗し例外が発生する", () => {
    const input_missing_name = {
      assessor_id: "ASS-001",
      assessor_name: "",
      assessment_target_item: "鉄筋工事",
      assessment_datetime: "2024-01-15T14:30:00Z",
      assessment_amount: 1250000,
      assessment_unit_price: 2500,
      assessment_quantity: 500,
      market_deviation_rate: 3.5,
      market_deviation_amount: 43750,
      reference_data_count: 45,
      applied_correction_coefficient: 1.02,
      judgment_basis: "過去案件データと物価本の照合により、相場乖離率3.5%は許容範囲内と判定",
      judgment_result: "承認",
    };

    expect(() => recordStructuredJudgmentResult(input_missing_name)).toThrow(/査定員名/);
  });

  test("査定対象品が不完全な場合、記録プロセスが失敗し例外が発生する", () => {
    const input_missing_item = {
      assessor_id: "ASS-001",
      assessor_name: "田中太郎",
      assessment_target_item: "",
      assessment_datetime: "2024-01-15T14:30:00Z",
      assessment_amount: 1250000,
      assessment_unit_price: 2500,
      assessment_quantity: 500,
      market_deviation_rate: 3.5,
      market_deviation_amount: 43750,
      reference_data_count: 45,
      applied_correction_coefficient: 1.02,
      judgment_basis: "過去案件データと物価本の照合により、相場乖離率3.5%は許容範囲内と判定",
      judgment_result: "承認",
    };

    expect(() => recordStructuredJudgmentResult(input_missing_item)).toThrow(/査定対象品/);
  });

  test("査定日時が不完全な場合、記録プロセスが失敗し例外が発生する", () => {
    const input_missing_datetime = {
      assessor_id: "ASS-001",
      assessor_name: "田中太郎",
      assessment_target_item: "鉄筋工事",
      assessment_datetime: "",
      assessment_amount: 1250000,
      assessment_unit_price: 2500,
      assessment_quantity: 500,
      market_deviation_rate: 3.5,
      market_deviation_amount: 43750,
      reference_data_count: 45,
      applied_correction_coefficient: 1.02,
      judgment_basis: "過去案件データと物価本の照合により、相場乖離率3.5%は許容範囲内と判定",
      judgment_result: "承認",
    };

    expect(() => recordStructuredJudgmentResult(input_missing_datetime)).toThrow(/査定日時/);
  });

  test("査定金額が不完全な場合、記録プロセスが失敗し例外が発生する", () => {
    const input_missing_amount = {
      assessor_id: "ASS-001",
      assessor_name: "田中太郎",
      assessment_target_item: "鉄筋工事",
      assessment_datetime: "2024-01-15T14:30:00Z",
      assessment_amount: 0,
      assessment_unit_price: 2500,
      assessment_quantity: 500,
      market_deviation_rate: 3.5,
      market_deviation_amount: 43750,
      reference_data_count: 45,
      applied_correction_coefficient: 1.02,
      judgment_basis: "過去案件データと物価本の照合により、相場乖離率3.5%は許容範囲内と判定",
      judgment_result: "承認",
    };

    expect(() => recordStructuredJudgmentResult(input_missing_amount)).toThrow(/査定金額/);
  });

  test("すべての必須項目が完全な場合、記録プロセスが成功し判定結果が正常に記録される", () => {
    const input_complete = {
      assessor_id: "ASS-001",
      assessor_name: "田中太郎",
      assessment_target_item: "鉄筋工事",
      assessment_datetime: "2024-01-15T14:30:00Z",
      assessment_amount: 1250000,
      assessment_unit_price: 2500,
      assessment_quantity: 500,
      market_deviation_rate: 3.5,
      market_deviation_amount: 43750,
      reference_data_count: 45,
      applied_correction_coefficient: 1.02,
      judgment_basis: "過去案件データと物価本の照合により、相場乖離率3.5%は許容範囲内と判定",
      judgment_result: "承認",
    };

    const result = recordStructuredJudgmentResult(input_complete);

    expect(result).toEqual(
      expect.objectContaining({
        assessor_id: "ASS-001",
        assessor_name: "田中太郎",
        assessment_target_item: "鉄筋工事",
        assessment_datetime: "2024-01-15T14:30:00Z",
        assessment_amount: 1250000,
        assessment_unit_price: 2500,
        assessment_quantity: 500,
        market_deviation_rate: 3.5,
        market_deviation_amount: 43750,
        reference_data_count: 45,
        applied_correction_coefficient: 1.02,
        judgment_basis: "過去案件データと物価本の照合により、相場乖離率3.5%は許容範囲内と判定",
        judgment_result: "承認",
      })
    );

    expect(result).toHaveProperty("recorded_at");
    expect(result.recorded_at).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/);
  });

  test("複数の必須項目が不完全な場合、最初に検出された不完全項目についてエラーが発生する", () => {
    const input_multiple_incomplete = {
      assessor_id: "",
      assessor_name: "",
      assessment_target_item: "鉄筋工事",
      assessment_datetime: "2024-01-15T14:30:00Z",
      assessment_amount: 1250000,
      assessment_unit_price: 2500,
      assessment_quantity: 500,
      market_deviation_rate: 3.5,
      market_deviation_amount: 43750,
      reference_data_count: 45,
      applied_correction_coefficient: 1.02,
      judgment_basis: "過去案件データと物価本の照合により、相場乖離率3.5%は許容範囲内と判定",
      judgment_result: "承認",
    };

    expect(() => recordStructuredJudgmentResult(input_multiple_incomplete)).toThrow(/査定員ID/);
  });

  test("判定根拠が空白の場合でも、その他の必須項目が揃っていれば記録は成功する", () => {
    const input_empty_basis = {
      assessor_id: "ASS-001",
      assessor_name: "田中太郎",
      assessment_target_item: "鉄筋工事",
      assessment_datetime: "2024-01-15T14:30:00Z",
      assessment_amount: 1250000,
      assessment_unit_price: 2500,
      assessment_quantity: 500,
      market_deviation_rate: 3.5,
      market_deviation_amount: 43750,
      reference_data_count: 45,
      applied_correction_coefficient: 1.02,
      judgment_basis: "",
      judgment_result: "承認",
    };

    const result = recordStructuredJudgmentResult(input_empty_basis);

    expect(result).toEqual(
      expect.objectContaining({
        assessor_id: "ASS-001",
        judgment_basis: "",
      })
    );
  });

  test("査定数量が負数の場合、記録プロセスが失敗する", () => {
    const input_negative_quantity = {
      assessor_id: "ASS-001",
      assessor_name: "田中太郎",
      assessment_target_item: "鉄筋工事",
      assessment_datetime: "2024-01-15T14:30:00Z",
      assessment_amount: 1250000,
      assessment_unit_price: 2500,
      assessment_quantity: -500,
      market_deviation_rate: 3.5,
      market_deviation_amount: 43750,
      reference_data_count: 45,
      applied_correction_coefficient: 1.02,
      judgment_basis: "過去案件データと物価本の照合により、相場乖離率3.5%は許容範囲内と判定",
      judgment_result: "承認",
    };

    expect(() => recordStructuredJudgmentResult(input_negative_quantity)).toThrow(/数量/);
  });

  test("参照データ件数が0の場合、記録プロセスが失敗する", () => {
    const input_zero_reference = {
      assessor_id: "ASS-001",
      assessor_name: "田中太郎",
      assessment_target_item: "鉄筋工事",
      assessment_datetime: "2024-01-15T14:30:00Z",
      assessment_amount: 1250000,
      assessment_unit_price: 2500,
      assessment_quantity: 500,
      market_deviation_rate: 3.5,
      market_deviation_amount: 43750,
      reference_data_count: 0,
      applied_correction_coefficient: 1.02,
      judgment_basis: "過去案件データと物価本の照合により、相場乖離率3.5%は許容範囲内と判定",
      judgment_result: "承認",
    };

    expect(() => recordStructuredJudgmentResult(input_zero_reference)).toThrow(/参照データ件数/);
  });
});