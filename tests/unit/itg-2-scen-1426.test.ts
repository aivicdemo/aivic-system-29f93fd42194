import { validateProductionReadiness } from "../../src/logic/it-6-2-2-1";

describe("修正内容の本番環境適用可否判定", () => {
  // SCEN-1426
  test("修正内容が全検証項目を満たす場合に本番適用可能と判定される", () => {
    // Arrange
    const correctionData = {
      correctionId: "CORR-20240215-001",
      correctionContent: "OCRモデル再学習完了",
      correctionDate: "2024-02-15T10:30:00Z",
      implementedBy: "OP-001",
      qualityChecks: {
        codeQuality: {
          status: "PASS",
          score: 95,
          threshold: 80,
        },
        performance: {
          status: "PASS",
          score: 88,
          threshold: 75,
        },
        security: {
          status: "PASS",
          score: 92,
          threshold: 85,
        },
        documentation: {
          status: "PASS",
          score: 90,
          threshold: 80,
        },
        testCoverage: {
          status: "PASS",
          score: 87,
          threshold: 85,
        },
      },
    };

    // Act
    const result = validateProductionReadiness(correctionData);

    // Assert
    expect(result).toEqual({
      correctionId: "CORR-20240215-001",
      allChecksPassed: true,
      productionApprovalStatus: "Approved",
      checkResults: [
        {
          checkName: "codeQuality",
          status: "PASS",
          score: 95,
          threshold: 80,
          isPassing: true,
        },
        {
          checkName: "performance",
          status: "PASS",
          score: 88,
          threshold: 75,
          isPassing: true,
        },
        {
          checkName: "security",
          status: "PASS",
          score: 92,
          threshold: 85,
          isPassing: true,
        },
        {
          checkName: "documentation",
          status: "PASS",
          score: 90,
          threshold: 80,
          isPassing: true,
        },
        {
          checkName: "testCoverage",
          status: "PASS",
          score: 87,
          threshold: 85,
          isPassing: true,
        },
      ],
      passCount: 5,
      failCount: 0,
      approvalTimestamp: expect.any(String),
    });

    expect(result.allChecksPassed).toBe(true);
    expect(result.productionApprovalStatus).toBe("Approved");
    expect(result.passCount).toBe(5);
    expect(result.failCount).toBe(0);
    expect(result.checkResults.every((check) => check.isPassing)).toBe(true);
  });

  // Additional boundary test: 1 item fails
  test("1つの検証項目が不合格の場合に本番適用不可と判定される", () => {
    // Arrange
    const correctionData = {
      correctionId: "CORR-20240215-002",
      correctionContent: "判定ロジック修正",
      correctionDate: "2024-02-15T11:00:00Z",
      implementedBy: "OP-002",
      qualityChecks: {
        codeQuality: {
          status: "PASS",
          score: 85,
          threshold: 80,
        },
        performance: {
          status: "FAIL",
          score: 60,
          threshold: 75,
        },
        security: {
          status: "PASS",
          score: 90,
          threshold: 85,
        },
        documentation: {
          status: "PASS",
          score: 88,
          threshold: 80,
        },
        testCoverage: {
          status: "PASS",
          score: 86,
          threshold: 85,
        },
      },
    };

    // Act
    const result = validateProductionReadiness(correctionData);

    // Assert
    expect(result.allChecksPassed).toBe(false);
    expect(result.productionApprovalStatus).toBe("Rejected");
    expect(result.passCount).toBe(4);
    expect(result.failCount).toBe(1);
    expect(
      result.checkResults.find((check) => check.checkName === "performance")
        ?.isPassing
    ).toBe(false);
  });

  // Edge case: all checks fail
  test("全検証項目が不合格の場合に本番適用不可と判定される", () => {
    // Arrange
    const correctionData = {
      correctionId: "CORR-20240215-003",
      correctionContent: "未完成修正",
      correctionDate: "2024-02-15T12:00:00Z",
      implementedBy: "OP-003",
      qualityChecks: {
        codeQuality: {
          status: "FAIL",
          score: 50,
          threshold: 80,
        },
        performance: {
          status: "FAIL",
          score: 40,
          threshold: 75,
        },
        security: {
          status: "FAIL",
          score: 45,
          threshold: 85,
        },
        documentation: {
          status: "FAIL",
          score: 30,
          threshold: 80,
        },
        testCoverage: {
          status: "FAIL",
          score: 60,
          threshold: 85,
        },
      },
    };

    // Act
    const result = validateProductionReadiness(correctionData);

    // Assert
    expect(result.allChecksPassed).toBe(false);
    expect(result.productionApprovalStatus).toBe("Rejected");
    expect(result.passCount).toBe(0);
    expect(result.failCount).toBe(5);
  });

  // Validation error: missing correctionId
  test("必須フィールド（correctionId）が欠落している場合にエラーを発生させる", () => {
    // Arrange
    const invalidData = {
      correctionContent: "修正内容",
      correctionDate: "2024-02-15T10:30:00Z",
      implementedBy: "OP-001",
      qualityChecks: {
        codeQuality: { status: "PASS", score: 90, threshold: 80 },
        performance: { status: "PASS", score: 85, threshold: 75 },
        security: { status: "PASS", score: 88, threshold: 85 },
        documentation: { status: "PASS", score: 85, threshold: 80 },
        testCoverage: { status: "PASS", score: 86, threshold: 85 },
      },
    };

    // Act & Assert
    expect(() => validateProductionReadiness(invalidData as any)).toThrow(
      /correctionId/
    );
  });

  // Validation error: missing qualityChecks
  test("質問管理チェック情報が欠落している場合にエラーを発生させる", () => {
    // Arrange
    const invalidData = {
      correctionId: "CORR-20240215-004",
      correctionContent: "修正内容",
      correctionDate: "2024-02-15T10:30:00Z",
      implementedBy: "OP-001",
    };

    // Act & Assert
    expect(() => validateProductionReadiness(invalidData as any)).toThrow(
      /qualityChecks/
    );
  });

  // Validation error: invalid score range
  test("スコアが有効範囲外（0-100）の場合にエラーを発生させる", () => {
    // Arrange
    const correctionData = {
      correctionId: "CORR-20240215-005",
      correctionContent: "修正内容",
      correctionDate: "2024-02-15T10:30:00Z",
      implementedBy: "OP-001",
      qualityChecks: {
        codeQuality: {
          status: "PASS",
          score: 150,
          threshold: 80,
        },
        performance: { status: "PASS", score: 85, threshold: 75 },
        security: { status: "PASS", score: 88, threshold: 85 },
        documentation: { status: "PASS", score: 85, threshold: 80 },
        testCoverage: { status: "PASS", score: 86, threshold: 85 },
      },
    };

    // Act & Assert
    expect(() => validateProductionReadiness(correctionData)).toThrow(/score/);
  });

  // Edge case: threshold boundary - exactly at threshold
  test("スコアが閾値と等しい場合に合格と判定される", () => {
    // Arrange
    const correctionData = {
      correctionId: "CORR-20240215-006",
      correctionContent: "境界値テスト",
      correctionDate: "2024-02-15T13:00:00Z",
      implementedBy: "OP-004",
      qualityChecks: {
        codeQuality: {
          status: "PASS",
          score: 80,
          threshold: 80,
        },
        performance: {
          status: "PASS",
          score: 75,
          threshold: 75,
        },
        security: {
          status: "PASS",
          score: 85,
          threshold: 85,
        },
        documentation: {
          status: "PASS",
          score: 80,
          threshold: 80,
        },
        testCoverage: {
          status: "PASS",
          score: 85,
          threshold: 85,
        },
      },
    };

    // Act
    const result = validateProductionReadiness(correctionData);

    // Assert
    expect(result.allChecksPassed).toBe(true);
    expect(result.productionApprovalStatus).toBe("Approved");
    expect(result.passCount).toBe(5);
  });
});