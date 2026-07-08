import { validateAssessmentCriterion } from "../../src/logic/it-6-2-2-1";

describe("査定基準の完全性・一貫性・互換性自動検証", () => {
  // SCEN-898
  test("必須フィールドが未入力の基準が検出され登録不可と判定される", () => {
    const incompleteInput = {
      criterionName: "",
      category: "工事種別",
      evaluationScale: "5段階",
      lowerBound: 50,
      upperBound: 150,
      region: "東京",
      createdBy: "user001",
      createdAt: "2024-01-15T10:00:00Z",
    };

    expect(() => validateAssessmentCriterion(incompleteInput)).toThrow(
      /基準名/
    );
  });

  test("カテゴリが未入力の基準が検出され登録不可と判定される", () => {
    const incompleteInput = {
      criterionName: "標準相場A",
      category: "",
      evaluationScale: "5段階",
      lowerBound: 50,
      upperBound: 150,
      region: "東京",
      createdBy: "user001",
      createdAt: "2024-01-15T10:00:00Z",
    };

    expect(() => validateAssessmentCriterion(incompleteInput)).toThrow(
      /カテゴリ/
    );
  });

  test("評価スケールが未入力の基準が検出され登録不可と判定される", () => {
    const incompleteInput = {
      criterionName: "標準相場A",
      category: "工事種別",
      evaluationScale: "",
      lowerBound: 50,
      upperBound: 150,
      region: "東京",
      createdBy: "user001",
      createdAt: "2024-01-15T10:00:00Z",
    };

    expect(() => validateAssessmentCriterion(incompleteInput)).toThrow(
      /評価スケール/
    );
  });

  test("金額範囲の下限が未入力の基準が検出され登録不可と判定される", () => {
    const incompleteInput = {
      criterionName: "標準相場A",
      category: "工事種別",
      evaluationScale: "5段階",
      lowerBound: null,
      upperBound: 150,
      region: "東京",
      createdBy: "user001",
      createdAt: "2024-01-15T10:00:00Z",
    };

    expect(() => validateAssessmentCriterion(incompleteInput)).toThrow(
      /下限/
    );
  });

  test("金額範囲の上限が未入力の基準が検出され登録不可と判定される", () => {
    const incompleteInput = {
      criterionName: "標準相場A",
      category: "工事種別",
      evaluationScale: "5段階",
      lowerBound: 50,
      upperBound: null,
      region: "東京",
      createdBy: "user001",
      createdAt: "2024-01-15T10:00:00Z",
    };

    expect(() => validateAssessmentCriterion(incompleteInput)).toThrow(
      /上限/
    );
  });

  test("地域が未入力の基準が検出され登録不可と判定される", () => {
    const incompleteInput = {
      criterionName: "標準相場A",
      category: "工事種別",
      evaluationScale: "5段階",
      lowerBound: 50,
      upperBound: 150,
      region: "",
      createdBy: "user001",
      createdAt: "2024-01-15T10:00:00Z",
    };

    expect(() => validateAssessmentCriterion(incompleteInput)).toThrow(
      /地域/
    );
  });

  test("作成者が未入力の基準が検出され登録不可と判定される", () => {
    const incompleteInput = {
      criterionName: "標準相場A",
      category: "工事種別",
      evaluationScale: "5段階",
      lowerBound: 50,
      upperBound: 150,
      region: "東京",
      createdBy: "",
      createdAt: "2024-01-15T10:00:00Z",
    };

    expect(() => validateAssessmentCriterion(incompleteInput)).toThrow(
      /作成者/
    );
  });

  test("作成日時が未入力の基準が検出され登録不可と判定される", () => {
    const incompleteInput = {
      criterionName: "標準相場A",
      category: "工事種別",
      evaluationScale: "5段階",
      lowerBound: 50,
      upperBound: 150,
      region: "東京",
      createdBy: "user001",
      createdAt: "",
    };

    expect(() => validateAssessmentCriterion(incompleteInput)).toThrow(
      /作成日時/
    );
  });

  test("下限が上限を超える一貫性エラーが検出され登録不可と判定される", () => {
    const inconsistentInput = {
      criterionName: "標準相場A",
      category: "工事種別",
      evaluationScale: "5段階",
      lowerBound: 200,
      upperBound: 100,
      region: "東京",
      createdBy: "user001",
      createdAt: "2024-01-15T10:00:00Z",
    };

    expect(() => validateAssessmentCriterion(inconsistentInput)).toThrow(
      /範囲/
    );
  });

  test("必須フィールドすべてが入力された有効な基準は検証に合格する", () => {
    const completeInput = {
      criterionName: "標準相場A",
      category: "工事種別",
      evaluationScale: "5段階",
      lowerBound: 50,
      upperBound: 150,
      region: "東京",
      createdBy: "user001",
      createdAt: "2024-01-15T10:00:00Z",
    };

    const result = validateAssessmentCriterion(completeInput);

    expect(result).toEqual({
      isValid: true,
      errors: [],
      validatedAt: "2024-01-15T10:00:00Z",
    });
  });

  test("複数の必須フィールドが未入力の場合、すべての未入力フィールドが特定される", () => {
    const multipleIncompleteInput = {
      criterionName: "",
      category: "",
      evaluationScale: "5段階",
      lowerBound: 50,
      upperBound: 150,
      region: "",
      createdBy: "user001",
      createdAt: "2024-01-15T10:00:00Z",
    };

    expect(() => validateAssessmentCriterion(multipleIncompleteInput)).toThrow(
      /基準名/
    );
  });
});