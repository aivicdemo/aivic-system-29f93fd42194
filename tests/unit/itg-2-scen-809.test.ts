import { classifyPriceDivergencePattern } from "../../src/logic/it-1-br-6-2-1";

describe("相場乖離パターン自動分類機能", () => {
  // SCEN-809
  test("見積項目が相場より大幅に高い場合、パターンが『過大』と分類される", () => {
    const market_price = 10000;
    const quotation_price = 15000;

    const result = classifyPriceDivergencePattern({
      market_price,
      quotation_price,
    });

    expect(result).toEqual({
      pattern: "過大",
      divergence_rate: 50,
      divergence_amount: 5000,
    });
  });
});