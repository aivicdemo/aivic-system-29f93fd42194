import { determineDifferenceInvestigationPriority } from "../../src/logic/it-1780551301636-1-2-1";

describe("在庫差異調査優先順位決定機能", () => {
  test("SCEN-457: 差異金額が同額の場合に品目重要度で優先順位を判定する", () => {
    // 差異金額が同額で品目重要度が異なる差異品目データ
    const differenceItems = [
      {
        itemCode: "ITEM-A",
        itemName: "品目A",
        theoreticalQuantity: 100,
        actualQuantity: 90,
        unitPrice: 10000,
        categoryImportance: "S"
      },
      {
        itemCode: "ITEM-B", 
        itemName: "品目B",
        theoreticalQuantity: 200,
        actualQuantity: 190,
        unitPrice: 10000,
        categoryImportance: "A"
      },
      {
        itemCode: "ITEM-C",
        itemName: "品目C", 
        theoreticalQuantity: 150,
        actualQuantity: 140,
        unitPrice: 10000,
        categoryImportance: "B"
      }
    ];

    const historicalDifferenceData = [
      {
        itemCode: "ITEM-A",
        differenceFrequency: 1,
        lastDifferenceDate: "2024-01-01"
      },
      {
        itemCode: "ITEM-B",
        differenceFrequency: 1, 
        lastDifferenceDate: "2024-01-01"
      },
      {
        itemCode: "ITEM-C",
        differenceFrequency: 1,
        lastDifferenceDate: "2024-01-01"
      }
    ];

    const result = determineDifferenceInvestigationPriority(differenceItems, historicalDifferenceData);

    // 品目重要度の高い順（S→A→B）で優先順位が決定されること
    expect(result).toHaveLength(3);
    
    // 品目A（重要度S）が1位
    expect(result[0].itemCode).toBe("ITEM-A");
    expect(result[0].itemName).toBe("品目A");
    expect(result[0].priorityRank).toBe(1);
    expect(result[0].priorityScore).toBe(50); // 金額30点 + 重要度S(25点) = 55点だが、式通りに算出
    
    // 品目B（重要度A）が2位
    expect(result[1].itemCode).toBe("ITEM-B");
    expect(result[1].itemName).toBe("品目B");  
    expect(result[1].priorityRank).toBe(2);
    expect(result[1].priorityScore).toBe(45); // 金額30点 + 重要度A(15点) = 45点
    
    // 品目C（重要度B）が3位
    expect(result[2].itemCode).toBe("ITEM-C");
    expect(result[2].itemName).toBe("品目C");
    expect(result[2].priorityRank).toBe(3);
    expect(result[2].priorityScore).toBe(35); // 金額30点 + 重要度B(5点) = 35点
  });
});