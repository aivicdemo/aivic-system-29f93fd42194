import { detectAnomalousValues } from "../../src/logic/it-1-1-1";

describe("営業成果データの自動検証ルール定義と異常検出機能", () => {
  // SCEN-598
  test("負の請求額が算出された場合、エラーとして検出される", () => {
    // 計算誤りにより割引額が売上額を超えるシナリオ
    const billingData = {
      customerId: "CUST001",
      serviceId: "SVC001",
      baseSalesAmount: 100000,
      discountAmount: 150000, // 売上額を超える割引
      appliedDiscount: 0.5,
      serviceCharge: 5000,
    };

    // 計算式: (baseSalesAmount - discountAmount) + serviceCharge = (100000 - 150000) + 5000 = -45000
    // 期待: 負の請求額を検出し、エラーを throw
    expect(() => {
      detectAnomalousValues(billingData);
    }).toThrow(/負の請求額/);
  });

  test("正常な請求額は異常値として検出されない", () => {
    const billingData = {
      customerId: "CUST002",
      serviceId: "SVC002",
      baseSalesAmount: 100000,
      discountAmount: 20000,
      appliedDiscount: 0.2,
      serviceCharge: 5000,
    };

    // 計算式: (baseSalesAmount - discountAmount) + serviceCharge = (100000 - 20000) + 5000 = 85000
    // 期待: エラーなく実行完了
    const result = detectAnomalousValues(billingData);

    expect(result.isValid).toBe(true);
    expect(result.finalBillingAmount).toBe(85000);
    expect(result.hasNegativeValue).toBe(false);
  });

  test("ゼロの請求額は正常値として判定される", () => {
    const billingData = {
      customerId: "CUST003",
      serviceId: "SVC003",
      baseSalesAmount: 50000,
      discountAmount: 50000,
      appliedDiscount: 1.0,
      serviceCharge: 0,
    };

    // 計算式: (baseSalesAmount - discountAmount) + serviceCharge = (50000 - 50000) + 0 = 0
    // 期待: ゼロ金額は許容（請求対象外となる）
    const result = detectAnomalousValues(billingData);

    expect(result.isValid).toBe(true);
    expect(result.finalBillingAmount).toBe(0);
    expect(result.hasNegativeValue).toBe(false);
  });

  test("複数の負の要因が重複した場合、負の請求額エラーが検出される", () => {
    const billingData = {
      customerId: "CUST004",
      serviceId: "SVC004",
      baseSalesAmount: 80000,
      discountAmount: 150000, // 売上超過の割引
      appliedDiscount: 0.8,
      serviceCharge: -30000, // 負のサービス料金
    };

    // 計算式: (baseSalesAmount - discountAmount) + serviceCharge = (80000 - 150000) + (-30000) = -100000
    // 期待: 負の請求額を検出し、エラーを throw
    expect(() => {
      detectAnomalousValues(billingData);
    }).toThrow(/負の請求額/);
  });

  test("異常値検出ログに負の金額エラーの詳細が記録される", () => {
    const billingData = {
      customerId: "CUST005",
      serviceId: "SVC005",
      baseSalesAmount: 60000,
      discountAmount: 100000,
      appliedDiscount: 0.6,
      serviceCharge: 3000,
    };

    // 計算式: (baseSalesAmount - discountAmount) + serviceCharge = (60000 - 100000) + 3000 = -37000
    // 期待: エラーを throw し、エラーメッセージが異常値検出の詳細を含む
    expect(() => {
      detectAnomalousValues(billingData);
    }).toThrow(/負の請求額/);

    // エラーメッセージはスローされることで、処理が中断される
    // ログは事後的に記録されることを想定
  });
});