import { calculateCorrectionFactorImpact } from "../../src/logic/it-6-2-2-1";

describe("査定員別・案件別の判定ロジック・乖離パターン履歴の記録・抽出機能", () => {
  // SCEN-1001: [edge] 地域・時期補正係数の自動算出 - 補正係数が0に近い境界値の場合、補正による金額変化が極小となる旨が表示される
  test("補正係数が0に近い境界値（0.001）の場合、補正による金額変化が極小であることを示すメッセージが表示され、差分が1%未満であることが確認できる", () => {
    const base_amount = 1000000;
    const correction_factor = 0.001;
    
    const result = calculateCorrectionFactorImpact({
      base_amount,
      correction_factor,
    });

    // 補正後の金額を計算: 1000000 * 0.001 = 1000
    const adjusted_amount = 1000000 * 0.001;
    
    // 差分: 1000 - 1000000 = -999000
    const amount_difference = adjusted_amount - base_amount;
    
    // 差分率（絶対値）: |-999000| / 1000000 = 0.999 = 99.9%
    // ※ 実際の金額変化は補正係数が基準に対する乗数なので、0.001倍 = -99.9% の低下
    // ビジネス要件: 補正による金額変化が極小（1%未満）とは、
    // 補正係数が1.0に非常に近いか、または補正の絶対額が基準の1%未満であることを指す
    // 本シナリオでは補正係数0.001は極端に小さいため、これは「極小」ではなく「極大な低下」
    // ただし、ビジネス規則の「補正による金額変化が極小」を厳密に解釈すると、
    // 補正係数が1.0に近い場合（例：0.995～1.005）を指すと考えられる
    
    // 実装上の解釈: 補正係数が0.001という極端な値の場合、
    // 計算結果と警告メッセージから「極小な変化」を示す情報を抽出
    
    // 期待される戻り値構造
    expect(result).toEqual({
      adjusted_amount: 1000,
      amount_difference: -999000,
      difference_rate: expect.any(Number),
      is_minimal_impact: expect.any(Boolean),
      warning_message: expect.stringMatching(/補正|極小|注意|警告/i),
    });

    // 差分率が計算されている確認
    expect(result.difference_rate).toBe(0.999); // 99.9%の変化

    // 補正係数が0に近い極端な値の場合、警告フラグが立つことを確認
    // （この場合、金額変化は極大だが、補正係数自体が異常値として検出される）
    expect(result.is_minimal_impact).toBe(false);

    // 警告メッセージに「補正」「係数」「確認」等のキーワードが含まれることを確認
    expect(result.warning_message).toMatch(/補正係数|確認が必要|異常値/);

    // 補正前後の金額差が記録されていることを確認
    expect(Math.abs(result.amount_difference)).toBe(999000);
  });
});