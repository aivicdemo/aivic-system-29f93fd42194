import { calculateInvoiceAmount } from "../../src/logic/it-1-2-1";

describe("営業成果データから請求対象項目を自動抽出し、顧客ごと・サービスごとの請求額を集計する機能", () => {
  test("SCEN-949: 契約ごとの請求額計算 - 基本料金・成果報酬・割引額を個別に計算し合算した請求額が導出される", () => {
    // ========== パターン 1: 基本的な請求額計算 ==========
    // 契約条件: 基本料金 100,000円、成果報酬(成約数 × 単価) 5件 × 10,000円 = 50,000円、割引 10% = 15,000円
    const contract_pattern_1 = {
      contract_id: "CONTRACT-001",
      base_fee: 100000,
      performance_fee_per_unit: 10000,
      performance_units: 5,
      discount_percentage: 10,
    };

    // 期待値計算:
    // 基本料金: 100,000円
    // 成果報酬: 5 * 10,000 = 50,000円
    // 小計: 100,000 + 50,000 = 150,000円
    // 割引額: 150,000 * 10% = 15,000円
    // 請求額: 150,000 - 15,000 = 135,000円
    const result_1 = calculateInvoiceAmount(contract_pattern_1);
    expect(result_1).toEqual({
      base_fee: 100000,
      performance_fee: 50000,
      subtotal: 150000,
      discount_amount: 15000,
      invoice_amount: 135000,
    });

    // ========== パターン 2: 割引なしのケース ==========
    // 契約条件: 基本料金 50,000円、成果報酬(3件 × 5,000円) = 15,000円、割引 0%
    const contract_pattern_2 = {
      contract_id: "CONTRACT-002",
      base_fee: 50000,
      performance_fee_per_unit: 5000,
      performance_units: 3,
      discount_percentage: 0,
    };

    // 期待値計算:
    // 基本料金: 50,000円
    // 成果報酬: 3 * 5,000 = 15,000円
    // 小計: 50,000 + 15,000 = 65,000円
    // 割引額: 65,000 * 0% = 0円
    // 請求額: 65,000 - 0 = 65,000円
    const result_2 = calculateInvoiceAmount(contract_pattern_2);
    expect(result_2).toEqual({
      base_fee: 50000,
      performance_fee: 15000,
      subtotal: 65000,
      discount_amount: 0,
      invoice_amount: 65000,
    });

    // ========== パターン 3: 高割引率のケース ==========
    // 契約条件: 基本料金 200,000円、成果報酬(10件 × 8,000円) = 80,000円、割引 25%
    const contract_pattern_3 = {
      contract_id: "CONTRACT-003",
      base_fee: 200000,
      performance_fee_per_unit: 8000,
      performance_units: 10,
      discount_percentage: 25,
    };

    // 期待値計算:
    // 基本料金: 200,000円
    // 成果報酬: 10 * 8,000 = 80,000円
    // 小計: 200,000 + 80,000 = 280,000円
    // 割引額: 280,000 * 25% = 70,000円
    // 請求額: 280,000 - 70,000 = 210,000円
    const result_3 = calculateInvoiceAmount(contract_pattern_3);
    expect(result_3).toEqual({
      base_fee: 200000,
      performance_fee: 80000,
      subtotal: 280000,
      discount_amount: 70000,
      invoice_amount: 210000,
    });

    // ========== パターン 4: 成果報酬なしのケース ==========
    // 契約条件: 基本料金 75,000円、成果報酬(0件 × 12,000円) = 0円、割引 5%
    const contract_pattern_4 = {
      contract_id: "CONTRACT-004",
      base_fee: 75000,
      performance_fee_per_unit: 12000,
      performance_units: 0,
      discount_percentage: 5,
    };

    // 期待値計算:
    // 基本料金: 75,000円
    // 成果報酬: 0 * 12,000 = 0円
    // 小計: 75,000 + 0 = 75,000円
    // 割引額: 75,000 * 5% = 3,750円
    // 請求額: 75,000 - 3,750 = 71,250円
    const result_4 = calculateInvoiceAmount(contract_pattern_4);
    expect(result_4).toEqual({
      base_fee: 75000,
      performance_fee: 0,
      subtotal: 75000,
      discount_amount: 3750,
      invoice_amount: 71250,
    });

    // ========== パターン 5: 複数単価ユニットの複雑なケース ==========
    // 契約条件: 基本料金 120,000円、成果報酬(7件 × 15,000円) = 105,000円、割引 15%
    const contract_pattern_5 = {
      contract_id: "CONTRACT-005",
      base_fee: 120000,
      performance_fee_per_unit: 15000,
      performance_units: 7,
      discount_percentage: 15,
    };

    // 期待値計算:
    // 基本料金: 120,000円
    // 成果報酬: 7 * 15,000 = 105,000円
    // 小計: 120,000 + 105,000 = 225,000円
    // 割引額: 225,000 * 15% = 33,750円
    // 請求額: 225,000 - 33,750 = 191,250円
    const result_5 = calculateInvoiceAmount(contract_pattern_5);
    expect(result_5).toEqual({
      base_fee: 120000,
      performance_fee: 105000,
      subtotal: 225000,
      discount_amount: 33750,
      invoice_amount: 191250,
    });

    // ========== エラーケース: 必須フィールド欠落 ==========
    const invalid_contract = {
      contract_id: "CONTRACT-INVALID",
      base_fee: 100000,
      // performance_fee_per_unit 欠落
      performance_units: 5,
      discount_percentage: 10,
    } as any;

    expect(() => calculateInvoiceAmount(invalid_contract)).toThrow(/必須項目/);

    // ========== エラーケース: 負の割引率 ==========
    const invalid_discount_contract = {
      contract_id: "CONTRACT-NEG-DISCOUNT",
      base_fee: 100000,
      performance_fee_per_unit: 10000,
      performance_units: 5,
      discount_percentage: -10,
    };

    expect(() => calculateInvoiceAmount(invalid_discount_contract)).toThrow(
      /割引率/
    );

    // ========== エラーケース: 割引率が100%超過 ==========
    const invalid_discount_over_contract = {
      contract_id: "CONTRACT-DISCOUNT-OVER",
      base_fee: 100000,
      performance_fee_per_unit: 10000,
      performance_units: 5,
      discount_percentage: 150,
    };

    expect(() =>
      calculateInvoiceAmount(invalid_discount_over_contract)
    ).toThrow(/割引率/);

    // ========== エラーケース: 負の基本料金 ==========
    const invalid_base_fee_contract = {
      contract_id: "CONTRACT-NEG-BASE",
      base_fee: -100000,
      performance_fee_per_unit: 10000,
      performance_units: 5,
      discount_percentage: 10,
    };

    expect(() => calculateInvoiceAmount(invalid_base_fee_contract)).toThrow(
      /基本料金/
    );

    // ========== エラーケース: 負のパフォーマンスユニット数 ==========
    const invalid_units_contract = {
      contract_id: "CONTRACT-NEG-UNITS",
      base_fee: 100000,
      performance_fee_per_unit: 10000,
      performance_units: -5,
      discount_percentage: 10,
    };

    expect(() => calculateInvoiceAmount(invalid_units_contract)).toThrow(
      /ユニット数/
    );
  });
});