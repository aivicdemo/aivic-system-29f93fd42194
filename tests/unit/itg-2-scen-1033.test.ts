import { describe, test, expect } from "@jest/globals";
import {
  recordNegotiationResult,
} from "../../src/logic/it-6-2-2-1";

describe("交渉結果統計集計機能 - 修正見積提出から最終合意までの記録", () => {
  test("SCEN-1033: 修正見積提出から最終合意に至った交渉が、修正前後の金額・乖離率・合意理由とともにシステムに記録される", () => {
    // Arrange: 交渉データを準備
    const caseId = "CASE-20240115-001";
    const originalAmount = 1000000; // 初期見積金額: 100万円
    const revisedAmount = 950000; // 修正見積金額: 95万円
    const agreementReason = "相場価格の確認";
    const agreementDate = new Date("2024-01-15T14:30:00Z");
    const assessorId = "ASSESSOR-001";

    // Act: 交渉結果を記録
    const result = recordNegotiationResult({
      caseId,
      originalAmount,
      revisedAmount,
      agreementReason,
      agreementDate,
      assessorId,
    });

    // Assert: 交渉結果が正確に記録されていることを確認
    expect(result.caseId).toBe("CASE-20240115-001");
    expect(result.originalAmount).toBe(1000000);
    expect(result.revisedAmount).toBe(950000);

    // 修正前後の金額差分を確認
    expect(result.amountDifference).toBe(50000);

    // 乖離率（5%）が自動計算・記録されていることを確認
    expect(result.deviationRate).toBe(5.0);

    // 合意理由が記録されていることを確認
    expect(result.agreementReason).toBe("相場価格の確認");

    // 交渉結果が統計集計可能な状態であることを確認
    expect(result.isRecorded).toBe(true);
    expect(result.recordedAt).toEqual(agreementDate);
    expect(result.assessorId).toBe("ASSESSOR-001");
  });
});