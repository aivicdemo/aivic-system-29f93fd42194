import { recordAuditTrailForCorrectionWhenModified } from "../../src/logic/it-6-2-2-1";

describe("修正履歴自動記録・検索機能", () => {
  test("SCEN-740: 修正後の金額が修正前と同一のとき修正として記録されない", () => {
    // 初期状態: 既存の査定記録
    const assessmentId = "ASS-2024-001";
    const assessorId = "ASSOR-001";
    const originalAmount = 5000000;
    const correctionReason = "金額確認";
    const correctionAmountSameAsOriginal = 5000000;

    // 修正前後の金額が同一であるケース
    const correctionRecordSameAmount = {
      assessmentId,
      assessorId,
      beforeAmount: originalAmount,
      afterAmount: correctionAmountSameAsOriginal,
      reason: correctionReason,
      timestamp: new Date("2024-01-15T10:30:00Z"),
    };

    const resultSameAmount = recordAuditTrailForCorrectionWhenModified(
      correctionRecordSameAmount
    );

    // 修正前後の金額が同一の場合、修正履歴に追加されない
    expect(resultSameAmount.isRecorded).toBe(false);
    expect(resultSameAmount.correctionId).toBeNull();
    expect(resultSameAmount.reason).toBe("修正前後の金額が同一のため記録対象外");

    // 修正後の金額が修正前と異なるケース（コントラスト）
    const correctionAmountDifferent = 5100000;
    const correctionRecordDifferentAmount = {
      assessmentId,
      assessorId,
      beforeAmount: originalAmount,
      afterAmount: correctionAmountDifferent,
      reason: correctionReason,
      timestamp: new Date("2024-01-15T10:30:00Z"),
    };

    const resultDifferentAmount = recordAuditTrailForCorrectionWhenModified(
      correctionRecordDifferentAmount
    );

    // 修正前後の金額が異なる場合、修正履歴に追加される
    expect(resultDifferentAmount.isRecorded).toBe(true);
    expect(typeof resultDifferentAmount.correctionId).toBe("string");
    expect(resultDifferentAmount.correctionId).toMatch(/^CORR-/);

    // 修正履歴検索: 金額が同一のため検索結果に表示されない
    const searchResultSameAmount = {
      assessmentId,
      assessorId,
      beforeAmount: originalAmount,
      afterAmount: correctionAmountSameAsOriginal,
    };

    const foundRecordsSameAmount =
      recordAuditTrailForCorrectionWhenModified.search(searchResultSameAmount);
    expect(foundRecordsSameAmount).toHaveLength(0);

    // 修正履歴検索: 金額が異なる場合、検索結果に表示される
    const searchResultDifferentAmount = {
      assessmentId,
      assessorId,
      beforeAmount: originalAmount,
      afterAmount: correctionAmountDifferent,
    };

    const foundRecordsDifferentAmount =
      recordAuditTrailForCorrectionWhenModified.search(searchResultDifferentAmount);
    expect(foundRecordsDifferentAmount.length).toBeGreaterThan(0);
    expect(foundRecordsDifferentAmount[0].beforeAmount).toBe(originalAmount);
    expect(foundRecordsDifferentAmount[0].afterAmount).toBe(
      correctionAmountDifferent
    );

    // エラーケース: 修正前金額が不正
    const invalidCorrectionRecord = {
      assessmentId,
      assessorId,
      beforeAmount: null,
      afterAmount: correctionAmountDifferent,
      reason: correctionReason,
      timestamp: new Date("2024-01-15T10:30:00Z"),
    };

    expect(() =>
      recordAuditTrailForCorrectionWhenModified(invalidCorrectionRecord as any)
    ).toThrow(/修正前金額/);

    // エラーケース: 修正後金額が不正
    const invalidAfterAmountRecord = {
      assessmentId,
      assessorId,
      beforeAmount: originalAmount,
      afterAmount: undefined,
      reason: correctionReason,
      timestamp: new Date("2024-01-15T10:30:00Z"),
    };

    expect(() =>
      recordAuditTrailForCorrectionWhenModified(invalidAfterAmountRecord as any)
    ).toThrow(/修正後金額/);

    // エラーケース: 査定IDが不正
    const invalidAssessmentIdRecord = {
      assessmentId: "",
      assessorId,
      beforeAmount: originalAmount,
      afterAmount: correctionAmountDifferent,
      reason: correctionReason,
      timestamp: new Date("2024-01-15T10:30:00Z"),
    };

    expect(() =>
      recordAuditTrailForCorrectionWhenModified(invalidAssessmentIdRecord)
    ).toThrow(/査定ID/);
  });
});