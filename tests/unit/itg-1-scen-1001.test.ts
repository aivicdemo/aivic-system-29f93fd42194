import { calculateBillingAmountWithDiscount } from "../../src/logic/it-1-2-1";

describe("複数スタッフ間の請求ルール理解度統一確認 - 割引率境界値ケース", () => {
  test("SCEN-1001: 割引率0%と100%の境界値で全スタッフが同一の請求額を計算する", () => {
    // テストデータ: 複数スタッフ（5名）のユーザーアカウント
    const staff_ids = ["staff_001", "staff_002", "staff_003", "staff_004", "staff_005"];
    
    // テストケース1: 割引率0%（割引なし）
    const base_amount_case_1 = 100000;
    const discount_rate_0_percent = 0;
    const expected_amount_no_discount = 100000;
    
    // テストケース2: 割引率100%（全額割引）
    const base_amount_case_2 = 100000;
    const discount_rate_100_percent = 100;
    const expected_amount_full_discount = 0;

    // 各スタッフが割引率0%のケースで請求金額を計算
    const results_no_discount = staff_ids.map((staff_id) => {
      return calculateBillingAmountWithDiscount({
        base_amount: base_amount_case_1,
        discount_rate_percent: discount_rate_0_percent,
        staff_id: staff_id,
      });
    });

    // 各スタッフが割引率100%のケースで請求金額を計算
    const results_full_discount = staff_ids.map((staff_id) => {
      return calculateBillingAmountWithDiscount({
        base_amount: base_amount_case_2,
        discount_rate_percent: discount_rate_100_percent,
        staff_id: staff_id,
      });
    });

    // 全スタッフの割引率0%ケースの計算結果を比較検証
    // 期待: すべてのスタッフが元の請求金額（100000）を計算
    results_no_discount.forEach((result) => {
      expect(result.calculated_amount).toBe(expected_amount_no_discount);
      expect(result.discount_amount).toBe(0);
      expect(result.final_amount).toBe(expected_amount_no_discount);
    });

    // 全スタッフの割引率100%ケースの計算結果を比較検証
    // 期待: すべてのスタッフが請求金額0円を計算
    results_full_discount.forEach((result) => {
      expect(result.calculated_amount).toBe(expected_amount_no_discount);
      expect(result.discount_amount).toBe(expected_amount_no_discount);
      expect(result.final_amount).toBe(expected_amount_full_discount);
    });

    // 各スタッフの計算結果が統一されているか確認
    const no_discount_final_amounts = results_no_discount.map((r) => r.final_amount);
    const full_discount_final_amounts = results_full_discount.map((r) => r.final_amount);

    // すべてのスタッフが同じ割引率0%結果を得たことを確認
    const all_same_no_discount = no_discount_final_amounts.every(
      (amount) => amount === expected_amount_no_discount
    );
    expect(all_same_no_discount).toBe(true);

    // すべてのスタッフが同じ割引率100%結果を得たことを確認
    const all_same_full_discount = full_discount_final_amounts.every(
      (amount) => amount === expected_amount_full_discount
    );
    expect(all_same_full_discount).toBe(true);

    // 計算ロジックの一貫性を検証
    // 割引率0%: final_amount = base_amount - (base_amount * 0 / 100)
    results_no_discount.forEach((result) => {
      const expected_final = base_amount_case_1 - (base_amount_case_1 * discount_rate_0_percent) / 100;
      expect(result.final_amount).toBe(expected_final);
    });

    // 割引率100%: final_amount = base_amount - (base_amount * 100 / 100) = 0
    results_full_discount.forEach((result) => {
      const expected_final = base_amount_case_2 - (base_amount_case_2 * discount_rate_100_percent) / 100;
      expect(result.final_amount).toBe(expected_final);
    });

    // スタッフ間で請求ルール理解度が統一されていることを証明
    // 1. 割引率0%ケースの結果が全スタッフ一致
    expect(
      results_no_discount.every((r) => r.final_amount === results_no_discount[0].final_amount)
    ).toBe(true);

    // 2. 割引率100%ケースの結果が全スタッフ一致
    expect(
      results_full_discount.every((r) => r.final_amount === results_full_discount[0].final_amount)
    ).toBe(true);

    // 3. 計算実行情報を確認（staff_id、タイムスタンプ、計算ロジックバージョンなど）
    results_no_discount.forEach((result, index) => {
      expect(result.staff_id).toBe(staff_ids[index]);
      expect(result.execution_timestamp).toBeDefined();
      expect(result.calculation_logic_version).toBeDefined();
    });

    results_full_discount.forEach((result, index) => {
      expect(result.staff_id).toBe(staff_ids[index]);
      expect(result.execution_timestamp).toBeDefined();
      expect(result.calculation_logic_version).toBeDefined();
    });
  });
});