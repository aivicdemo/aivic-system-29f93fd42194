import { classifyMarketDeviationPattern } from "../../src/logic/it-1-br-6-2-1";

describe("相場乖離パターン自動分類", () => {
  test("SCEN-808: 見積項目が相場より大幅に低い場合、パターンが『過小』と分類される", () => {
    // Arrange: テスト用見積項目データを準備
    // 相場価格を100とした場合、見積価格を70以下に設定（乖離率30%以上）
    const market_standard_price = 100;
    const quotation_price = 70;
    const deviation_rate = ((quotation_price - market_standard_price) / market_standard_price) * 100;

    const input = {
      market_standard_price: market_standard_price,
      quotation_price: quotation_price,
      deviation_rate: deviation_rate,
    };

    // Act: 分類処理を実行
    const result = classifyMarketDeviationPattern(input);

    // Assert: 分類結果を検証
    // 乖離率が-30%（相場より30%低い）の場合、パターンが『過小』に分類されることを確認
    expect(result.pattern).toBe("過小");
    expect(result.deviation_rate).toBe(-30);
    expect(result.classification_status).toBe("completed");
  });
});