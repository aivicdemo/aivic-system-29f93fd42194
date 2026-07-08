import { verifyModelAccuracyBeforeFail } from "../../src/logic/it-6-3-1";

describe("AI judgment model relearning accuracy verification", () => {
  // SCEN-1508
  test("should return error when fail judgment is called before accuracy verification test", () => {
    const modelVerificationId = "model_verify_20240115_001";
    const modelVersion = "v2.1.0";
    const testEnvironmentState = "initialized";
    const accuracyVerificationStatus = "pending";

    const result = verifyModelAccuracyBeforeFail({
      modelVerificationId,
      modelVersion,
      testEnvironmentState,
      accuracyVerificationStatus,
    });

    expect(result.statusCode).toBe(422);
    expect(result.errorMessage).toMatch(/精度検証テスト/);
    expect(result.systemStateChanged).toBe(false);
    expect(result.errorCode).toBeDefined();
    expect(result.timestamp).toBeDefined();
  });
});