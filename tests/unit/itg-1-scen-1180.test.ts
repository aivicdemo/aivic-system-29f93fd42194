import { determineDistributionStatus } from "../../src/logic/it-1-1-1";

describe("営業成果データの自動検証ルール定義と異常検出機能", () => {
  // SCEN-1180: [error] 配信成功・失敗判定・アラート管理 - 一部顧客への配信に失敗した場合、失敗として判定され再試行フラグが立つ
  test("複数顧客への配信タスクで一部顧客が失敗した場合、全体が失敗と判定され再試行フラグが立つ", () => {
    const distributionTask = {
      taskId: "DIST-2024-001",
      targetCustomers: [
        {
          customerId: "CUST-001",
          customerName: "顧客A",
          distributionStatus: "success",
          retryFlag: false,
        },
        {
          customerId: "CUST-002",
          customerName: "顧客B",
          distributionStatus: "failed",
          retryFlag: false,
        },
        {
          customerId: "CUST-003",
          customerName: "顧客C",
          distributionStatus: "success",
          retryFlag: false,
        },
      ],
      executedAt: "2024-01-15T09:00:00Z",
    };

    const result = determineDistributionStatus(distributionTask);

    // 期待結果：全体の配信結果が『失敗』と判定される
    expect(result.overallStatus).toBe("failed");

    // 期待結果：失敗した顧客レコードに再試行フラグが『True』で立つ
    const failedCustomer = result.customerResults.find(
      (c: any) => c.customerId === "CUST-002"
    );
    expect(failedCustomer.retryFlag).toBe(true);

    // 期待結果：成功した顧客には再試行フラグが立たない
    const successCustomers = result.customerResults.filter(
      (c: any) => c.distributionStatus === "success"
    );
    successCustomers.forEach((customer: any) => {
      expect(customer.retryFlag).toBe(false);
    });

    // 期待結果：アラート管理画面に『配信失敗-再試行待機中』というアラートが自動生成される
    expect(result.alertGenerated).toBe(true);
    expect(result.alertMessage).toBe("配信失敗-再試行待機中");

    // 期待結果：再試行フラグ付きの顧客は次回の再試行バッチ処理の対象となる
    const retryTargets = result.customerResults.filter(
      (c: any) => c.retryFlag === true
    );
    expect(retryTargets.length).toBe(1);
    expect(retryTargets[0].customerId).toBe("CUST-002");
    expect(result.nextRetryBatchEligible).toBe(true);
  });
});