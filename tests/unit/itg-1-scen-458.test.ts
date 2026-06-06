import { determineDifferenceInvestigationPriority } from "../../src/logic/it-1780551301636-1-2-1";

describe("生産実績データの異常値を自動検出し原因調査に必要な関連データを抽出する機能", () => {
  test("差異品目データが不正な場合にエラーを返す", () => {
    // SCEN-458

    // 不正な差異品目データ（null値を含むデータ）
    const invalidDifferenceItemsWithNull = [
      {
        itemCode: null,
        itemName: "資材A",
        theoreticalQuantity: 100,
        actualQuantity: 95,
        unitPrice: 500,
        categoryImportance: "A"
      }
    ];

    const validHistoricalData = [
      {
        itemCode: "ITEM001",
        differenceFrequency: 2,
        lastDifferenceDate: "2024-01-10"
      }
    ];

    expect(() =>
      determineDifferenceInvestigationPriority(invalidDifferenceItemsWithNull, validHistoricalData)
    ).toThrow(/差異品目/);

    // 不正な差異品目データ（空文字を含むデータ）
    const invalidDifferenceItemsWithEmptyString = [
      {
        itemCode: "",
        itemName: "資材B",
        theoreticalQuantity: 200,
        actualQuantity: 180,
        unitPrice: 300,
        categoryImportance: "B"
      }
    ];

    expect(() =>
      determineDifferenceInvestigationPriority(invalidDifferenceItemsWithEmptyString, validHistoricalData)
    ).toThrow(/差異品目/);

    // 不正な差異品目データ（不正な品目コード）
    const invalidDifferenceItemsWithInvalidCode = [
      {
        itemCode: "INVALID-CODE-###",
        itemName: "資材C",
        theoreticalQuantity: 50,
        actualQuantity: 45,
        unitPrice: 800,
        categoryImportance: "C"
      }
    ];

    expect(() =>
      determineDifferenceInvestigationPriority(invalidDifferenceItemsWithInvalidCode, validHistoricalData)
    ).toThrow(/品目コード/);

    // 差異品目データ配列が空の場合
    const emptyDifferenceItems = [];

    expect(() =>
      determineDifferenceInvestigationPriority(emptyDifferenceItems, validHistoricalData)
    ).toThrow(/差異品目/);
  });
});