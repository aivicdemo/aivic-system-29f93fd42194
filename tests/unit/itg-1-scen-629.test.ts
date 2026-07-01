import { compareContractChangeHistory } from "../../src/logic/it-1781935279444-1-1-1";

describe("営業データ項目のメタデータ管理機能", () => {
  // SCEN-629: [edge] 契約変更履歴・請求パターン比較分析機能 - 契約変更が100件以上存在する場合でも差分比較が正確に実行される
  test("should accurately compare contract changes and billing patterns when 100+ contract change records exist", () => {
    const customerId = "CUST-12345";
    const companyName = "Test Company Inc.";

    // テストデータ: 150件の契約変更履歴を生成
    const contractChangeHistory = Array.from({ length: 150 }, (_, index) => ({
      changeId: `CHG-${String(index + 1).padStart(6, "0")}`,
      customerId: customerId,
      changeDate: new Date(
        2024,
        0,
        1 + Math.floor(index / 5)
      ).toISOString(),
      contractAmount: 100000 + index * 1000,
      startDate: new Date(2024, 0, 1).toISOString(),
      endDate: new Date(
        2024,
        11,
        31 + (index % 12)
      ).toISOString(),
      serviceContent: `Service Type ${(index % 5) + 1}`,
      discountRate: (index % 3) * 0.05,
      billingCycle: "MONTHLY",
      changeReason: `Contract modification ${index + 1}`,
      approvalStatus: "APPROVED",
    }));

    // 比較対象の2つの契約変更時点を選択
    const firstChangeIndex = 25;
    const secondChangeIndex = 125;

    const firstChange = contractChangeHistory[firstChangeIndex];
    const secondChange = contractChangeHistory[secondChangeIndex];

    // 差分比較機能の実行
    const comparisonResult = compareContractChangeHistory({
      customerId: customerId,
      companyName: companyName,
      contractChangeHistory: contractChangeHistory,
      firstChangeDate: firstChange.changeDate,
      secondChangeDate: secondChange.changeDate,
      timeoutSeconds: 10,
    });

    // 1. 比較結果が正常に返される
    expect(comparisonResult).toBeDefined();
    expect(typeof comparisonResult).toBe("object");

    // 2. 契約変更件数の整合性を検証
    expect(comparisonResult.totalRecordsProcessed).toBe(150);
    expect(comparisonResult.comparisonTargetCount).toBe(2);

    // 3. 契約金額の差分が正確に計算されている
    const expectedAmountDifference = secondChange.contractAmount - firstChange.contractAmount;
    expect(comparisonResult.contractAmountChange).toBe(expectedAmountDifference);
    expect(comparisonResult.contractAmountChangeRate).toBeCloseTo(
      (expectedAmountDifference / firstChange.contractAmount) * 100,
      2
    );

    // 4. 開始日の変更有無を検証
    expect(comparisonResult.startDateChanged).toBe(
      firstChange.startDate !== secondChange.startDate
    );

    // 5. 終了日の変更有無を検証
    expect(comparisonResult.endDateChanged).toBe(
      firstChange.endDate !== secondChange.endDate
    );

    // 6. サービス内容の変更有無を検証
    expect(comparisonResult.serviceContentChanged).toBe(
      firstChange.serviceContent !== secondChange.serviceContent
    );

    // 7. 割引率の差分が正確に計算されている
    const expectedDiscountDifference = secondChange.discountRate - firstChange.discountRate;
    expect(comparisonResult.discountRateDifference).toBeCloseTo(
      expectedDiscountDifference,
      4
    );

    // 8. 請求パターンの比較結果が存在
    expect(comparisonResult.billingPatternComparison).toBeDefined();
    expect(comparisonResult.billingPatternComparison.beforeBillingAmount).toBe(
      firstChange.contractAmount * (1 - firstChange.discountRate)
    );
    expect(comparisonResult.billingPatternComparison.afterBillingAmount).toBe(
      secondChange.contractAmount * (1 - secondChange.discountRate)
    );

    // 9. 請求パターンの差分が正確に計算されている
    const expectedBillingDifference =
      comparisonResult.billingPatternComparison.afterBillingAmount -
      comparisonResult.billingPatternComparison.beforeBillingAmount;
    expect(comparisonResult.billingPatternComparison.billingAmountDifference).toBe(
      expectedBillingDifference
    );

    // 10. すべての変更項目が記録されている
    expect(comparisonResult.changedFields).toBeDefined();
    expect(Array.isArray(comparisonResult.changedFields)).toBe(true);

    // 11. 変更項目に契約金額が含まれる
    expect(comparisonResult.changedFields).toContain("contractAmount");

    // 12. 割引率が変更された場合は変更項目に含まれる
    if (firstChange.discountRate !== secondChange.discountRate) {
      expect(comparisonResult.changedFields).toContain("discountRate");
    }

    // 13. 完了時刻が記録されている
    expect(comparisonResult.completedAt).toBeDefined();
    const completedAtDate = new Date(comparisonResult.completedAt);
    expect(completedAtDate instanceof Date).toBe(true);
    expect(completedAtDate.getTime()).toBeGreaterThan(0);

    // 14. 応答時間が許容範囲内（10秒以内）であることを検証
    expect(comparisonResult.processingTimeMs).toBeLessThanOrEqual(10000);
    expect(comparisonResult.processingTimeMs).toBeGreaterThan(0);

    // 15. ステータスが成功を示している
    expect(comparisonResult.status).toBe("SUCCESS");

    // 16. エラーメッセージが存在しない
    expect(comparisonResult.errorMessage).toBeUndefined();

    // 17. 比較対象の顧客IDが正確に記録されている
    expect(comparisonResult.customerId).toBe(customerId);

    // 18. 差分比較の詳細情報が完全に含まれている
    expect(comparisonResult.detailedChanges).toBeDefined();
    expect(typeof comparisonResult.detailedChanges).toBe("object");
  });
});