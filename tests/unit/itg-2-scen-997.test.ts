import { describe, test, expect, beforeEach } from "@jest/globals";
import {
  getPrioritizedReferenceCandidates,
} from "../../src/logic/it-6-3-1";

describe("査定判定ロジックの適用履歴と根拠の記録・検索機能", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // SCEN-997
  test("最適参照候補データの優先度付け表示 - 参照候補データが1件も存在しない場合、エラーが返される", () => {
    const assessmentCaseId = "CASE-2024-001";
    const assessmentDate = "2024-01-15";

    const result = getPrioritizedReferenceCandidates({
      assessmentCaseId,
      assessmentDate,
      referenceCandidates: [],
    });

    expect(result).toEqual({
      success: false,
      errorCode: "NO_REFERENCE_DATA",
      errorMessage: "参照データなし",
      displayMessage: "参照データなし",
      prioritizedList: [],
    });

    expect(result.success).toBe(false);
    expect(result.errorCode).toBe("NO_REFERENCE_DATA");
    expect(result.errorMessage).toMatch(/参照データなし/);
    expect(result.displayMessage).toMatch(/参照データなし/);
    expect(Array.isArray(result.prioritizedList)).toBe(true);
    expect(result.prioritizedList.length).toBe(0);
  });
});