import { calculateCustomizationPriority } from "../../src/logic/it-1-br-6-2-1";

describe("カスタマイズ優先度決定 - 影響度と実装難度から優先度ランクを判定", () => {
  test("SCEN-1350: 影響度0・実装難度100のとき優先度ランク『低』と判定される", () => {
    // Arrange
    const input = {
      impactScore: 0,
      implementationDifficultyScore: 100,
    };

    // Act
    const result = calculateCustomizationPriority(input);

    // Assert
    expect(result.priorityRank).toBe("低");
    expect(result.priorityScore).toBe(0);
    expect(typeof result.priorityRank).toBe("string");
    expect(typeof result.priorityScore).toBe("number");
  });

  test("SCEN-1350-補足: 影響度50・実装難度50のとき優先度ランク『中』と判定される", () => {
    // Arrange
    const input = {
      impactScore: 50,
      implementationDifficultyScore: 50,
    };

    // Act
    const result = calculateCustomizationPriority(input);

    // Assert
    expect(result.priorityRank).toBe("中");
    expect(result.priorityScore).toBe(50);
  });

  test("SCEN-1350-補足: 影響度100・実装難度0のとき優先度ランク『高』と判定される", () => {
    // Arrange
    const input = {
      impactScore: 100,
      implementationDifficultyScore: 0,
    };

    // Act
    const result = calculateCustomizationPriority(input);

    // Assert
    expect(result.priorityRank).toBe("高");
    expect(result.priorityScore).toBe(100);
  });

  test("SCEN-1350-エラー: 影響度がマイナスのとき例外を発生させる", () => {
    // Arrange
    const input = {
      impactScore: -10,
      implementationDifficultyScore: 50,
    };

    // Act & Assert
    expect(() => calculateCustomizationPriority(input)).toThrow(/影響度/);
  });

  test("SCEN-1350-エラー: 実装難度が100を超えるとき例外を発生させる", () => {
    // Arrange
    const input = {
      impactScore: 50,
      implementationDifficultyScore: 101,
    };

    // Act & Assert
    expect(() => calculateCustomizationPriority(input)).toThrow(/実装難度/);
  });
});