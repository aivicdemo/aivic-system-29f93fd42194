import { validateSalesDataRecord } from "../../src/logic/it-1781935279444-2-1-1";

describe("営業データ自動検証ルール定義・実行機能", () => {
  // SCEN-705
  test("日付・金額・ステータスの矛盾が正常に検出され、修正対象項目と理由が特定される", () => {
    const testData = {
      contractDate: "2024-01-15",
      billingDate: "2024-01-10",
      amount: -50000,
      status: "完了",
      paymentDueDate: "2024-01-05",
    };

    const result = validateSalesDataRecord(testData);

    expect(result.isValid).toBe(false);
    expect(result.errors).toHaveLength(3);

    const billingDateError = result.errors.find(
      (err) => err.field === "billingDate"
    );
    expect(billingDateError).toBeDefined();
    expect(billingDateError?.reason).toContain("契約日より前");
    expect(billingDateError?.correctionTarget).toBe("請求日フィールド");

    const amountError = result.errors.find((err) => err.field === "amount");
    expect(amountError).toBeDefined();
    expect(amountError?.reason).toContain("負の金額");
    expect(amountError?.correctionTarget).toBe("金額フィールド");

    const statusPaymentError = result.errors.find(
      (err) => err.field === "paymentDueDate"
    );
    expect(statusPaymentError).toBeDefined();
    expect(statusPaymentError?.reason).toContain("支払期限が過去日");
    expect(statusPaymentError?.correctionTarget).toBe("支払期限フィールド");

    expect(result.detectionSummary).toContain("請求日の矛盾");
    expect(result.detectionSummary).toContain("金額の負数エラー");
    expect(result.detectionSummary).toContain("ステータスと支払期限の時間的矛盾");
  });
});