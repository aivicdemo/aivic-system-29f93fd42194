import { calculateAssessorJudgmentConsistencyScore } from "../../src/logic/it-6-2-1-1";

describe("査定担当者別・工種別・金額帯別の判定精度指標の自動集計と可視化", () => {
  test("SCEN-851: 全査定員の判定が相互に異なる場合に一致度スコア0%と算出される", () => {
    // ============================================
    // 前提条件の設定
    // ============================================
    // 同一の査定対象に対して3人以上の査定員による異なる判定結果
    const assessment_id = "ASS-2024-001";
    const assessor_judgments = [
      {
        assessor_id: "A001",
        assessor_name: "査定員A",
        judgment_result: "合格", // judgment_result の値
        judgment_timestamp: new Date("2024-01-15T10:00:00Z"),
      },
      {
        assessor_id: "B002",
        assessor_name: "査定員B",
        judgment_result: "不合格", // 異なる判定
        judgment_timestamp: new Date("2024-01-15T10:15:00Z"),
      },
      {
        assessor_id: "C003",
        assessor_name: "査定員C",
        judgment_result: "保留", // さらに異なる判定
        judgment_timestamp: new Date("2024-01-15T10:30:00Z"),
      },
    ];

    // ============================================
    // 関数実行
    // ============================================
    const result = calculateAssessorJudgmentConsistencyScore({
      assessment_id: assessment_id,
      assessor_judgments: assessor_judgments,
    });

    // ============================================
    // 戻り値のデータ型と値が正確に0であることを検証
    // ============================================
    expect(result.consistency_score).toBe(0);
    expect(typeof result.consistency_score).toBe("number");

    // ============================================
    // UI上に表示される一致度スコアが0%であることを確認
    // ============================================
    expect(result.consistency_percentage).toBe("0%");

    // ============================================
    // 計算ログに判定が完全に一致していないことが記録されていることを検証
    // ============================================
    expect(result.calculation_log).toBeDefined();
    expect(result.calculation_log.length).toBeGreaterThan(0);

    // ログが判定不一致を記録していることを確認
    const inconsistency_log = result.calculation_log.find(
      (log: { message: string }) => log.message.includes("判定が完全に一致していない")
    );
    expect(inconsistency_log).toBeDefined();

    // ============================================
    // 詳細情報の検証
    // ============================================
    expect(result.total_assessors).toBe(3);
    expect(result.matching_pairs).toBe(0); // 一致するペアが0組
    expect(result.assessment_id).toBe(assessment_id);

    // ============================================
    // 判定結果の一覧が正確に記録されていることを確認
    // ============================================
    expect(result.judgments_summary).toEqual([
      { judgment_result: "合格", count: 1 },
      { judgment_result: "不合格", count: 1 },
      { judgment_result: "保留", count: 1 },
    ]);

    // ============================================
    // 計算の正確性を検証（全判定が異なる場合の数学的計算）
    // 3人全員が異なる判定 = 一致ペアなし = 一致度0%
    // ============================================
    expect(result.max_possible_pairs).toBe(3); // C(3,2) = 3
    expect(result.consistency_score).toBe(result.matching_pairs / result.max_possible_pairs); // 0 / 3 = 0
  });
});