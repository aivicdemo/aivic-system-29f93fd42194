import { validateContractChangeAgreement } from "../../src/logic/it-1-1-1";

describe("営業成果データの自動検証ルール定義と異常検出機能", () => {
  // SCEN-1243: [error] 契約変更内容の合意状況検証機能 - 顧客の合意と登録済み変更内容が不一致である場合、例外フラグを立てて対応ルート判定を実行する
  test("契約変更内容が顧客合意と不一致の場合、例外フラグが立てられ対応ルート判定が実行される", () => {
    // テストデータ準備
    const customerId = "CUST-001";
    const contractNumber = "CTR-2024-001";
    const registeredChangeContent = {
      changeType: "pricing_plan",
      previousValue: "standard_plan",
      newValue: "premium_plan",
      effectiveDate: "2024-02-01",
      discountRate: 0.1,
    };

    const customerAgreementContent = {
      changeType: "pricing_plan",
      previousValue: "standard_plan",
      newValue: "enterprise_plan", // 登録済み変更内容と不一致
      effectiveDate: "2024-02-01",
      discountRate: 0.15, // 登録済み変更内容と不一致
      agreedAt: "2024-01-20T09:30:00Z",
      agreedBy: "sales_rep_001",
    };

    const input = {
      customerId,
      contractNumber,
      registeredChangeContent,
      customerAgreementContent,
    };

    const result = validateContractChangeAgreement(input);

    // 例外フラグが立てられたことを検証
    expect(result.exceptionFlagSet).toBe(true);

    // 不一致内容が記録されていることを検証
    expect(result.discrepancies).toEqual([
      {
        field: "newValue",
        registeredValue: "premium_plan",
        agreedValue: "enterprise_plan",
      },
      {
        field: "discountRate",
        registeredValue: 0.1,
        agreedValue: 0.15,
      },
    ]);

    // 対応ルート判定が実行され、適切なルートが決定されていることを検証
    expect(result.routeDecision).toEqual({
      route: "manual_confirmation_required",
      priority: "high",
      requiresAdminNotification: true,
      status: "exception_handling_pending",
    });

    // ステータスが『要確認』または『例外処理待ち』に更新されていることを検証
    expect(result.status).toBe("exception_handling_pending");

    // 例外レコードがログに記録されていることを検証
    expect(result.exceptionLogEntry).toEqual({
      timestamp: "2024-01-20T10:00:00Z",
      customerId,
      contractNumber,
      exceptionType: "agreement_mismatch",
      severity: "high",
      discrepancyCount: 2,
      requiresManualIntervention: true,
      recordedAt: expect.any(String),
    });

    // 対応ルート判定の理由が記録されていることを検証
    expect(result.exceptionLogEntry.reason).toContain("pricing");
  });
});