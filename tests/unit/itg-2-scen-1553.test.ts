import { describe, test, expect, beforeEach, afterEach } from "@jest/globals";

// Logic import
import { recordOcrPrecisionVerificationResult } from "../../src/logic/it-6-2-1-1";

// Mock types
interface OcrPrecisionVerificationInput {
  documentId: string;
  assessorId: string;
  verificationTimestamp: string;
  verificationItems: {
    itemName: string;
    standard: number;
    actualValue: number;
    isPassed: boolean;
  }[];
  judgmentResult: "pass" | "fail";
  comment?: string;
}

interface OcrPrecisionVerificationRecord {
  recordId: string;
  documentId: string;
  assessorId: string;
  verificationTimestamp: string;
  recordedAt: string;
  verificationItems: {
    itemName: string;
    standard: number;
    actualValue: number;
    isPassed: boolean;
  }[];
  judgmentResult: "pass" | "fail";
  comment: string | null;
  isRecordedCorrectly: boolean;
}

describe("査定担当者別・工種別・金額帯別の判定精度指標の自動集計と可視化", () => {
  let fetchMock: any;

  beforeEach(() => {
    fetchMock = require("jest-fetch-mock");
    fetchMock.enableMocks();
    fetchMock.resetMocks();
  });

  afterEach(() => {
    fetchMock.disableMocks();
  });

  // SCEN-1553: [normal] 見積査定員による運用マニュアン検証と合否判定 - 見積査定員がOCR精度基準の検証項目について合格と判定した場合、その判定が正しく記録される
  test("SCEN-1553: 見積査定員がOCR精度基準の検証項目について合格と判定した場合、その判定が正しく記録される", async () => {
    // Arrange: テストデータ準備
    const assessor_id = "ASSESSOR_001";
    const document_id = "DOC_20240115_001";
    const verification_timestamp = "2024-01-15T11:00:00Z";
    const recorded_at = "2024-01-15T11:05:00Z";

    const verification_input: OcrPrecisionVerificationInput = {
      documentId: document_id,
      assessorId: assessor_id,
      verificationTimestamp: verification_timestamp,
      verificationItems: [
        {
          itemName: "認識精度",
          standard: 95,
          actualValue: 97,
          isPassed: true,
        },
        {
          itemName: "フォーマット正確性",
          standard: 90,
          actualValue: 92,
          isPassed: true,
        },
        {
          itemName: "データ整合性",
          standard: 90,
          actualValue: 91,
          isPassed: true,
        },
      ],
      judgmentResult: "pass",
      comment: "すべての項目が基準を満たしている",
    };

    // Mock: システムデータベースへの記録APIレスポンス
    const expected_record_id = "RECORD_20240115_001";
    fetchMock.mockResponseOnce(
      JSON.stringify({
        recordId: expected_record_id,
        documentId: document_id,
        assessorId: assessor_id,
        verificationTimestamp: verification_timestamp,
        recordedAt: recorded_at,
        verificationItems: verification_input.verificationItems,
        judgmentResult: "pass",
        comment: verification_input.comment || null,
        isRecordedCorrectly: true,
      }),
      { status: 200 }
    );

    // Act: 合格判定を記録
    const result = await recordOcrPrecisionVerificationResult(
      verification_input
    );

    // Assert: 返却結果の検証
    expect(result).toBeDefined();
    expect(result.recordId).toBe(expected_record_id);
    expect(result.documentId).toBe(document_id);
    expect(result.assessorId).toBe(assessor_id);
    expect(result.verificationTimestamp).toBe(verification_timestamp);
    expect(result.recordedAt).toBe(recorded_at);

    // 検証項目の詳細確認
    expect(result.verificationItems).toHaveLength(3);
    expect(result.verificationItems[0]).toEqual({
      itemName: "認識精度",
      standard: 95,
      actualValue: 97,
      isPassed: true,
    });
    expect(result.verificationItems[1]).toEqual({
      itemName: "フォーマット正確性",
      standard: 90,
      actualValue: 92,
      isPassed: true,
    });
    expect(result.verificationItems[2]).toEqual({
      itemName: "データ整合性",
      standard: 90,
      actualValue: 91,
      isPassed: true,
    });

    // 判定結果の確認
    expect(result.judgmentResult).toBe("pass");
    expect(result.comment).toBe("すべての項目が基準を満たしている");

    // 記録の正確性確認
    expect(result.isRecordedCorrectly).toBe(true);

    // API呼び出しの検証
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining("/api/ocr-precision-verification"),
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          "Content-Type": "application/json",
        }),
      })
    );
  });
});