import { describe, test, expect, beforeEach, afterEach } from "@jest/globals";
import { validateContractChange } from "../../src/logic/it-1-1-1";

describe("営業成果データの自動検証ルール定義と異常検出機能", () => {
  // SCEN-859: [edge] 契約変更妥当性判定機能 - 契約金額が0円や極端に低い値の場合の判定ロジックが正常に動作する
  test("should correctly validate contract changes with zero or extremely low contract amounts", () => {
    // ========== ケース1: 契約金額が0円の場合 ==========
    const zeroAmountInput = {
      contractId: "CNT-001",
      customerId: "CUST-001",
      previousAmount: 100000,
      newAmount: 0,
      changeReason: "rate-adjustment",
      effectiveDate: "2024-02-01",
    };

    // 戻り値が不正な契約として判定されていることを確認
    const zeroResult = validateContractChange(zeroAmountInput);
    expect(zeroResult.isValid).toBe(false);
    expect(zeroResult.validityStatus).toBe("invalid");
    expect(zeroResult.severity).toBe("critical");

    // エラーメッセージが適切に出力されていることを確認
    expect(zeroResult.errorMessage).toMatch(/契約金額/);
    expect(zeroResult.errorMessage).toMatch(/0円/);
    expect(zeroResult.warnings).toHaveLength(0);
    expect(zeroResult.logs).toHaveLength(1);
    expect(zeroResult.logs[0]).toMatch(/契約ID: CNT-001/);
    expect(zeroResult.logs[0]).toMatch(/不正な契約/);

    // ========== ケース2: 契約金額が1円の極端に低い値の場合 ==========
    const oneYenInput = {
      contractId: "CNT-002",
      customerId: "CUST-002",
      previousAmount: 50000,
      newAmount: 1,
      changeReason: "promotional-discount",
      effectiveDate: "2024-02-01",
    };

    // 戻り値が警告フラグ付きで判定されていることを確認
    const oneYenResult = validateContractChange(oneYenInput);
    expect(oneYenResult.isValid).toBe(false);
    expect(oneYenResult.validityStatus).toBe("warning");
    expect(oneYenResult.severity).toBe("high");
    expect(oneYenResult.warnings).toHaveLength(1);
    expect(oneYenResult.warnings[0]).toMatch(/契約金額/);
    expect(oneYenResult.warnings[0]).toMatch(/1円/);
    expect(oneYenResult.logs.length).toBeGreaterThan(0);

    // ========== ケース3: 業界の最低基準未満の値（例：100円未満）の場合 ==========
    const belowMinimumInput = {
      contractId: "CNT-003",
      customerId: "CUST-003",
      previousAmount: 200000,
      newAmount: 50,
      changeReason: "contract-cancellation",
      effectiveDate: "2024-02-01",
    };

    // 極端に低い金額の場合の判定ロジックを実行
    const belowMinResult = validateContractChange(belowMinimumInput);

    // 戻り値が警告対象として判定されていることを確認
    expect(belowMinResult.isValid).toBe(false);
    expect(belowMinResult.validityStatus).toBe("warning");
    expect(belowMinResult.severity).toBe("high");
    expect(belowMinResult.warnings.length).toBeGreaterThan(0);

    // ログ出力に問題のある契約内容の詳細情報が記録されていることを確認
    const detailLog = belowMinResult.logs.find((log) =>
      log.includes("CNT-003")
    );
    expect(detailLog).toBeDefined();
    if (detailLog) {
      expect(detailLog).toMatch(/50円/);
      expect(detailLog).toMatch(/業界最低基準未満/);
    }

    // ========== ケース4: 複数のエッジケースを連続実行して判定ロジックの安定性を確認 ==========
    const edgeCases = [
      {
        contractId: "CNT-004",
        customerId: "CUST-004",
        previousAmount: 100000,
        newAmount: 0,
        changeReason: "contract-termination",
        effectiveDate: "2024-02-01",
      },
      {
        contractId: "CNT-005",
        customerId: "CUST-005",
        previousAmount: 75000,
        newAmount: 10,
        changeReason: "discount",
        effectiveDate: "2024-02-01",
      },
      {
        contractId: "CNT-006",
        customerId: "CUST-006",
        previousAmount: 150000,
        newAmount: 99,
        changeReason: "rate-down",
        effectiveDate: "2024-02-01",
      },
    ];

    const resultsSequence = edgeCases.map((testCase) =>
      validateContractChange(testCase)
    );

    // 複数のエッジケースでも一貫した判定結果が得られることを確認
    resultsSequence.forEach((result, index) => {
      expect(result.isValid).toBe(false);
      expect([
        "invalid",
        "warning",
      ]).toContain(result.validityStatus);
      expect(["critical", "high"]).toContain(result.severity);
      expect(result.logs.length).toBeGreaterThan(0);
      expect(result.errorMessage || result.warnings.length).toBeGreaterThan(0);
    });

    // 最初のケース（0円）は critical severity
    expect(resultsSequence[0].severity).toBe("critical");
    // その他のケースは high severity
    expect(resultsSequence[1].severity).toBe("high");
    expect(resultsSequence[2].severity).toBe("high");
  });
});