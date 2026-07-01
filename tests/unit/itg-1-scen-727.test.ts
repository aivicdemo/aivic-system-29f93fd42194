import { validateSalesDataFormat } from "../../src/logic/it-1781935279444-2-2-1";

describe("営業データ品質基準チェック・承認機能", () => {
  // SCEN-727: [error] 営業データ品質基準チェック・承認機能 - 修正済みデータが必須項目の形式チェックに不合格となり、承認が拒否される
  test("修正済みデータの必須項目が形式チェックルールに不合格となり承認が拒否される", () => {
    // 承認待ちの修正済みデータ: 顧客ID桁数不足
    const invalidDataCustomerIdShort = {
      customerId: "C1",
      amount: "50000",
      date: "2024-01-15",
      description: "営業活動レコード",
    };

    // 形式チェック実行 - 顧客ID桁数不足でエラー
    expect(() =>
      validateSalesDataFormat(invalidDataCustomerIdShort)
    ).toThrow(/顧客ID/);

    // 承認待ちの修正済みデータ: 金額が数値でない
    const invalidDataAmountNaN = {
      customerId: "CUST0001",
      amount: "abc123",
      date: "2024-01-15",
      description: "営業活動レコード",
    };

    // 形式チェック実行 - 金額が数値でなくエラー
    expect(() => validateSalesDataFormat(invalidDataAmountNaN)).toThrow(/金額/);

    // 承認待ちの修正済みデータ: 日付形式が不正
    const invalidDataDateFormat = {
      customerId: "CUST0001",
      amount: "50000",
      date: "2024/01/15",
      description: "営業活動レコード",
    };

    // 形式チェック実行 - 日付がYYYY-MM-DD形式でなくエラー
    expect(() => validateSalesDataFormat(invalidDataDateFormat)).toThrow(/日付/);

    // 承認待ちの修正済みデータ: 必須項目が複数不合格
    const invalidDataMultiple = {
      customerId: "C",
      amount: "xyz",
      date: "01-15-2024",
      description: "営業活動レコード",
    };

    // 形式チェック実行 - 複数の必須項目が形式チェックルール違反
    expect(() => validateSalesDataFormat(invalidDataMultiple)).toThrow(
      /必須項目の形式/
    );

    // 正常系: すべての必須項目が形式チェックルールを満たす場合
    const validData = {
      customerId: "CUST0001",
      amount: "50000",
      date: "2024-01-15",
      description: "営業活動レコード",
    };

    // 形式チェック実行 - 合格
    const result = validateSalesDataFormat(validData);
    expect(result).toEqual({
      isValid: true,
      errors: [],
    });

    // 承認画面でデータを承認しようとする場合、形式チェック不合格のデータは承認処理がエラーとともに拒否される
    const approvalResult = () => validateSalesDataFormat(invalidDataCustomerIdShort);
    expect(approvalResult).toThrow(/必須項目の形式が不正です/);
  });
});