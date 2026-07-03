import {
  validateSalesDataQuality,
  applySalesDataValidationRules,
  compareSalesDataValidationResults,
} from "../../src/logic/it-1781935279444-2-2-1";

describe("営業データ品質検証基準の一貫性確認", () => {
  // SCEN-1001: [normal] データ品質検証基準確認 - 検証ルール基準が確認された後、後続のデータ品質検証プロセスで一貫して適用される
  test("検証ルール基準が全ての検証実行において一貫して適用されることを確認", () => {
    // === 1. 検証ルール基準の設定 ===
    const validationRules = {
      requiredFields: ["customer_id", "sales_date", "amount"],
      dataTypes: {
        customer_id: "string",
        sales_date: "ISO8601",
        amount: "number",
      },
      valueRanges: {
        amount: { min: 0, max: 999999 },
      },
      anomalyThresholds: {
        amount_max_monthly: 50000,
      },
    };

    // === 2. テストデータセット1（当月データ）の定義 ===
    const testDataset1 = [
      {
        customer_id: "CUST001",
        sales_date: "2024-01-15T10:00:00Z",
        amount: 25000,
      },
      {
        customer_id: "CUST002",
        sales_date: "2024-01-16T14:30:00Z",
        amount: 15000,
      },
      {
        customer_id: "CUST001",
        sales_date: "2024-01-17T09:15:00Z",
        amount: 12000,
      },
    ];

    // === 3. 1回目の検証実行結果を記録 ===
    const validationResult1 = validateSalesDataQuality(
      testDataset1,
      validationRules
    );

    // 期待値: 3件全て合格、エラーなし
    expect(validationResult1.totalRecords).toBe(3);
    expect(validationResult1.passedRecords).toBe(3);
    expect(validationResult1.failedRecords).toBe(0);
    expect(validationResult1.errors).toEqual([]);
    expect(validationResult1.status).toBe("PASS");

    // === 4. 同一テストデータで再度検証実行（一貫性確認） ===
    const validationResult1_retry = validateSalesDataQuality(
      testDataset1,
      validationRules
    );

    // 期待値: 1回目と同じ結果（完全一致）
    expect(validationResult1_retry.totalRecords).toBe(
      validationResult1.totalRecords
    );
    expect(validationResult1_retry.passedRecords).toBe(
      validationResult1.passedRecords
    );
    expect(validationResult1_retry.failedRecords).toBe(
      validationResult1.failedRecords
    );
    expect(validationResult1_retry.status).toBe(validationResult1.status);

    // === 5. テストデータセット2（異なる期間のデータ）の定義 ===
    const testDataset2 = [
      {
        customer_id: "CUST003",
        sales_date: "2024-02-10T11:00:00Z",
        amount: 30000,
      },
      {
        customer_id: "CUST004",
        sales_date: "2024-02-12T13:45:00Z",
        amount: 8000,
      },
    ];

    // === 6. 2回目の期間データで検証実行 ===
    const validationResult2 = validateSalesDataQuality(
      testDataset2,
      validationRules
    );

    // 期待値: 2件全て合格、エラーなし（同じ基準で検証）
    expect(validationResult2.totalRecords).toBe(2);
    expect(validationResult2.passedRecords).toBe(2);
    expect(validationResult2.failedRecords).toBe(0);
    expect(validationResult2.errors).toEqual([]);
    expect(validationResult2.status).toBe("PASS");

    // === 7. 異常値を含むテストデータセット3の定義 ===
    const testDataset3 = [
      {
        customer_id: "CUST005",
        sales_date: "2024-03-01T10:00:00Z",
        amount: 75000, // 異常値（範囲超過）
      },
      {
        customer_id: "CUST006",
        sales_date: "2024-03-02T15:00:00Z",
        amount: -5000, // 範囲外（負数）
      },
      {
        customer_id: "CUST007",
        // customer_id のみ、sales_date 欠落
        sales_date: "2024-03-03T12:00:00Z",
        amount: 12000,
      },
    ];

    // === 8. 異常値データで検証実行（基準の適用確認） ===
    const validationResult3 = validateSalesDataQuality(
      testDataset3,
      validationRules
    );

    // 期待値: 3件中2件失敗、エラー検出
    expect(validationResult3.totalRecords).toBe(3);
    expect(validationResult3.failedRecords).toBeGreaterThan(0);
    expect(validationResult3.errors.length).toBeGreaterThan(0);
    expect(validationResult3.status).toBe("FAIL");

    // === 9. 複数回の検証実行結果の比較 ===
    const comparisonResult = compareSalesDataValidationResults([
      validationResult1,
      validationResult1_retry,
      validationResult2,
      validationResult3,
    ]);

    // 期待値: 検証ルール基準が一貫して適用されていることを確認
    expect(comparisonResult.rulesConsistencyCheck).toBe(true);
    expect(comparisonResult.identicalDataProducesIdenticalResults).toBe(true);
    expect(comparisonResult.differentDatasetsSameCriteria).toBe(true);

    // === 10. 合格基準の確認 ===
    expect(validationResult1.status).toBe("PASS");
    expect(validationResult1_retry.status).toBe("PASS");
    expect(validationResult2.status).toBe("PASS");
    expect(validationResult3.status).toBe("FAIL");

    // === 11. エラー内容の詳細確認 ===
    expect(validationResult3.errors).toContainEqual(
      expect.objectContaining({
        recordIndex: expect.any(Number),
        field: expect.any(String),
      })
    );

    // === 12. 検証ルール基準の適用一貫性の最終確認 ===
    expect(comparisonResult.totalValidationRuns).toBe(4);
    expect(comparisonResult.rulesVersionApplied).toBe("v1.0.0");
    expect(comparisonResult.allValidationRunsUseConsistentRules).toBe(true);
  });
});