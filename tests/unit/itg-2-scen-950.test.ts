import { describe, test, expect } from "@jest/globals";
import { calculateAssessorProductivityIndex } from "../../src/logic/it-6-2-1-1";

describe("査定担当者別・工種別・金額帯別の判定精度指標の自動集計と可視化", () => {
  // SCEN-950: [edge] 査定員別処理能力指標自動算出機能 - 処理件数がゼロの査定員について、処理能力指数が正しく計算される
  test("処理件数がゼロの査定員について、処理能力指数が0またはN/Aで正しく表示され、エラーが発生しないこと", () => {
    // Arrange: 処理件数がゼロの査定員データを用意
    const assessorWithZeroCount = {
      assessor_id: "ASS-001",
      assessor_name: "田中太郎",
      evaluation_period_start: "2024-01-01",
      evaluation_period_end: "2024-01-31",
      total_assessment_count: 0,
      total_assessment_time_minutes: 0,
      judgment_accuracy_rate: 0,
      market_deviation_accuracy: 0,
    };

    // 処理件数がゼロでない通常の査定員データ
    const assessorWithNormalCount = {
      assessor_id: "ASS-002",
      assessor_name: "鈴木花子",
      evaluation_period_start: "2024-01-01",
      evaluation_period_end: "2024-01-31",
      total_assessment_count: 20,
      total_assessment_time_minutes: 600,
      judgment_accuracy_rate: 95,
      market_deviation_accuracy: 92,
    };

    const assessors = [assessorWithZeroCount, assessorWithNormalCount];

    // Act: 処理能力指数の自動算出を実行
    const result = calculateAssessorProductivityIndex(assessors);

    // Assert: 処理件数がゼロの査定員の結果を検証
    const zeroCountResult = result.find(
      (r) => r.assessor_id === "ASS-001"
    );
    expect(zeroCountResult).toBeDefined();
    expect(zeroCountResult?.productivity_index).toBe(0);
    expect(zeroCountResult?.productivity_index_display).toBe("N/A");

    // Assert: 通常の査定員の処理能力指数が正しく計算されていることを検証
    // 期待値: 処理能力指数 = 処理件数 / (処理時間 / 60) = 20 / (600 / 60) = 20 / 10 = 2.0
    const normalCountResult = result.find(
      (r) => r.assessor_id === "ASS-002"
    );
    expect(normalCountResult).toBeDefined();
    expect(normalCountResult?.productivity_index).toBe(2.0);
    expect(normalCountResult?.productivity_index_display).toBe("2.0 件/時間");

    // Assert: エラーが発生していないことを検証
    expect(result).toHaveLength(2);
    expect(result.every((r) => r.error === null || r.error === undefined)).toBe(
      true
    );

    // Assert: 処理件数がゼロの査定員による計算が、他の査定員に影響を与えていないことを検証
    expect(normalCountResult?.productivity_index).not.toBe(0);
    expect(normalCountResult?.productivity_index).not.toBe(NaN);
    expect(normalCountResult?.productivity_index).toBe(2.0);
  });
});