import { generateBillingManualFromContracts } from "../../src/logic/it-1-2-1";

describe("請求ロジック・割引基準・例外パターンの文書化", () => {
  // SCEN-958
  test("複数契約の料金体系・割引基準から請求ルール手順書を正常に生成できる", () => {
    const contracts = [
      {
        contractId: "CONTRACT_A",
        contractName: "契約A",
        baseFee: 5000,
        unitPrice: 10,
        discountRules: [
          {
            unitThreshold: 100,
            discountRate: 0.05,
          },
        ],
      },
      {
        contractId: "CONTRACT_B",
        contractName: "契約B",
        baseFee: 8000,
        unitPrice: 8,
        discountRules: [
          {
            unitThreshold: 200,
            discountRate: 0.1,
          },
        ],
      },
    ];

    const result = generateBillingManualFromContracts(contracts);

    expect(result).toBeDefined();
    expect(result.documentFormat).toBe("PDF");
    expect(result.generatedAt).toBeDefined();

    expect(result.contractManuals).toHaveLength(2);

    const manualA = result.contractManuals.find(
      (m) => m.contractId === "CONTRACT_A"
    );
    expect(manualA).toBeDefined();
    expect(manualA.contractName).toBe("契約A");
    expect(manualA.billingFormula).toBe(
      "基本料金: 5,000円 + 従量課金: 10円/単位"
    );
    expect(manualA.discountConditions).toHaveLength(1);
    expect(manualA.discountConditions[0]).toEqual({
      condition: "100単位以上で5%割引",
      unitThreshold: 100,
      discountRate: 0.05,
    });

    const manualB = result.contractManuals.find(
      (m) => m.contractId === "CONTRACT_B"
    );
    expect(manualB).toBeDefined();
    expect(manualB.contractName).toBe("契約B");
    expect(manualB.billingFormula).toBe(
      "基本料金: 8,000円 + 従量課金: 8円/単位"
    );
    expect(manualB.discountConditions).toHaveLength(1);
    expect(manualB.discountConditions[0]).toEqual({
      condition: "200単位以上で10%割引",
      unitThreshold: 200,
      discountRate: 0.1,
    });

    // 契約Aの計算例検証: 150単位の場合
    // 基本料金 5,000 + 従量課金 150 * 10 = 5,000 + 1,500 = 6,500
    // 100単位以上で5%割引適用: 6,500 * (1 - 0.05) = 6,500 * 0.95 = 6,175
    expect(manualA.calculationExamples).toBeDefined();
    const exampleA = manualA.calculationExamples.find(
      (ex) => ex.units === 150
    );
    expect(exampleA).toBeDefined();
    expect(exampleA.baseAmount).toBe(6500);
    expect(exampleA.discountApplied).toBe(true);
    expect(exampleA.discountAmount).toBe(325);
    expect(exampleA.finalAmount).toBe(6175);

    // 契約Bの計算例検証: 250単位の場合
    // 基本料金 8,000 + 従量課金 250 * 8 = 8,000 + 2,000 = 10,000
    // 200単位以上で10%割引適用: 10,000 * (1 - 0.1) = 10,000 * 0.9 = 9,000
    expect(manualB.calculationExamples).toBeDefined();
    const exampleB = manualB.calculationExamples.find(
      (ex) => ex.units === 250
    );
    expect(exampleB).toBeDefined();
    expect(exampleB.baseAmount).toBe(10000);
    expect(exampleB.discountApplied).toBe(true);
    expect(exampleB.discountAmount).toBe(1000);
    expect(exampleB.finalAmount).toBe(9000);

    // 例外パターン検証
    expect(manualA.exceptionPatterns).toBeDefined();
    expect(manualA.exceptionPatterns.length).toBeGreaterThan(0);
    expect(manualB.exceptionPatterns).toBeDefined();
    expect(manualB.exceptionPatterns.length).toBeGreaterThan(0);

    // 手順書の完全性検証
    expect(result.tableOfContents).toBeDefined();
    expect(result.tableOfContents.length).toBe(2);
    expect(result.summary).toBeDefined();
    expect(result.summary).toContain("契約A");
    expect(result.summary).toContain("契約B");
  });
});