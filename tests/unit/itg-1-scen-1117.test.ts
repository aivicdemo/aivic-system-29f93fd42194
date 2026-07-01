import { describe, test, expect } from "@jest/globals";
import { validateGraduationRequirement } from "../../src/logic/it-1781935279444-2-2-1";

describe("新入スタッフ卒業要件判定機能 - ドキュメント反映状況の検証", () => {
  // SCEN-1117
  test("ドキュメント反映状況データが不完全な場合、卒業要件判定がエラーで終了される", () => {
    // 不完全なドキュメント反映状況データ（ドキュメント名が空）
    const incompleteDocumentReflectionData = {
      documentName: "",
      reflectionDateTime: "2024-01-15T09:30:00Z",
      completionStatus: "completed",
      staffId: "staff-001",
      requirementId: "req-001"
    };

    expect(() =>
      validateGraduationRequirement(incompleteDocumentReflectionData)
    ).toThrow(/ドキュメント名/);
  });

  test("反映日時が空の場合、卒業要件判定がエラーで終了される", () => {
    const incompleteData = {
      documentName: "請求書作成業務マニュアル",
      reflectionDateTime: "",
      completionStatus: "completed",
      staffId: "staff-001",
      requirementId: "req-001"
    };

    expect(() => validateGraduationRequirement(incompleteData)).toThrow(
      /反映日時/
    );
  });

  test("完了ステータスが空の場合、卒業要件判定がエラーで終了される", () => {
    const incompleteData = {
      documentName: "営業報告書集計業務マニュアル",
      reflectionDateTime: "2024-01-15T10:00:00Z",
      completionStatus: "",
      staffId: "staff-001",
      requirementId: "req-001"
    };

    expect(() => validateGraduationRequirement(incompleteData)).toThrow(
      /完了ステータス/
    );
  });

  test("スタッフIDが空の場合、卒業要件判定がエラーで終了される", () => {
    const incompleteData = {
      documentName: "契約書管理業務マニュアル",
      reflectionDateTime: "2024-01-15T11:00:00Z",
      completionStatus: "completed",
      staffId: "",
      requirementId: "req-001"
    };

    expect(() => validateGraduationRequirement(incompleteData)).toThrow(
      /スタッフID/
    );
  });

  test("要件IDが空の場合、卒業要件判定がエラーで終了される", () => {
    const incompleteData = {
      documentName: "請求書作成業務マニュアル",
      reflectionDateTime: "2024-01-15T12:00:00Z",
      completionStatus: "completed",
      staffId: "staff-001",
      requirementId: ""
    };

    expect(() => validateGraduationRequirement(incompleteData)).toThrow(
      /要件ID/
    );
  });

  test("完全なドキュメント反映状況データの場合、卒業要件判定が成功する", () => {
    const completeData = {
      documentName: "請求書作成業務マニュアル",
      reflectionDateTime: "2024-01-15T09:30:00Z",
      completionStatus: "completed",
      staffId: "staff-001",
      requirementId: "req-001"
    };

    const result = validateGraduationRequirement(completeData);
    expect(result).toEqual({
      isValid: true,
      hasErrors: false,
      staffId: "staff-001",
      requirementId: "req-001"
    });
  });

  test("無効な完了ステータス値の場合、卒業要件判定がエラーで終了される", () => {
    const invalidStatusData = {
      documentName: "営業報告書集計業務マニュアル",
      reflectionDateTime: "2024-01-15T14:00:00Z",
      completionStatus: "invalid_status",
      staffId: "staff-001",
      requirementId: "req-001"
    };

    expect(() =>
      validateGraduationRequirement(invalidStatusData)
    ).toThrow(/完了ステータス/);
  });

  test("複数の必須項目が空の場合、最初のエラー項目を特定して報告される", () => {
    const multipleEmptyData = {
      documentName: "",
      reflectionDateTime: "",
      completionStatus: "completed",
      staffId: "staff-001",
      requirementId: "req-001"
    };

    expect(() =>
      validateGraduationRequirement(multipleEmptyData)
    ).toThrow(/ドキュメント名/);
  });
});