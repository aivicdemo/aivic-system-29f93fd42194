import { calculatePersonnelAllocationScenarioMetrics } from "../../src/logic/it-6-2-1-1";

describe("人員配置シナリオの評価指標自動計算と可視化", () => {
  // SCEN-965
  test("優先度の重み付けが矛盾する場合にエラーを返す", () => {
    const scenarioInput = {
      scenarioId: "scenario_001",
      evaluationItems: [
        {
          itemId: "item_assess_quality",
          itemName: "査定精度",
          weight: 40,
        },
        {
          itemId: "item_process_speed",
          itemName: "処理速度",
          weight: 40,
        },
        {
          itemId: "item_cost_efficiency",
          itemName: "コスト効率",
          weight: 30,
        },
      ],
      scenarioMetrics: {
        assessmentAccuracy: 92.5,
        processingSpeed: 18.5,
        costEfficiency: 8500,
      },
    };

    expect(() => {
      calculatePersonnelAllocationScenarioMetrics(scenarioInput);
    }).toThrow(/優先度/);
  });

  test("優先度の重み付けが正常な場合に最適案を計算する", () => {
    const scenarioInput = {
      scenarioId: "scenario_002",
      evaluationItems: [
        {
          itemId: "item_assess_quality",
          itemName: "査定精度",
          weight: 40,
        },
        {
          itemId: "item_process_speed",
          itemName: "処理速度",
          weight: 35,
        },
        {
          itemId: "item_cost_efficiency",
          itemName: "コスト効率",
          weight: 25,
        },
      ],
      scenarioMetrics: {
        assessmentAccuracy: 92.5,
        processingSpeed: 18.5,
        costEfficiency: 8500,
      },
      baselineMetrics: {
        assessmentAccuracy: 85.0,
        processingSpeed: 22.0,
        costEfficiency: 10000,
      },
    };

    const result = calculatePersonnelAllocationScenarioMetrics(scenarioInput);

    expect(result.totalScore).toBe(89.775);
    expect(result.isOptimal).toBe(true);
    expect(result.accuracyImprovement).toBe(7.5);
    expect(result.speedImprovement).toBe(3.5);
    expect(result.costEfficiency).toBe(1500);
    expect(result.recommendationMessage).toContain("最適");
  });

  test("すべての重み付けが100に満たない場合にエラーを返す", () => {
    const scenarioInput = {
      scenarioId: "scenario_003",
      evaluationItems: [
        {
          itemId: "item_assess_quality",
          itemName: "査定精度",
          weight: 30,
        },
        {
          itemId: "item_process_speed",
          itemName: "処理速度",
          weight: 35,
        },
        {
          itemId: "item_cost_efficiency",
          itemName: "コスト効率",
          weight: 20,
        },
      ],
      scenarioMetrics: {
        assessmentAccuracy: 92.5,
        processingSpeed: 18.5,
        costEfficiency: 8500,
      },
    };

    expect(() => {
      calculatePersonnelAllocationScenarioMetrics(scenarioInput);
    }).toThrow(/優先度/);
  });

  test("負の重み付け値が含まれる場合にエラーを返す", () => {
    const scenarioInput = {
      scenarioId: "scenario_004",
      evaluationItems: [
        {
          itemId: "item_assess_quality",
          itemName: "査定精度",
          weight: 50,
        },
        {
          itemId: "item_process_speed",
          itemName: "処理速度",
          weight: -10,
        },
        {
          itemId: "item_cost_efficiency",
          itemName: "コスト効率",
          weight: 60,
        },
      ],
      scenarioMetrics: {
        assessmentAccuracy: 92.5,
        processingSpeed: 18.5,
        costEfficiency: 8500,
      },
    };

    expect(() => {
      calculatePersonnelAllocationScenarioMetrics(scenarioInput);
    }).toThrow(/優先度/);
  });

  test("複数の評価項目で正確に重み付け計算を実行する", () => {
    const scenarioInput = {
      scenarioId: "scenario_005",
      evaluationItems: [
        {
          itemId: "item_assess_quality",
          itemName: "査定精度",
          weight: 50,
        },
        {
          itemId: "item_process_speed",
          itemName: "処理速度",
          weight: 30,
        },
        {
          itemId: "item_cost_efficiency",
          itemName: "コスト効率",
          weight: 20,
        },
      ],
      scenarioMetrics: {
        assessmentAccuracy: 95.0,
        processingSpeed: 20.0,
        costEfficiency: 9000,
      },
      baselineMetrics: {
        assessmentAccuracy: 85.0,
        processingSpeed: 25.0,
        costEfficiency: 12000,
      },
    };

    const result = calculatePersonnelAllocationScenarioMetrics(scenarioInput);

    expect(result.totalScore).toBe(93.25);
    expect(result.accuracyImprovement).toBe(10.0);
    expect(result.speedImprovement).toBe(5.0);
    expect(result.costEfficiency).toBe(3000);
    expect(result.isOptimal).toBe(true);
  });

  test("重み付けの合計が100を超える場合にエラーを返す", () => {
    const scenarioInput = {
      scenarioId: "scenario_006",
      evaluationItems: [
        {
          itemId: "item_assess_quality",
          itemName: "査定精度",
          weight: 45,
        },
        {
          itemId: "item_process_speed",
          itemName: "処理速度",
          weight: 40,
        },
        {
          itemId: "item_cost_efficiency",
          itemName: "コスト効率",
          weight: 20,
        },
      ],
      scenarioMetrics: {
        assessmentAccuracy: 92.5,
        processingSpeed: 18.5,
        costEfficiency: 8500,
      },
    };

    expect(() => {
      calculatePersonnelAllocationScenarioMetrics(scenarioInput);
    }).toThrow(/優先度/);
  });

  test("重み付けが0の評価項目を含む場合に正常に計算する", () => {
    const scenarioInput = {
      scenarioId: "scenario_007",
      evaluationItems: [
        {
          itemId: "item_assess_quality",
          itemName: "査定精度",
          weight: 50,
        },
        {
          itemId: "item_process_speed",
          itemName: "処理速度",
          weight: 50,
        },
        {
          itemId: "item_cost_efficiency",
          itemName: "コスト効率",
          weight: 0,
        },
      ],
      scenarioMetrics: {
        assessmentAccuracy: 94.0,
        processingSpeed: 19.5,
        costEfficiency: 9000,
      },
      baselineMetrics: {
        assessmentAccuracy: 85.0,
        processingSpeed: 24.0,
        costEfficiency: 11000,
      },
    };

    const result = calculatePersonnelAllocationScenarioMetrics(scenarioInput);

    expect(result.totalScore).toBe(91.75);
    expect(result.accuracyImprovement).toBe(9.0);
    expect(result.speedImprovement).toBe(4.5);
  });

  test("小数点以下の重み付け値で正確に計算する", () => {
    const scenarioInput = {
      scenarioId: "scenario_008",
      evaluationItems: [
        {
          itemId: "item_assess_quality",
          itemName: "査定精度",
          weight: 33.33,
        },
        {
          itemId: "item_process_speed",
          itemName: "処理速度",
          weight: 33.33,
        },
        {
          itemId: "item_cost_efficiency",
          itemName: "コスト効率",
          weight: 33.34,
        },
      ],
      scenarioMetrics: {
        assessmentAccuracy: 90.0,
        processingSpeed: 21.0,
        costEfficiency: 9500,
      },
      baselineMetrics: {
        assessmentAccuracy: 85.0,
        processingSpeed: 23.0,
        costEfficiency: 10500,
      },
    };

    const result = calculatePersonnelAllocationScenarioMetrics(scenarioInput);

    expect(result.totalScore).toBeCloseTo(89.54, 1);
    expect(result.isOptimal).toBe(true);
  });
});