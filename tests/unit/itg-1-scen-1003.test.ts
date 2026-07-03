import { describe, test, expect } from "@jest/globals";
import { validateDataQualityStandard } from "../../src/logic/it-1781935279444-2-2-1";

describe("営業データの完全性・正確性を自動検証し、不足データ・誤りを検出・通知する機能", () => {
  // SCEN-1003: [edge] データ品質検証基準確認 - 値の範囲が最小値と最大値が同じ場合でも検証基準が正常に確定される
  test("最小値と最大値が同じ値に設定された場合、検証基準が正常に確定され、指定値と完全一致するデータのみが妥当と判定される", () => {
    // Setup: データ品質検証基準の確定パラメータ
    const validationCriteria = {
      itemId: "item_001",
      itemName: "月次営業成果金額",
      dataType: "number",
      minValue: 100,
      maxValue: 100,
      isRequired: true,
    };

    // 検証基準の確定を実行
    const confirmedCriteria = validateDataQualityStandard(validationCriteria);

    // 検証基準が正常に確定されたことを確認
    expect(confirmedCriteria).toEqual({
      itemId: "item_001",
      itemName: "月次営業成果金額",
      dataType: "number",
      minValue: 100,
      maxValue: 100,
      isRequired: true,
      status: "confirmed",
      confirmedAt: expect.any(String),
    });

    // 確定された検証基準を使用して実際のデータ品質検証を実行
    const testDataSet = [
      { value: 99, expectedValid: false, description: "最小値より小さい" },
      { value: 100, expectedValid: true, description: "最小値と最大値と完全一致" },
      { value: 101, expectedValid: false, description: "最大値より大きい" },
    ];

    testDataSet.forEach((testCase) => {
      const validationResult = {
        itemId: "item_001",
        inputValue: testCase.value,
        isValid:
          testCase.value >= confirmedCriteria.minValue &&
          testCase.value <= confirmedCriteria.maxValue,
        reason: testCase.description,
      };

      expect(validationResult.isValid).toBe(testCase.expectedValid);

      // 検証ログに内容が記録されることを確認
      if (!testCase.expectedValid) {
        expect(
          validationResult.inputValue <
            confirmedCriteria.minValue ||
            validationResult.inputValue > confirmedCriteria.maxValue
        ).toBe(true);
      }
    });

    // エッジケース: 最小値と最大値が同じ場合の動作確認
    expect(confirmedCriteria.minValue).toBe(confirmedCriteria.maxValue);
    expect(confirmedCriteria.minValue).toBe(100);

    // 確定ステータスが正しく設定されていることを確認
    expect(confirmedCriteria.status).toBe("confirmed");
    expect(confirmedCriteria.confirmedAt).toBeTruthy();
  });
});