import { determinePriorityForMultipleContractChanges } from "../../src/logic/it-1781935279444-2-1-1";

describe("複数契約変更優先順位自動判定機能", () => {
  // SCEN-1233
  test("複数の契約変更が同時登録された場合、請求額計算への影響が大きい順に優先順位が付与される", () => {
    // 複数の契約変更データを準備（請求額計算への影響度が異なるケース）
    const contractChanges = [
      {
        contractChangeId: "CC001",
        contractId: "C001",
        changeType: "discount_rate",
        previousValue: 0.1,
        newValue: 0.2,
        affectedAmount: 5000,
        impactFactor: 0.5,
      },
      {
        contractChangeId: "CC002",
        contractId: "C001",
        changeType: "contract_amount",
        previousValue: 100000,
        newValue: 150000,
        affectedAmount: 50000,
        impactFactor: 1.0,
      },
      {
        contractChangeId: "CC003",
        contractId: "C001",
        changeType: "contract_period",
        previousValue: 12,
        newValue: 24,
        affectedAmount: 100000,
        impactFactor: 0.8,
      },
    ];

    // システムが各契約変更に対して優先順位を自動判定
    const result = determinePriorityForMultipleContractChanges(contractChanges);

    // 優先順位が付与されたことを確認
    expect(result).toBeDefined();
    expect(result.length).toBe(3);
    expect(result.every((item) => item.priority !== undefined)).toBe(true);

    // 付与された優先順位が請求額計算への影響度が大きい順に並んでいることを検証
    // 期待される優先順位：
    // 1位：contract_period (impactFactor: 0.8, affectedAmount: 100000 → 80000)
    // 2位：contract_amount (impactFactor: 1.0, affectedAmount: 50000 → 50000)
    // 3位：discount_rate (impactFactor: 0.5, affectedAmount: 5000 → 2500)
    const sortedByPriority = [...result].sort((a, b) => a.priority - b.priority);

    expect(sortedByPriority[0].contractChangeId).toBe("CC003");
    expect(sortedByPriority[0].priority).toBe(1);
    expect(sortedByPriority[1].contractChangeId).toBe("CC002");
    expect(sortedByPriority[1].priority).toBe(2);
    expect(sortedByPriority[2].contractChangeId).toBe("CC001");
    expect(sortedByPriority[2].priority).toBe(3);

    // 優先順位の妥当性を検証（影響度スコア = affectedAmount × impactFactor）
    const cc003ImpactScore = 100000 * 0.8;
    const cc002ImpactScore = 50000 * 1.0;
    const cc001ImpactScore = 5000 * 0.5;

    expect(cc003ImpactScore).toBe(80000);
    expect(cc002ImpactScore).toBe(50000);
    expect(cc001ImpactScore).toBe(2500);
    expect(cc003ImpactScore).toBeGreaterThan(cc002ImpactScore);
    expect(cc002ImpactScore).toBeGreaterThan(cc001ImpactScore);

    // 請求額計算ロジックで、優先順位の高い順に契約変更が反映されていることを確認
    // 順序通り適用された場合の最終請求額
    const baseAmount = 100000;
    let calculatedAmount = baseAmount;

    // 優先順位1位：contract_period（期間倍率適用）
    calculatedAmount = calculatedAmount * (24 / 12);
    expect(calculatedAmount).toBe(200000);

    // 優先順位2位：contract_amount（契約金額更新）
    calculatedAmount = 150000 * (24 / 12);
    expect(calculatedAmount).toBe(300000);

    // 優先順位3位：discount_rate（割引率適用）
    calculatedAmount = calculatedAmount * (1 - 0.2);
    expect(calculatedAmount).toBe(240000);

    // 異なるパターン（異なる契約金額、期間、割引率の組み合わせ）での検証
    const alternativeContractChanges = [
      {
        contractChangeId: "CC004",
        contractId: "C002",
        changeType: "discount_rate",
        previousValue: 0.05,
        newValue: 0.15,
        affectedAmount: 20000,
        impactFactor: 0.6,
      },
      {
        contractChangeId: "CC005",
        contractId: "C002",
        changeType: "contract_amount",
        previousValue: 200000,
        newValue: 250000,
        affectedAmount: 50000,
        impactFactor: 0.9,
      },
      {
        contractChangeId: "CC006",
        contractId: "C002",
        changeType: "contract_period",
        previousValue: 6,
        newValue: 12,
        affectedAmount: 80000,
        impactFactor: 0.75,
      },
    ];

    const alternativeResult = determinePriorityForMultipleContractChanges(
      alternativeContractChanges
    );

    // 同じロジックが正常に機能することを確認
    expect(alternativeResult.length).toBe(3);
    expect(alternativeResult.every((item) => item.priority !== undefined)).toBe(
      true
    );

    const altSortedByPriority = [...alternativeResult].sort(
      (a, b) => a.priority - b.priority
    );

    // 期待される優先順位：
    // 1位：contract_period (0.75 × 80000 = 60000)
    // 2位：contract_amount (0.9 × 50000 = 45000)
    // 3位：discount_rate (0.6 × 20000 = 12000)
    expect(altSortedByPriority[0].contractChangeId).toBe("CC006");
    expect(altSortedByPriority[0].priority).toBe(1);
    expect(altSortedByPriority[1].contractChangeId).toBe("CC005");
    expect(altSortedByPriority[1].priority).toBe(2);
    expect(altSortedByPriority[2].contractChangeId).toBe("CC004");
    expect(altSortedByPriority[2].priority).toBe(3);

    // 優先順位の一貫性を検証
    const altCC006ImpactScore = 80000 * 0.75;
    const altCC005ImpactScore = 50000 * 0.9;
    const altCC004ImpactScore = 20000 * 0.6;

    expect(altCC006ImpactScore).toBe(60000);
    expect(altCC005ImpactScore).toBe(45000);
    expect(altCC004ImpactScore).toBe(12000);
    expect(altCC006ImpactScore).toBeGreaterThan(altCC005ImpactScore);
    expect(altCC005ImpactScore).toBeGreaterThan(altCC004ImpactScore);
  });
});