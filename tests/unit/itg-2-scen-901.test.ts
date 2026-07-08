import { defineUnifiedCriteria } from "../../src/logic/it-6-3-1";

describe("査定判定ロジックの適用履歴と根拠の記録・検索機能", () => {
  test("SCEN-901: 統一基準定義時に必須項目が不足している場合にエラーを返す", () => {
    // Arrange
    const incompleteUnifiedCriteria = {
      categoryName: "",
      evaluationStandard: "高・中・低の3段階評価",
      dataQualityThreshold: 80,
      minimumSampleSize: 50,
    };

    // Act & Assert
    expect(() => defineUnifiedCriteria(incompleteUnifiedCriteria)).toThrow(
      /カテゴリ名/
    );
  });

  test("SCEN-901: 統一基準定義時に複数の必須項目が不足している場合、最初の不足項目でエラーを返す", () => {
    // Arrange
    const incompleteUnifiedCriteria = {
      categoryName: "",
      evaluationStandard: "",
      dataQualityThreshold: 80,
      minimumSampleSize: 50,
    };

    // Act & Assert
    expect(() => defineUnifiedCriteria(incompleteUnifiedCriteria)).toThrow(
      /カテゴリ名|評価基準/
    );
  });

  test("SCEN-901: 統一基準定義時に評価基準が不足している場合にエラーを返す", () => {
    // Arrange
    const incompleteUnifiedCriteria = {
      categoryName: "工事種別別単価",
      evaluationStandard: "",
      dataQualityThreshold: 80,
      minimumSampleSize: 50,
    };

    // Act & Assert
    expect(() => defineUnifiedCriteria(incompleteUnifiedCriteria)).toThrow(
      /評価基準/
    );
  });

  test("SCEN-901: すべての必須項目が満たされている場合、統一基準定義を正常に保存する", () => {
    // Arrange
    const completeUnifiedCriteria = {
      categoryName: "工事種別別単価",
      evaluationStandard: "高・中・低の3段階評価",
      dataQualityThreshold: 80,
      minimumSampleSize: 50,
      createdAt: new Date("2024-01-15T10:00:00Z"),
      createdBy: "user_12345",
    };

    // Act
    const result = defineUnifiedCriteria(completeUnifiedCriteria);

    // Assert
    expect(result).toEqual({
      id: expect.any(String),
      categoryName: "工事種別別単価",
      evaluationStandard: "高・中・低の3段階評価",
      dataQualityThreshold: 80,
      minimumSampleSize: 50,
      createdAt: new Date("2024-01-15T10:00:00Z"),
      createdBy: "user_12345",
      status: "saved",
    });
    expect(result.status).toBe("saved");
  });

  test("SCEN-901: 統一基準定義時にカテゴリ名のみが不足している場合にエラーを返す", () => {
    // Arrange
    const missingCategoryName = {
      categoryName: null,
      evaluationStandard: "基準値±20%以内",
      dataQualityThreshold: 75,
      minimumSampleSize: 100,
    };

    // Act & Assert
    expect(() =>
      defineUnifiedCriteria(
        missingCategoryName as unknown as Record<string, unknown>
      )
    ).toThrow(/カテゴリ名/);
  });

  test("SCEN-901: 統一基準定義時に必須項目が存在するが空文字列の場合にエラーを返す", () => {
    // Arrange
    const emptyStringCriteria = {
      categoryName: "   ",
      evaluationStandard: "基準値±20%以内",
      dataQualityThreshold: 75,
      minimumSampleSize: 100,
    };

    // Act & Assert
    expect(() => defineUnifiedCriteria(emptyStringCriteria)).toThrow(
      /カテゴリ名/
    );
  });
});