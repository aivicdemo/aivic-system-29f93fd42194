import { classifyDivergencePatterns } from "../../src/logic/it-1-br-6-2-1";

describe("相場乖離パターン自動分類機能", () => {
  // SCEN-811
  test("乖離率が算出不可の場合、パターン分類処理がエラーハンドリングで中断される", () => {
    // 乖離率算出に必要なデータに無効な値を設定
    const invalid_market_price = null;
    const assessment_price = 1000000;
    const divergence_rate = null;

    // 乖離率が算出不可の状態でエラーが発生することを確認
    expect(() =>
      classifyDivergencePatterns({
        market_price: invalid_market_price,
        assessment_price: assessment_price,
        divergence_rate: divergence_rate,
      })
    ).toThrow(/乖離率/);
  });

  test("市場相場がNULL値の場合、パターン分類処理がエラーハンドリングで中断される", () => {
    const invalid_market_price = null;
    const assessment_price = 1000000;

    expect(() =>
      classifyDivergencePatterns({
        market_price: invalid_market_price,
        assessment_price: assessment_price,
        divergence_rate: null,
      })
    ).toThrow(/乖離率/);
  });

  test("査定額がNULL値の場合、パターン分類処理がエラーハンドリングで中断される", () => {
    const market_price = 1000000;
    const invalid_assessment_price = null;

    expect(() =>
      classifyDivergencePatterns({
        market_price: market_price,
        assessment_price: invalid_assessment_price,
        divergence_rate: null,
      })
    ).toThrow(/乖離率/);
  });

  test("乖離率が負の無限大の場合、パターン分類処理がエラーハンドリングで中断される", () => {
    const market_price = 1000000;
    const assessment_price = 1000000;
    const invalid_divergence_rate = -Infinity;

    expect(() =>
      classifyDivergencePatterns({
        market_price: market_price,
        assessment_price: assessment_price,
        divergence_rate: invalid_divergence_rate,
      })
    ).toThrow(/乖離率/);
  });

  test("乖離率がNaNの場合、パターン分類処理がエラーハンドリングで中断される", () => {
    const market_price = 1000000;
    const assessment_price = 1000000;
    const invalid_divergence_rate = NaN;

    expect(() =>
      classifyDivergencePatterns({
        market_price: market_price,
        assessment_price: assessment_price,
        divergence_rate: invalid_divergence_rate,
      })
    ).toThrow(/乖離率/);
  });

  test("正常な入力値で相場乖離パターンが正しく分類される", () => {
    const market_price = 1000000;
    const assessment_price = 950000;
    const divergence_rate = -5;

    const result = classifyDivergencePatterns({
      market_price: market_price,
      assessment_price: assessment_price,
      divergence_rate: divergence_rate,
    });

    expect(result).toEqual({
      pattern: "過小",
      divergence_rate: -5,
      pattern_category: "under_estimate",
      is_valid: true,
    });
  });

  test("過大パターン（正の乖離率）が正しく分類される", () => {
    const market_price = 1000000;
    const assessment_price = 1100000;
    const divergence_rate = 10;

    const result = classifyDivergencePatterns({
      market_price: market_price,
      assessment_price: assessment_price,
      divergence_rate: divergence_rate,
    });

    expect(result).toEqual({
      pattern: "過大",
      divergence_rate: 10,
      pattern_category: "over_estimate",
      is_valid: true,
    });
  });

  test("標準パターン（乖離率ゼロ）が正しく分類される", () => {
    const market_price = 1000000;
    const assessment_price = 1000000;
    const divergence_rate = 0;

    const result = classifyDivergencePatterns({
      market_price: market_price,
      assessment_price: assessment_price,
      divergence_rate: divergence_rate,
    });

    expect(result).toEqual({
      pattern: "標準",
      divergence_rate: 0,
      pattern_category: "standard",
      is_valid: true,
    });
  });

  test("乖離率が許容範囲内（±5%）の場合、標準パターンとして分類される", () => {
    const market_price = 1000000;
    const assessment_price = 1025000;
    const divergence_rate = 2.5;

    const result = classifyDivergencePatterns({
      market_price: market_price,
      assessment_price: assessment_price,
      divergence_rate: divergence_rate,
    });

    expect(result.pattern).toBe("標準");
    expect(result.is_valid).toBe(true);
  });

  test("乖維率が許容範囲外（±50%以上）の場合、異常パターンとして分類される", () => {
    const market_price = 1000000;
    const assessment_price = 1600000;
    const divergence_rate = 60;

    const result = classifyDivergencePatterns({
      market_price: market_price,
      assessment_price: assessment_price,
      divergence_rate: divergence_rate,
    });

    expect(result).toEqual({
      pattern: "異常",
      divergence_rate: 60,
      pattern_category: "abnormal",
      is_valid: true,
    });
  });

  test("市場相場がゼロの場合、パターン分類処理がエラーハンドリングで中断される", () => {
    const invalid_market_price = 0;
    const assessment_price = 1000000;

    expect(() =>
      classifyDivergencePatterns({
        market_price: invalid_market_price,
        assessment_price: assessment_price,
        divergence_rate: null,
      })
    ).toThrow(/乖離率/);
  });

  test("査定額がマイナス値の場合、パターン分類処理がエラーハンドリングで中断される", () => {
    const market_price = 1000000;
    const invalid_assessment_price = -500000;

    expect(() =>
      classifyDivergencePatterns({
        market_price: market_price,
        assessment_price: invalid_assessment_price,
        divergence_rate: null,
      })
    ).toThrow(/乖離率/);
  });

  test("エラー発生時、エラーメッセージに「乖離率」というキーワードが含まれることを確認", () => {
    const market_price = 1000000;
    const invalid_assessment_price = null;

    const error_message = expect(() =>
      classifyDivergencePatterns({
        market_price: market_price,
        assessment_price: invalid_assessment_price,
        divergence_rate: null,
      })
    ).toThrow(/乖離率/);

    expect(error_message).toBeDefined();
  });
});