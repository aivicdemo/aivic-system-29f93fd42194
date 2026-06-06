import { determineDifferenceInvestigationPriority } from "../../src/logic/it-1780551301636-1-2-1";

describe("生産実績データの異常値を自動検出し原因調査に必要な関連データを抽出する機能", () => {
  test("差異金額・品目重要度・過去差異頻度を総合評価して正しい優先順位を決定する", () => {
    // SCEN-456
    const differenceItems = [
      {
        itemCode: "ITEM001",
        itemName: "高重要度資材A",
        theoreticalQuantity: 1000,
        actualQuantity: 800,
        unitPrice: 500,
        categoryImportance: "A"
      },
      {
        itemCode: "ITEM002", 
        itemName: "中重要度資材B",
        theoreticalQuantity: 2000,
        actualQuantity: 1900,
        unitPrice: 300,
        categoryImportance: "B"
      },
      {
        itemCode: "ITEM003",
        itemName: "低重要度資材C", 
        theoreticalQuantity: 500,
        actualQuantity: 450,
        unitPrice: 200,
        categoryImportance: "C"
      }
    ];

    const historicalDifferenceData = [
      {
        itemCode: "ITEM001",
        differenceFrequency: 4,
        lastDifferenceDate: "2024-01-10"
      },
      {
        itemCode: "ITEM002",
        differenceFrequency: 2,
        lastDifferenceDate: "2024-01-05"  
      },
      {
        itemCode: "ITEM003",
        differenceFrequency: 1,
        lastDifferenceDate: "2023-12-01"
      }
    ];

    const result = determineDifferenceInvestigationPriority(differenceItems, historicalDifferenceData);

    // ITEM001の優先度スコア計算: 差異金額(100000円) >= 100000で30点 + カテゴリA(25点) + 頻度4回>=3で20点 + 最終差異30日以内で15点 = 90点
    // ITEM002の優先度スコア計算: 差異金額(30000円) < 100000で0点 + カテゴリB(15点) + 頻度2回<3で0点 + 最終差異30日以内で15点 = 30点  
    // ITEM003の優先度スコア計算: 差異金額(10000円) < 100000で0点 + カテゴリC(5点) + 頻度1回<3で0点 + 最終差異30日超で0点 = 5点

    expect(result).toHaveLength(3);
    
    // 優先順位1位: ITEM001 (スコア90点)
    expect(result[0].itemCode).toBe("ITEM001");
    expect(result[0].itemName).toBe("高重要度資材A");
    expect(result[0].priorityRank).toBe(1);
    expect(result[0].priorityScore).toBe(90);
    expect(result[0].investigationReason).toBe("高金額差異・高重要度・頻繁差異発生");

    // 優先順位2位: ITEM002 (スコア30点) 
    expect(result[1].itemCode).toBe("ITEM002");
    expect(result[1].itemName).toBe("中重要度資材B");
    expect(result[1].priorityRank).toBe(2);
    expect(result[1].priorityScore).toBe(30);
    expect(result[1].investigationReason).toBe("中重要度・最近差異発生");

    // 優先順位3位: ITEM003 (スコア5点)
    expect(result[2].itemCode).toBe("ITEM003");
    expect(result[2].itemName).toBe("低重要度資材C");
    expect(result[2].priorityRank).toBe(3);
    expect(result[2].priorityScore).toBe(5);
    expect(result[2].investigationReason).toBe("低重要度");
  });
});