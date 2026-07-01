import { describe, test, expect } from "@jest/globals";
import {
  validateFilterConditions,
} from "../../src/logic/it-1781935279444-2-2-1";

describe("資料検索・フィルタリング機能", () => {
  // SCEN-778
  test("フィルタ条件が不正または矛盾している場合にエラーとして検出される", () => {
    // ===== Test 1: 開始日付が終了日付より後の場合 =====
    const invalidDateFilter = {
      startDate: "2024-12-31",
      endDate: "2024-01-01",
    };
    expect(() => validateFilterConditions(invalidDateFilter)).toThrow(
      /開始日付/
    );

    // ===== Test 2: 数値範囲で最小値が最大値より大きい場合 =====
    const invalidRangeFilter = {
      minValue: 1000,
      maxValue: 100,
    };
    expect(() => validateFilterConditions(invalidRangeFilter)).toThrow(
      /最小値/
    );

    // ===== Test 3: 日付形式が不正な場合 =====
    const invalidDateFormatFilter = {
      startDate: "2024/13/45",
      endDate: "2024-12-31",
    };
    expect(() => validateFilterConditions(invalidDateFormatFilter)).toThrow(
      /日付/
    );

    // ===== Test 4: 数値以外の文字が入力された場合 =====
    const invalidNumericFilter = {
      minValue: "abc",
      maxValue: 500,
    };
    expect(() => validateFilterConditions(invalidNumericFilter)).toThrow(
      /数値/
    );

    // ===== Test 5: 正常なフィルタ条件で検証成功 =====
    const validFilter = {
      startDate: "2024-01-01",
      endDate: "2024-12-31",
      minValue: 100,
      maxValue: 1000,
    };
    const result = validateFilterConditions(validFilter);
    expect(result).toEqual({
      isValid: true,
      errors: [],
    });

    // ===== Test 6: フィルタ条件のリセット（空オブジェクト） =====
    const resetFilter = {};
    const resetResult = validateFilterConditions(resetFilter);
    expect(resetResult).toEqual({
      isValid: true,
      errors: [],
    });

    // ===== Test 7: 終了日付のみ設定される場合（開始日付なし） =====
    const partialDateFilter = {
      endDate: "2024-12-31",
    };
    const partialResult = validateFilterConditions(partialDateFilter);
    expect(partialResult).toEqual({
      isValid: true,
      errors: [],
    });

    // ===== Test 8: 最小値のみ設定される場合（最大値なし） =====
    const partialRangeFilter = {
      minValue: 100,
    };
    const partialRangeResult = validateFilterConditions(partialRangeFilter);
    expect(partialRangeResult).toEqual({
      isValid: true,
      errors: [],
    });

    // ===== Test 9: 複数の矛盾条件が同時に存在 =====
    const multipleInvalidFilter = {
      startDate: "2024-12-31",
      endDate: "2024-01-01",
      minValue: 1000,
      maxValue: 100,
    };
    expect(() => validateFilterConditions(multipleInvalidFilter)).toThrow(
      /開始日付|最小値/
    );

    // ===== Test 10: null/undefined をフィルタに含めた場合 =====
    const nullFilter = {
      startDate: null,
      endDate: "2024-12-31",
    };
    expect(() => validateFilterConditions(nullFilter)).toThrow(/日付/);

    // ===== Test 11: 閏年の日付（正常なケース） =====
    const leapYearFilter = {
      startDate: "2024-02-29",
      endDate: "2024-03-01",
    };
    const leapYearResult = validateFilterConditions(leapYearFilter);
    expect(leapYearResult).toEqual({
      isValid: true,
      errors: [],
    });

    // ===== Test 12: 不正な閏年の日付（2月30日） =====
    const invalidLeapYearFilter = {
      startDate: "2024-02-30",
      endDate: "2024-03-01",
    };
    expect(() => validateFilterConditions(invalidLeapYearFilter)).toThrow(
      /日付/
    );

    // ===== Test 13: 数値が整数ではない場合（小数点） =====
    const decimalFilter = {
      minValue: 100.5,
      maxValue: 1000.5,
    };
    const decimalResult = validateFilterConditions(decimalFilter);
    expect(decimalResult).toEqual({
      isValid: true,
      errors: [],
    });

    // ===== Test 14: 負数の数値範囲 =====
    const negativeRangeFilter = {
      minValue: -1000,
      maxValue: -100,
    };
    const negativeRangeResult = validateFilterConditions(negativeRangeFilter);
    expect(negativeRangeResult).toEqual({
      isValid: true,
      errors: [],
    });

    // ===== Test 15: 同一値を最小値・最大値に設定 =====
    const sameValueFilter = {
      minValue: 500,
      maxValue: 500,
    };
    const sameValueResult = validateFilterConditions(sameValueFilter);
    expect(sameValueResult).toEqual({
      isValid: true,
      errors: [],
    });

    // ===== Test 16: 同一日付を開始日付・終了日付に設定 =====
    const sameDateFilter = {
      startDate: "2024-12-31",
      endDate: "2024-12-31",
    };
    const sameDateResult = validateFilterConditions(sameDateFilter);
    expect(sameDateResult).toEqual({
      isValid: true,
      errors: [],
    });
  });
});