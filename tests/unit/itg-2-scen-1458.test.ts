import { classifyDivergencePatterns } from "../../src/logic/it-1-br-2-2-2-1";

describe("乖離パターン自動分類・可視化機能", () => {
  test("SCEN-1458: 分類対象データが不正なフォーマットの場合、エラーを返す", () => {
    // 不正なXML形式データ
    const invalidXmlData = "<root><data>invalid</data></root>";

    expect(() => classifyDivergencePatterns(invalidXmlData)).toThrow(
      /JSON/
    );

    // 不正なテキスト形式データ
    const invalidTextData = "this is plain text, not JSON";

    expect(() => classifyDivergencePatterns(invalidTextData)).toThrow(
      /JSON/
    );

    // 破損したJSON（括弧が閉じられていない）
    const malformedJsonData = '{"region":"Tokyo","divergenceRate":15.5';

    expect(() => classifyDivergencePatterns(malformedJsonData)).toThrow(
      /JSON/
    );

    // 正しいJSON形式のデータで成功ケース
    const validData = JSON.stringify({
      region: "Tokyo",
      constructionType: "Building",
      period: "2024-01",
      divergenceRate: 15.5,
      divergenceAmount: 250000,
      referenceDataCount: 12,
      correctionCoefficient: 1.05,
    });

    const result = classifyDivergencePatterns(validData);

    expect(result).toEqual({
      isValid: true,
      classification: expect.any(String),
      region: "Tokyo",
      constructionType: "Building",
      period: "2024-01",
      divergenceRate: 15.5,
      divergenceAmount: 250000,
      referenceDataCount: 12,
      correctionCoefficient: 1.05,
      classifiedAt: expect.any(String),
    });

    expect(result.classification).toMatch(/standard|excessive|minimal/);
  });
});