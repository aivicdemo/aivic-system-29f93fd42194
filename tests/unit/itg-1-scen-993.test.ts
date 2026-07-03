import { describe, test, expect, beforeEach } from "@jest/globals";
import {
  registerExceptionCase,
  reflectExceptionCaseToManual,
  fetchManualContent,
  judgeExceptionCase,
} from "../../src/logic/it-1-2-1";

describe("請求ロジック・割引基準・例外パターン管理", () => {
  // SCEN-993: 新規例外ケースが発生した際に手順書に反映され全員で同じ基準で判定できる状態になる
  test("should register exception case, reflect to manual, sync across users, and produce consistent judgment results", () => {
    // ステップ1: テスト環境で新規の例外ケースをシステムに登録
    const exceptionCaseInput = {
      caseId: "EXC-2024-001",
      description: "複数割引同時適用時の計算順序",
      condition:
        "基本料金割引と成果報酬割引の両方が適用対象となる顧客の場合",
      judgmentCriteria: "基本料金割引を先に適用した後、成約数割引を適用する",
      resolutionMethod: "請求額 = (基本料金 × (1 - 基本割引率)) + (成約数 × 単価) × (1 - 成約割引率)",
      effectiveDate: "2024-02-01",
      priority: "high",
    };

    const registrationResult = registerExceptionCase(exceptionCaseInput);
    expect(registrationResult.success).toBe(true);
    expect(registrationResult.caseId).toBe("EXC-2024-001");
    expect(registrationResult.status).toBe("registered");

    // ステップ2: 例外ケースの詳細情報が正確に保存されていることを確認
    expect(registrationResult.storedData).toEqual({
      caseId: "EXC-2024-001",
      description: "複数割引同時適用時の計算順序",
      condition:
        "基本料金割引と成果報酬割引の両方が適用対象となる顧客の場合",
      judgmentCriteria: "基本料金割引を先に適用した後、成約数割引を適用する",
      resolutionMethod: "請求額 = (基本料金 × (1 - 基本割引率)) + (成約数 × 単価) × (1 - 成約割引率)",
      effectiveDate: "2024-02-01",
      priority: "high",
    });

    // ステップ3: 例外ケースを手順書に反映するための承認フローを実行
    const approvalInput = {
      caseId: "EXC-2024-001",
      approverUserId: "user-admin-001",
      approvalComment: "複数割引の計算順序は確認済みです。承認します。",
      timestamp: new Date("2024-02-01T10:00:00Z").toISOString(),
    };

    const approvalResult = reflectExceptionCaseToManual(approvalInput);
    expect(approvalResult.approved).toBe(true);
    expect(approvalResult.approvalStatus).toBe("approved");
    expect(approvalResult.caseId).toBe("EXC-2024-001");

    // ステップ4: システムが手順書を自動更新し、全ユーザーに同期されることを確認
    expect(approvalResult.manualUpdated).toBe(true);
    expect(approvalResult.syncStatus).toBe("synced");
    expect(approvalResult.manualVersion).toBe("2024-02-01-v1");

    // ステップ5: 複数の異なるユーザーアカウントでログインし、同じ例外ケースの手順書内容を表示
    const user1Id = "user-operator-001";
    const user2Id = "user-operator-002";
    const user3Id = "user-clerk-001";

    const user1ManualFetch = fetchManualContent({
      userId: user1Id,
      caseId: "EXC-2024-001",
      manualVersion: "2024-02-01-v1",
    });

    const user2ManualFetch = fetchManualContent({
      userId: user2Id,
      caseId: "EXC-2024-001",
      manualVersion: "2024-02-01-v1",
    });

    const user3ManualFetch = fetchManualContent({
      userId: user3Id,
      caseId: "EXC-2024-001",
      manualVersion: "2024-02-01-v1",
    });

    // ステップ6: 各ユーザーが表示した手順書の内容が完全に一致していることを確認
    expect(user1ManualFetch.content).toEqual(user2ManualFetch.content);
    expect(user2ManualFetch.content).toEqual(user3ManualFetch.content);

    const expectedManualContent = {
      caseId: "EXC-2024-001",
      description: "複数割引同時適用時の計算順序",
      condition:
        "基本料金割引と成果報酬割引の両方が適用対象となる顧客の場合",
      judgmentCriteria: "基本料金割引を先に適用した後、成約数割引を適用する",
      resolutionMethod: "請求額 = (基本料金 × (1 - 基本割引率)) + (成約数 × 単価) × (1 - 成約割引率)",
      effectiveDate: "2024-02-01",
      priority: "high",
      manualVersion: "2024-02-01-v1",
      lastUpdatedAt: "2024-02-01T10:00:00Z",
      approverUserId: "user-admin-001",
    };

    expect(user1ManualFetch.content).toEqual(expectedManualContent);
    expect(user2ManualFetch.content).toEqual(expectedManualContent);
    expect(user3ManualFetch.content).toEqual(expectedManualContent);

    // ステップ7: 実際に同じ例外ケースに対して各ユーザーが判定を実行
    const testScenario = {
      customerId: "CUST-999",
      baseFee: 100000,
      basicDiscountRate: 0.1,
      contractAchievementCount: 5,
      unitPrice: 10000,
      achievementDiscountRate: 0.05,
    };

    const user1JudgmentResult = judgeExceptionCase({
      userId: user1Id,
      caseId: "EXC-2024-001",
      manualVersion: "2024-02-01-v1",
      invoiceData: testScenario,
    });

    const user2JudgmentResult = judgeExceptionCase({
      userId: user2Id,
      caseId: "EXC-2024-001",
      manualVersion: "2024-02-01-v1",
      invoiceData: testScenario,
    });

    const user3JudgmentResult = judgeExceptionCase({
      userId: user3Id,
      caseId: "EXC-2024-001",
      manualVersion: "2024-02-01-v1",
      invoiceData: testScenario,
    });

    // ステップ8: 各ユーザーの判定結果が同じ基準で判定されたことを検証
    // 計算: 基本料金 × (1 - 基本割引率) + 成約数 × 単価 × (1 - 成約割引率)
    // = 100000 × (1 - 0.1) + 5 × 10000 × (1 - 0.05)
    // = 100000 × 0.9 + 50000 × 0.95
    // = 90000 + 47500
    // = 137500

    const expectedInvoiceAmount = 137500;

    expect(user1JudgmentResult.invoiceAmount).toBe(expectedInvoiceAmount);
    expect(user2JudgmentResult.invoiceAmount).toBe(expectedInvoiceAmount);
    expect(user3JudgmentResult.invoiceAmount).toBe(expectedInvoiceAmount);

    expect(user1JudgmentResult.calculationMethod).toBe(
      "基本料金割引を先に適用した後、成約数割引を適用する"
    );
    expect(user2JudgmentResult.calculationMethod).toBe(
      "基本料金割引を先に適用した後、成約数割引を適用する"
    );
    expect(user3JudgmentResult.calculationMethod).toBe(
      "基本料金割引を先に適用した後、成約数割引を適用する"
    );

    // 判定内容の完全一致確認
    expect(user1JudgmentResult).toEqual({
      userId: user1Id,
      caseId: "EXC-2024-001",
      manualVersion: "2024-02-01-v1",
      invoiceAmount: expectedInvoiceAmount,
      calculationMethod:
        "基本料金割引を先に適用した後、成約数割引を適用する",
      baseFeeAfterDiscount: 90000,
      achievementFeeAfterDiscount: 47500,
      judgmentStatus: "consistent",
      appliedManualCriteria: true,
    });

    expect(user2JudgmentResult).toEqual({
      userId: user2Id,
      caseId: "EXC-2024-001",
      manualVersion: "2024-02-01-v1",
      invoiceAmount: expectedInvoiceAmount,
      calculationMethod:
        "基本料金割引を先に適用した後、成約数割引を適用する",
      baseFeeAfterDiscount: 90000,
      achievementFeeAfterDiscount: 47500,
      judgmentStatus: "consistent",
      appliedManualCriteria: true,
    });

    expect(user3JudgmentResult).toEqual({
      userId: user3Id,
      caseId: "EXC-2024-001",
      manualVersion: "2024-02-01-v1",
      invoiceAmount: expectedInvoiceAmount,
      calculationMethod:
        "基本料金割引を先に適用した後、成約数割引を適用する",
      baseFeeAfterDiscount: 90000,
      achievementFeeAfterDiscount: 47500,
      judgmentStatus: "consistent",
      appliedManualCriteria: true,
    });

    // 総合検証: 全ユーザーの判定結果が完全に一致しており、同じ基準で判定されていることを確認
    expect(user1JudgmentResult.invoiceAmount).toBe(
      user2JudgmentResult.invoiceAmount
    );
    expect(user2JudgmentResult.invoiceAmount).toBe(
      user3JudgmentResult.invoiceAmount
    );
    expect(user1JudgmentResult.calculationMethod).toBe(
      user2JudgmentResult.calculationMethod
    );
    expect(user2JudgmentResult.calculationMethod).toBe(
      user3JudgmentResult.calculationMethod
    );
    expect(user1JudgmentResult.judgmentStatus).toBe("consistent");
    expect(user2JudgmentResult.judgmentStatus).toBe("consistent");
    expect(user3JudgmentResult.judgmentStatus).toBe("consistent");
  });
});