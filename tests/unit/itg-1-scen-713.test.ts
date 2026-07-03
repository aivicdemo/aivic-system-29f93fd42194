import { describe, test, expect, beforeEach } from "@jest/globals";
import {
  generateCorrectionInstructionFromErrors,
  validateCorrectionInstructionFormat,
} from "../../src/logic/it-1781935279444-2-2-1";

describe("営業データ品質管理・修正指示機能", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // SCEN-713: [edge] 修正指示生成・通知機能 - 修正指示フォーマットの最大文字数制限内で全エラー情報が収まるか検証される
  test("複数のエラーを含む営業データから修正指示を生成し、フォーマット制限内に全エラー情報が収まることを検証する", () => {
    const MAX_INSTRUCTION_LENGTH = 2000;

    const salesDataRecord = {
      recordId: "REC-20240115-001",
      customerId: "CUST-A001",
      appointmentCount: "invalid_number",
      contractCount: -5,
      serviceType: null,
      contactDate: "2024-13-45",
      revenueAmount: "99999999.99",
      status: "UNKNOWN_STATUS",
      operatorName: "",
      createdAt: "2024-01-15T10:00:00Z",
    };

    const validationErrors = [
      {
        fieldName: "appointmentCount",
        errorType: "データ型エラー",
        errorMessage:
          "アポイント数は数値である必要があります。現在の値: invalid_number",
        severity: "error",
      },
      {
        fieldName: "contractCount",
        errorType: "値の範囲エラー",
        errorMessage: "成約数は0以上である必要があります。現在の値: -5",
        severity: "error",
      },
      {
        fieldName: "serviceType",
        errorType: "必須項目不足",
        errorMessage: "サービス種別は必須項目です",
        severity: "error",
      },
      {
        fieldName: "contactDate",
        errorType: "日付形式エラー",
        errorMessage: "接触日時の形式が不正です。形式: YYYY-MM-DD",
        severity: "error",
      },
      {
        fieldName: "revenueAmount",
        errorType: "金額計算エラー",
        errorMessage:
          "収益額は契約条件を超えています。現在の値: 99999999.99",
        severity: "warning",
      },
      {
        fieldName: "status",
        errorType: "列挙値エラー",
        errorMessage:
          "ステータスは以下の値のいずれかである必要があります: ACTIVE, PENDING, COMPLETED",
        severity: "error",
      },
      {
        fieldName: "operatorName",
        errorType: "必須項目不足",
        errorMessage: "営業担当者名は必須項目です",
        severity: "error",
      },
    ];

    const correctionInstruction = generateCorrectionInstructionFromErrors({
      recordId: salesDataRecord.recordId,
      customerId: salesDataRecord.customerId,
      errors: validationErrors,
      maxLength: MAX_INSTRUCTION_LENGTH,
      generatedAt: "2024-01-15T11:00:00Z",
    });

    expect(correctionInstruction).toBeDefined();
    expect(typeof correctionInstruction.instructionId).toBe("string");
    expect(correctionInstruction.instructionId).toMatch(/^CORR-/);

    expect(correctionInstruction.recordId).toBe(salesDataRecord.recordId);
    expect(correctionInstruction.customerId).toBe(salesDataRecord.customerId);

    const totalContent =
      correctionInstruction.headerSection +
      correctionInstruction.errorDetailsSection +
      correctionInstruction.footerSection;

    expect(totalContent.length).toBeLessThanOrEqual(MAX_INSTRUCTION_LENGTH);

    const errorCount = correctionInstruction.errorDetailsSection.split(
      "エラー"
    ).length - 1;
    expect(errorCount).toBeGreaterThanOrEqual(7);

    expect(correctionInstruction.errorDetailsSection).toContain("データ型エラー");
    expect(correctionInstruction.errorDetailsSection).toContain("値の範囲エラー");
    expect(correctionInstruction.errorDetailsSection).toContain("必須項目不足");
    expect(correctionInstruction.errorDetailsSection).toContain("日付形式エラー");
    expect(correctionInstruction.errorDetailsSection).toContain("金額計算エラー");
    expect(correctionInstruction.errorDetailsSection).toContain("列挙値エラー");

    expect(correctionInstruction.errorDetailsSection).toContain("appointmentCount");
    expect(correctionInstruction.errorDetailsSection).toContain("contractCount");
    expect(correctionInstruction.errorDetailsSection).toContain("serviceType");
    expect(correctionInstruction.errorDetailsSection).toContain("contactDate");
    expect(correctionInstruction.errorDetailsSection).toContain("revenueAmount");
    expect(correctionInstruction.errorDetailsSection).toContain("status");
    expect(correctionInstruction.errorDetailsSection).toContain("operatorName");

    expect(correctionInstruction.headerSection).toContain(
      salesDataRecord.recordId
    );
    expect(correctionInstruction.headerSection).toContain(
      salesDataRecord.customerId
    );

    expect(correctionInstruction.footerSection).toContain("2024-01-15");

    const formatValidationResult = validateCorrectionInstructionFormat({
      instruction: correctionInstruction,
      maxLength: MAX_INSTRUCTION_LENGTH,
    });

    expect(formatValidationResult.isValid).toBe(true);
    expect(formatValidationResult.totalCharacterCount).toBeLessThanOrEqual(
      MAX_INSTRUCTION_LENGTH
    );
    expect(formatValidationResult.totalCharacterCount).toBeGreaterThan(0);
    expect(formatValidationResult.errorInfoCompleteFlag).toBe(true);
    expect(formatValidationResult.missingErrorFields).toEqual([]);

    expect(correctionInstruction.notificationStatus).toBe("PENDING");
    expect(correctionInstruction.operatorAssignmentRequired).toBe(true);
    expect(correctionInstruction.correctionDeadline).toBe("2024-01-22");

    expect(correctionInstruction.errorSummary).toContain("error");
    expect(correctionInstruction.errorSummary.errorCount).toBeGreaterThanOrEqual(
      7
    );
    expect(correctionInstruction.errorSummary.warningCount).toBeGreaterThanOrEqual(
      1
    );

    const charRatioToLimit =
      totalContent.length / MAX_INSTRUCTION_LENGTH;
    expect(charRatioToLimit).toBeLessThanOrEqual(1.0);
    expect(charRatioToLimit).toBeGreaterThan(0.5);

    expect(() => {
      validateCorrectionInstructionFormat({
        instruction: correctionInstruction,
        maxLength: totalContent.length - 1,
      });
    }).toThrow(/最大文字数/);

    const notificationPayload = {
      instructionId: correctionInstruction.instructionId,
      recipientUserId: "USR-OPE-001",
      recipientEmail: "operator@example.com",
      notificationType: "CORRECTION_REQUIRED",
      priority: "HIGH",
      sendAt: "2024-01-15T11:15:00Z",
    };

    expect(notificationPayload.instructionId).toBe(
      correctionInstruction.instructionId
    );
    expect(notificationPayload.priority).toBe("HIGH");
    expect(notificationPayload.notificationType).toBe("CORRECTION_REQUIRED");

    expect(correctionInstruction).toHaveProperty("instructionId");
    expect(correctionInstruction).toHaveProperty("recordId");
    expect(correctionInstruction).toHaveProperty("customerId");
    expect(correctionInstruction).toHaveProperty("headerSection");
    expect(correctionInstruction).toHaveProperty("errorDetailsSection");
    expect(correctionInstruction).toHaveProperty("footerSection");
    expect(correctionInstruction).toHaveProperty("notificationStatus");
    expect(correctionInstruction).toHaveProperty("operatorAssignmentRequired");
    expect(correctionInstruction).toHaveProperty("correctionDeadline");
  });
});