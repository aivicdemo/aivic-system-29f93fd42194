import { describe, test, expect, beforeEach } from "@jest/globals";
import {
  aggregateAssessmentAccuracyByAssessor,
} from "../../src/logic/it-6-2-1-1";

describe("査定担当者別・工種別・金額帯別の判定精度指標の自動集計と可視化", () => {
  // SCEN-1435: [edge] 相場判定精度検証機能 - 相場判定精度がちょうど合格基準値の場合に合格判定が記録される
  test("相場判定精度がちょうど合格基準値（80.0%）の場合に合格判定が記録される", () => {
    // 準備: テストデータとして、相場判定精度がちょうど合格基準値（80.0%）の査定結果を準備する
    const assessor_id = "ASS001";
    const construction_type = "建築工事";
    const amount_band = "1000万～5000万";
    const judgment_date = "2024-01-15T10:30:00Z";
    const user_id = "USR001";
    const user_name = "田中太郎";

    const assessment_results = [
      {
        assessor_id: assessor_id,
        construction_type: construction_type,
        amount_band: amount_band,
        market_deviation_rate: 5.0,
        assessment_time_minutes: 15,
        judgment_accuracy_percent: 80.0,
        judgment_date: judgment_date,
        user_id: user_id,
        user_name: user_name,
      },
    ];

    const passing_criteria_percent = 80.0;

    // 実行: 相場判定精度検証機能に上記のテストデータを入力する
    const result = aggregateAssessmentAccuracyByAssessor({
      assessment_results: assessment_results,
      passing_criteria_percent: passing_criteria_percent,
    });

    // 検証1: 判定結果が「合格」と記録されていることを確認する
    expect(result.judgment_result).toBe("合格");

    // 検証2: 判定精度が正確に記録されていることを確認する
    expect(result.judgment_accuracy_percent).toBe(80.0);

    // 検証3: 判定日時が正しく記録されていることを確認する
    expect(result.judgment_date).toBe(judgment_date);

    // 検証4: ユーザー情報が正しく記録されていることを確認する
    expect(result.user_id).toBe(user_id);
    expect(result.user_name).toBe(user_name);

    // 検証5: 査定員別集計データが正確に保存されていることを確認する
    expect(result.assessor_id).toBe(assessor_id);

    // 検証6: 工種別・金額帯別の集計が正確に記録されていることを確認する
    expect(result.construction_type).toBe(construction_type);
    expect(result.amount_band).toBe(amount_band);

    // 検証7: 判定履歴が構造化データとしてシステムに保存可能な形式であることを確認する
    expect(result.history_record).toEqual({
      judgment_result: "合格",
      judgment_accuracy_percent: 80.0,
      judgment_date: judgment_date,
      user_id: user_id,
      user_name: user_name,
      assessor_id: assessor_id,
      construction_type: construction_type,
      amount_band: amount_band,
    });

    // 検証8: 判定基準値が正確に記録されていることを確認する
    expect(result.passing_criteria_percent).toBe(80.0);

    // 検証9: 市場乖離率が記録されていることを確認する
    expect(result.market_deviation_rate).toBe(5.0);

    // 検証10: 査定時間が記録されていることを確認する
    expect(result.assessment_time_minutes).toBe(15);
  });
});