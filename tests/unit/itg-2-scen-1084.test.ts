import { describe, test, expect, beforeEach } from "@jest/globals";
import {
  validateMonthlyAllocationBalance,
} from "../../src/logic/it-1-br-2-2-2-1";

describe("査定員ごとの判定結果と根拠の月次集計・分析ダッシュボード", () => {
  test("SCEN-1084: 月次人員配置計画の策定 - 月次査定件数と配置計画のバランスチェックで実行可能性が検証される", () => {
    // ハッピーパス: 実行可能な場合
    const availableAssessors = [
      { assessor_id: "A001", monthly_capacity: 50 },
      { assessor_id: "A002", monthly_capacity: 50 },
      { assessor_id: "A003", monthly_capacity: 50 },
    ];
    const monthly_assessment_count = 120;

    const result_executable = validateMonthlyAllocationBalance({
      monthly_assessment_count,
      available_assessors: availableAssessors,
    });

    // 必要査定員数: 120 ÷ 50 = 2.4 → 3人必要
    // 利用可能査定員数: 3人
    // バランス判定: 3 <= 3 → 実行可能
    expect(result_executable.is_executable).toBe(true);
    expect(result_executable.required_assessor_count).toBe(3);
    expect(result_executable.available_assessor_count).toBe(3);
    expect(result_executable.shortage_count).toBe(0);
    expect(result_executable.warning_message).toBe("");

    // エッジケース: 完全にマッチする場合
    const available_assessors_exact = [
      { assessor_id: "B001", monthly_capacity: 60 },
      { assessor_id: "B002", monthly_capacity: 60 },
    ];
    const monthly_assessment_count_exact = 120;

    const result_exact = validateMonthlyAllocationBalance({
      monthly_assessment_count: monthly_assessment_count_exact,
      available_assessors: available_assessors_exact,
    });

    // 必要査定員数: 120 ÷ 60 = 2人
    // 利用可能査定員数: 2人
    // バランス判定: 2 <= 2 → 実行可能
    expect(result_exact.is_executable).toBe(true);
    expect(result_exact.required_assessor_count).toBe(2);
    expect(result_exact.available_assessor_count).toBe(2);
    expect(result_exact.shortage_count).toBe(0);

    // 実行不可能な場合: 必要人数が利用可能人数を超える
    const available_assessors_insufficient = [
      { assessor_id: "C001", monthly_capacity: 50 },
      { assessor_id: "C002", monthly_capacity: 50 },
    ];
    const monthly_assessment_count_high = 200;

    const result_insufficient = validateMonthlyAllocationBalance({
      monthly_assessment_count: monthly_assessment_count_high,
      available_assessors: available_assessors_insufficient,
    });

    // 必要査定員数: 200 ÷ 50 = 4人
    // 利用可能査定員数: 2人
    // バランス判定: 4 > 2 → 実行不可能
    // 不足人数: 4 - 2 = 2人
    expect(result_insufficient.is_executable).toBe(false);
    expect(result_insufficient.required_assessor_count).toBe(4);
    expect(result_insufficient.available_assessor_count).toBe(2);
    expect(result_insufficient.shortage_count).toBe(2);
    expect(result_insufficient.warning_message).toMatch(/不足人数/);
    expect(result_insufficient.warning_message).toMatch(/2人/);

    // エラーケース: 利用可能査定員が空
    const available_assessors_empty: typeof availableAssessors = [];

    expect(() =>
      validateMonthlyAllocationBalance({
        monthly_assessment_count: 100,
        available_assessors: available_assessors_empty,
      })
    ).toThrow(/利用可能査定員/);

    // エラーケース: 月次査定件数が0以下
    expect(() =>
      validateMonthlyAllocationBalance({
        monthly_assessment_count: 0,
        available_assessors: availableAssessors,
      })
    ).toThrow(/査定件数/);

    // エラーケース: 査定員の月次能力が0以下
    const invalid_assessors = [
      { assessor_id: "D001", monthly_capacity: 0 },
    ];

    expect(() =>
      validateMonthlyAllocationBalance({
        monthly_assessment_count: 100,
        available_assessors: invalid_assessors,
      })
    ).toThrow(/能力/);

    // 境界値: 小数点以下の切り上げ判定
    const available_assessors_boundary = [
      { assessor_id: "E001", monthly_capacity: 30 },
      { assessor_id: "E002", monthly_capacity: 30 },
      { assessor_id: "E003", monthly_capacity: 30 },
    ];
    const monthly_assessment_count_boundary = 65; // 65 ÷ 30 = 2.166... → 切り上げ = 3人必要

    const result_boundary = validateMonthlyAllocationBalance({
      monthly_assessment_count: monthly_assessment_count_boundary,
      available_assessors: available_assessors_boundary,
    });

    expect(result_boundary.is_executable).toBe(true);
    expect(result_boundary.required_assessor_count).toBe(3);
    expect(result_boundary.available_assessor_count).toBe(3);
    expect(result_boundary.shortage_count).toBe(0);

    // 境界値: ちょうど切り上げになる手前
    const monthly_assessment_count_boundary_almost = 61; // 61 ÷ 30 = 2.033... → 切り上げ = 3人必要
    const result_boundary_almost = validateMonthlyAllocationBalance({
      monthly_assessment_count: monthly_assessment_count_boundary_almost,
      available_assessors: available_assessors_boundary,
    });

    expect(result_boundary_almost.is_executable).toBe(true);
    expect(result_boundary_almost.required_assessor_count).toBe(3);
  });
});