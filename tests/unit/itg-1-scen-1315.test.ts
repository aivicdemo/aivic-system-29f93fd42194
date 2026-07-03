import { calculateProportionalBillingAmount } from "../../src/logic/it-1-2-1";

describe("営業成果データから請求対象項目を自動抽出し、顧客ごと・サービスごとの請求額を集計する機能", () => {
  // SCEN-1315: [edge] 契約変更に基づく請求遡及調整 - 契約変更日が請求期間の月途中の場合、按分計算が実行される
  test("契約変更日が月途中の場合、按分計算ロジックにより正確な請求額が計算される", () => {
    const contractStartDate = new Date("2024-01-01T00:00:00Z");
    const contractChangeDate = new Date("2024-01-15T00:00:00Z");
    const initialMonthlyRate = 30000;
    const changedMonthlyRate = 45000;
    const billingStartDate = new Date("2024-01-01T00:00:00Z");
    const billingEndDate = new Date("2024-01-31T23:59:59Z");

    const result = calculateProportionalBillingAmount({
      contractStartDate,
      contractChangeDate,
      initialMonthlyRate,
      changedMonthlyRate,
      billingStartDate,
      billingEndDate,
    });

    // 2024年1月は31日間
    // 1月1日～1月14日：14日間 × 30,000円 ÷ 31日 = 14,516.13円
    const expectedAmountBeforeChange = Math.round(
      (30000 * 14) / 31 * 100
    ) / 100;
    // 1月15日～1月31日：17日間 × 45,000円 ÷ 31日 = 22,096.77円
    const expectedAmountAfterChange = Math.round(
      (45000 * 17) / 31 * 100
    ) / 100;
    // 合計請求額: 14,516.13円 + 22,096.77円 = 36,612.90円 (四捨五入で36,613円)
    const expectedTotalBillingAmount = Math.round(
      (expectedAmountBeforeChange + expectedAmountAfterChange) * 100
    ) / 100;

    expect(result).toEqual({
      amountBeforeChange: expectedAmountBeforeChange,
      amountAfterChange: expectedAmountAfterChange,
      totalBillingAmount: expectedTotalBillingAmount,
      daysBeforeChange: 14,
      daysAfterChange: 17,
    });

    expect(result.totalBillingAmount).toBe(36613);
    expect(result.amountBeforeChange).toBe(14516);
    expect(result.amountAfterChange).toBe(22097);
  });
});