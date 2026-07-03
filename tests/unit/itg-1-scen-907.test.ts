import { describe, test, expect } from "@jest/globals";
import {
  recordExceptionCase,
  ExceptionCaseRecord,
} from "../../src/logic/it-1781935279444-2-2-1";

describe("月次営業データ品質チェック例外ケース記録", () => {
  // SCEN-907: 営業データ品質チェック中の予期しない例外が発生した場合、例外内容・採用判断基準・理由を構造化フォーマットで記録できる
  test("営業データ品質チェック例外を構造化フォーマットで記録し、保存後も形式が崩れずに保持される", () => {
    // Arrange: 営業データ品質チェック中に発生した例外情報を準備
    const exceptionDetectedAt = new Date("2024-01-25T10:30:00Z");
    const exceptionInput = {
      exceptionType: "data_format_error",
      exceptionMessage: "営業データの日付フィールドが無効な形式です",
      exceptionStackTrace:
        'Error: Invalid date format at parseDate (validator.ts:45)',
      affectedRecordCount: 15,
      affectedFieldNames: ["contact_date", "closing_date"],
      detectionTimestamp: exceptionDetectedAt.toISOString(),
      systemContext: {
        monthlyClosingDate: "2024-01-25",
        processPhase: "quality_validation",
        userId: "OP001",
      },
    };

    // Act: 例외ケースを記録する
    const recordedResult: ExceptionCaseRecord = recordExceptionCase({
      exceptionType: exceptionInput.exceptionType,
      exceptionMessage: exceptionInput.exceptionMessage,
      exceptionStackTrace: exceptionInput.exceptionStackTrace,
      affectedRecordCount: exceptionInput.affectedRecordCount,
      affectedFieldNames: exceptionInput.affectedFieldNames,
      detectionTimestamp: exceptionInput.detectionTimestamp,
      systemContext: exceptionInput.systemContext,
    });

    // Assert 1: 記録された例外内容が正確に反映されている
    expect(recordedResult.exceptionContent.exceptionType).toBe(
      "data_format_error"
    );
    expect(recordedResult.exceptionContent.exceptionMessage).toBe(
      "営業データの日付フィールドが無効な形式です"
    );

    // Assert 2: 採用判断基準が自動入力されている
    // 予期しない例外 (data_format_error) は「要確認」判定基準で自動入力される
    expect(recordedResult.adoptionJudgmentCriteria).toBe("require_review");
    expect(recordedResult.adoptionJudgmentLevel).toBe("high");

    // Assert 3: 理由が構造化形式で記録されている
    expect(recordedResult.reasonStructured).toEqual({
      rootCause: "invalid_date_format",
      affectedFieldCount: 2,
      affectedRecordCount: 15,
      detectionPhase: "quality_validation",
      suggestedAction: "manual_inspection_and_correction",
    });

    // Assert 4: 記録内容が構造化フォーマット（JSON形式相当）で整形されている
    expect(recordedResult.structuredFormat).toBe("json");
    expect(typeof recordedResult.recordId).toBe("string");
    expect(recordedResult.recordId.length).toBeGreaterThan(0);

    // Assert 5: タイムスタンプが正確に記録されている
    expect(recordedResult.recordedAt).toBe(exceptionInput.detectionTimestamp);

    // Assert 6: 記録内容を JSON 文字列化して保存可能性を検証
    const jsonString = JSON.stringify(recordedResult);
    const parsedBack: ExceptionCaseRecord = JSON.parse(jsonString);

    // Assert 7: 保存後、검색時에도 형식이 崩れずに保持されている
    expect(parsedBack.exceptionContent.exceptionType).toBe(
      recordedResult.exceptionContent.exceptionType
    );
    expect(parsedBack.adoptionJudgmentCriteria).toBe(
      recordedResult.adoptionJudgmentCriteria
    );
    expect(parsedBack.reasonStructured).toEqual(
      recordedResult.reasonStructured
    );
    expect(parsedBack.structuredFormat).toBe("json");

    // Assert 8: システムコンテキストも完全に保持されている
    expect(parsedBack.systemContext).toEqual({
      monthlyClosingDate: "2024-01-25",
      processPhase: "quality_validation",
      userId: "OP001",
    });

    // Assert 9: 影響範囲の詳細が正確に記録されている
    expect(parsedBack.affectedFieldNames).toEqual(
      exceptionInput.affectedFieldNames
    );
    expect(parsedBack.affectedRecordCount).toBe(15);

    // Assert 10: 記録内容の完全性を検証（すべての必須フィールドが存在）
    expect(Object.keys(recordedResult)).toContain("exceptionContent");
    expect(Object.keys(recordedResult)).toContain("adoptionJudgmentCriteria");
    expect(Object.keys(recordedResult)).toContain("reasonStructured");
    expect(Object.keys(recordedResult)).toContain("recordId");
    expect(Object.keys(recordedResult)).toContain("recordedAt");
    expect(Object.keys(recordedResult)).toContain("structuredFormat");
  });
});