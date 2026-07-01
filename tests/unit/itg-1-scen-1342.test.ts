import { calculateRetrospectiveAdjustment } from "../../src/logic/it-1-2-1";

describe("営業成果データから請求対象項目を自動抽出し、顧客ごと・サービスごとの請求額を集計する機能", () => {
  test("SCEN-1342: 契約変更に伴う請求遡及調整機能 - 契約変更確定時に過去請求データの差分が正確に計算される", () => {
    // 初期契約データ準備
    const initialContractAmount = 100000;
    const contractMonths = 3;
    const initialMonthlyAmount = initialContractAmount / contractMonths; // 33,333.33円（実際は33,333円で計算）

    // 過去3ヶ月分の請求データ作成
    const pastInvoices = [
      {
        invoiceId: "INV-2024-01",
        customerId: "CUST-001",
        serviceId: "SVC-001",
        invoiceDate: "2024-01-01",
        invoiceAmount: 33333,
        contractAmount: initialContractAmount,
      },
      {
        invoiceId: "INV-2024-02",
        customerId: "CUST-001",
        serviceId: "SVC-001",
        invoiceDate: "2024-02-01",
        invoiceAmount: 33333,
        contractAmount: initialContractAmount,
      },
      {
        invoiceId: "INV-2024-03",
        customerId: "CUST-001",
        serviceId: "SVC-001",
        invoiceDate: "2024-03-01",
        invoiceAmount: 33334,
        contractAmount: initialContractAmount,
      },
    ];

    // 契約変更パラメータ
    const newContractAmount = 120000;
    const adjustmentStartDate = "2024-01-01";
    const adjustmentEndDate = "2024-03-31";
    const changeReason = "契約金額改定";

    // 遡及調整処理実行
    const result = calculateRetrospectiveAdjustment({
      customerId: "CUST-001",
      serviceId: "SVC-001",
      oldContractAmount: initialContractAmount,
      newContractAmount: newContractAmount,
      adjustmentPeriodMonths: contractMonths,
      pastInvoices: pastInvoices,
      adjustmentStartDate: adjustmentStartDate,
      adjustmentEndDate: adjustmentEndDate,
      changeReason: changeReason,
    });

    // 期待値計算
    const newMonthlyAmount = newContractAmount / contractMonths; // 40,000円
    const expectedAdjustmentPerMonth = newMonthlyAmount - 33333; // 6,667円
    const expectedTotalAdjustment = 20001; // 6,667 × 3 = 20,001円

    // 検証: 月次調整額
    expect(result.adjustments).toHaveLength(3);
    expect(result.adjustments[0].invoiceId).toBe("INV-2024-01");
    expect(result.adjustments[0].adjustmentAmount).toBe(6667);
    expect(result.adjustments[0].originalAmount).toBe(33333);
    expect(result.adjustments[0].adjustedAmount).toBe(40000);

    expect(result.adjustments[1].invoiceId).toBe("INV-2024-02");
    expect(result.adjustments[1].adjustmentAmount).toBe(6667);
    expect(result.adjustments[1].originalAmount).toBe(33333);
    expect(result.adjustments[1].adjustedAmount).toBe(40000);

    expect(result.adjustments[2].invoiceId).toBe("INV-2024-03");
    expect(result.adjustments[2].adjustmentAmount).toBe(6667);
    expect(result.adjustments[2].originalAmount).toBe(33334);
    expect(result.adjustments[2].adjustedAmount).toBe(40000);

    // 検証: 合計調整額
    expect(result.totalAdjustmentAmount).toBe(expectedTotalAdjustment);

    // 検証: 調整履歴記録
    expect(result.adjustmentHistory).toBeDefined();
    expect(result.adjustmentHistory.customerId).toBe("CUST-001");
    expect(result.adjustmentHistory.serviceId).toBe("SVC-001");
    expect(result.adjustmentHistory.oldContractAmount).toBe(initialContractAmount);
    expect(result.adjustmentHistory.newContractAmount).toBe(newContractAmount);
    expect(result.adjustmentHistory.adjustmentPeriodStart).toBe(adjustmentStartDate);
    expect(result.adjustmentHistory.adjustmentPeriodEnd).toBe(adjustmentEndDate);
    expect(result.adjustmentHistory.adjustmentMonths).toBe(contractMonths);
    expect(result.adjustmentHistory.totalAdjustmentAmount).toBe(expectedTotalAdjustment);
    expect(result.adjustmentHistory.changeReason).toBe(changeReason);
    expect(result.adjustmentHistory.calculationBasis).toBeDefined();
    expect(result.adjustmentHistory.calculationBasis.newMonthlyRate).toBe(40000);
    expect(result.adjustmentHistory.calculationBasis.oldMonthlyRate).toBe(33333);
    expect(result.adjustmentHistory.calculationBasis.adjustmentFormulaDescription).toBe(
      "(新契約金額 ÷ 契約月数) - 旧請求額"
    );

    // 検証: 調整処理が成功
    expect(result.status).toBe("success");
    expect(result.processedAt).toBeDefined();
    expect(typeof result.processedAt).toBe("string");
  });
});