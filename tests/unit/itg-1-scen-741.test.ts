import { describe, test, expect, beforeEach } from "@jest/globals";
import {
  validateCorrectionAttempt,
  resetCorrectionCounter,
  type CorrectionAttemptInput,
  type CorrectionAttemptResult,
} from "../../src/logic/it-1781935279444-2-2-1";

describe("営業データ品質チェック・修正サイクル - 修正指示回数制限と無限ループ検出", () => {
  // SCEN-741
  test("修正指示の最大回数制限（10回）で無限ループが検出され、異常状態が適切に処理される", () => {
    const MAX_CORRECTION_ATTEMPTS = 10;
    const salesDataId = "sales-data-001";
    const userId = "user-001";

    // ケース1: カウンター9回（最大-1）で1回追加実行 → 10回に到達
    let correctionAttemptInput_case1: CorrectionAttemptInput = {
      salesDataId,
      userId,
      attemptCount: 9,
      correctionContent: "数値を修正しました",
      timestamp: new Date("2024-01-15T10:00:00Z"),
    };

    const result_case1: CorrectionAttemptResult = validateCorrectionAttempt(
      correctionAttemptInput_case1
    );

    expect(result_case1.success).toBe(true);
    expect(result_case1.attemptCount).toBe(10);
    expect(result_case1.isMaxReached).toBe(true);
    expect(result_case1.message).toMatch(/最大回数に達しました/);

    // ケース2: カウンター10回（最大）で追加実行 → ブロック
    let correctionAttemptInput_case2: CorrectionAttemptInput = {
      salesDataId,
      userId,
      attemptCount: 10,
      correctionContent: "数値を修正しました",
      timestamp: new Date("2024-01-15T10:05:00Z"),
    };

    expect(() => {
      validateCorrectionAttempt(correctionAttemptInput_case2);
    }).toThrow(/無限ループ/);

    // ケース3: カウンター11回（最大+1）で実行 → 異常状態
    let correctionAttemptInput_case3: CorrectionAttemptInput = {
      salesDataId,
      userId,
      attemptCount: 11,
      correctionContent: "数値を修正しました",
      timestamp: new Date("2024-01-15T10:10:00Z"),
    };

    expect(() => {
      validateCorrectionAttempt(correctionAttemptInput_case3);
    }).toThrow(/異常状態/);

    // ケース4: リセット実行
    const resetResult = resetCorrectionCounter(salesDataId);

    expect(resetResult.success).toBe(true);
    expect(resetResult.attemptCount).toBe(0);
    expect(resetResult.message).toMatch(/リセット/);

    // ケース5: リセット後、カウンター0で新たに実行可能
    let correctionAttemptInput_case5: CorrectionAttemptInput = {
      salesDataId,
      userId,
      attemptCount: 0,
      correctionContent: "数値を修正しました",
      timestamp: new Date("2024-01-15T10:15:00Z"),
    };

    const result_case5: CorrectionAttemptResult = validateCorrectionAttempt(
      correctionAttemptInput_case5
    );

    expect(result_case5.success).toBe(true);
    expect(result_case5.attemptCount).toBe(1);
    expect(result_case5.isMaxReached).toBe(false);

    // ケース6: 履歴ログに回数制限超過記録が残る
    expect(result_case1.historyLog).toBeDefined();
    expect(result_case1.historyLog).toContain("attempt_count_9_to_10");
    expect(result_case1.historyLog).toMatch(/MAX_REACHED/);

    // ケース7: 最大回数に達した状態での詳細検証
    expect(result_case1.statusCode).toBe("MAX_ATTEMPTS_REACHED");
    expect(result_case1.isLoopDetected).toBe(false);

    // カウンター10回でのブロック時、ループ検出フラグが立つ
    let loopDetectionInput: CorrectionAttemptInput = {
      salesDataId: "sales-data-002",
      userId,
      attemptCount: 10,
      correctionContent: "修正試行",
      timestamp: new Date("2024-01-15T10:20:00Z"),
    };

    expect(() => {
      validateCorrectionAttempt(loopDetectionInput);
    }).toThrow(/無限ループ/);

    // ケース8: カウンター範囲外（負数）で実行 → 例外
    let invalidInput: CorrectionAttemptInput = {
      salesDataId,
      userId,
      attemptCount: -1,
      correctionContent: "修正試行",
      timestamp: new Date("2024-01-15T10:25:00Z"),
    };

    expect(() => {
      validateCorrectionAttempt(invalidInput);
    }).toThrow(/カウンター値/);

    // ケース9: 複数回の修正指示サイクル検証
    const multiCycleInput1: CorrectionAttemptInput = {
      salesDataId: "sales-data-003",
      userId,
      attemptCount: 0,
      correctionContent: "1回目修正",
      timestamp: new Date("2024-01-15T11:00:00Z"),
    };

    const multiResult1 = validateCorrectionAttempt(multiCycleInput1);
    expect(multiResult1.attemptCount).toBe(1);

    const multiCycleInput2: CorrectionAttemptInput = {
      salesDataId: "sales-data-003",
      userId,
      attemptCount: 1,
      correctionContent: "2回目修正",
      timestamp: new Date("2024-01-15T11:05:00Z"),
    };

    const multiResult2 = validateCorrectionAttempt(multiCycleInput2);
    expect(multiResult2.attemptCount).toBe(2);

    // ケース10: リセット後は新しいサイクルが開始される
    resetCorrectionCounter("sales-data-003");

    const postResetInput: CorrectionAttemptInput = {
      salesDataId: "sales-data-003",
      userId,
      attemptCount: 0,
      correctionContent: "新サイクル1回目",
      timestamp: new Date("2024-01-15T11:10:00Z"),
    };

    const postResetResult = validateCorrectionAttempt(postResetInput);
    expect(postResetResult.attemptCount).toBe(1);
    expect(postResetResult.cycleCount).toBe(2);
  });
});