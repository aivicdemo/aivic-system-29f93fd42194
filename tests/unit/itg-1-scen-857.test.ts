import { validateContractChange } from "../../src/logic/it-1-1-1";

describe("営業成果データの自動検証ルール定義と異常検出機能", () => {
  // SCEN-857: [error] 契約変更妥当性判定機能 - 検証結果に誤りや不正が含まれる場合に却下判定が正確に出力される
  test("検証結果に誤りや不正が含まれた契約変更リクエストの却下判定ロジックが正確に動作し、却下理由と検出内容が記録される", () => {
    const contractChangeRequest = {
      contractId: "CTR-2024-001",
      customerId: "CUST-0001",
      previousBillingAmount: 100000,
      newBillingAmount: 50000,
      changeReason: "割引適用",
      effectiveDate: "2024-02-01",
      validationResults: [
        {
          checkName: "金額差分検証",
          status: "error",
          discrepancy: 50000,
          threshold: 20000,
          errorDetails: "金額変更が閾値を超過している"
        },
        {
          checkName: "契約履歴整合性検証",
          status: "error",
          previousContractVersion: "v2.1",
          currentSystemVersion: "v2.0",
          errorDetails: "システムの契約バージョンが古い"
        },
        {
          checkName: "請求ルール整合性検証",
          status: "success",
          rulesMatched: true
        }
      ]
    };

    const result = validateContractChange(contractChangeRequest);

    expect(result.approvalStatus).toBe("rejected");
    expect(result.rejectionReasons).toEqual([
      {
        reason: "金額差分が許容閾値を超過",
        detectedError: "金額変更が閾値を超過している",
        severity: "critical"
      },
      {
        reason: "契約バージョンが不整合",
        detectedError: "システムの契約バージョンが古い",
        severity: "critical"
      }
    ]);
    expect(result.rejectionCount).toBe(2);
    expect(result.systemLog).toMatchObject({
      eventType: "CONTRACT_CHANGE_REJECTED",
      contractId: "CTR-2024-001",
      customerId: "CUST-0001",
      timestamp: expect.any(String),
      rejectionReasonsCount: 2,
      proceedToNextBillingCycle: false
    });
    expect(result.shouldProceedToPayment).toBe(false);
  });
});