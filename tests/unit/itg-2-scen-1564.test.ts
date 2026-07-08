import { generateCustomizationGuidance } from "../../src/logic/it-6-2-2-1";

describe("IT-6-2-2-1: カスタマイズ提案機能 - 業務複雑度スコア検証", () => {
  test("SCEN-1564: 業務複雑度スコアが無効値の場合に例外を発生させる", () => {
    // 正常な初期化済みコンテキスト
    const validContext = {
      department_id: "dept_001",
      initial_implementation_results: {
        processing_time_reduction_rate: 45,
        quality_uniformity_index: 0.88,
        system_uptime_rate: 99.5,
      },
    };

    // テストケース 1: null を無効値として渡す
    expect(() =>
      generateCustomizationGuidance({
        ...validContext,
        business_complexity_score: null as any,
      })
    ).toThrow(/業務複雑度/);

    // テストケース 2: undefined を無効値として渡す
    expect(() =>
      generateCustomizationGuidance({
        ...validContext,
        business_complexity_score: undefined as any,
      })
    ).toThrow(/業務複雑度/);

    // テストケース 3: 負の数を無効値として渡す
    expect(() =>
      generateCustomizationGuidance({
        ...validContext,
        business_complexity_score: -5,
      })
    ).toThrow(/業務複雑度/);

    // テストケース 4: 文字列を無効値として渡す
    expect(() =>
      generateCustomizationGuidance({
        ...validContext,
        business_complexity_score: "invalid" as any,
      })
    ).toThrow(/業務複雑度/);

    // テストケース 5: 100を超える値を無効値として渡す
    expect(() =>
      generateCustomizationGuidance({
        ...validContext,
        business_complexity_score: 101,
      })
    ).toThrow(/業務複雑度/);

    // テストケース 6: NaN を無効値として渡す
    expect(() =>
      generateCustomizationGuidance({
        ...validContext,
        business_complexity_score: NaN,
      })
    ).toThrow(/業務複雑度/);

    // テストケース 7: 有効な値（50）で正常に処理される
    const validProposal = generateCustomizationGuidance({
      ...validContext,
      business_complexity_score: 50,
      learning_data_readiness_rate: 0.75,
    });

    expect(validProposal).toBeDefined();
    expect(validProposal.guidance_level).toBeDefined();
    expect(validProposal.estimated_implementation_period_days).toBeGreaterThan(
      0
    );
    expect(validProposal.customization_priority_rank).toMatch(/高|中|低/);

    // テストケース 8: 境界値 0 で正常に処理される
    const boundaryProposalMin = generateCustomizationGuidance({
      ...validContext,
      business_complexity_score: 0,
      learning_data_readiness_rate: 0.6,
    });

    expect(boundaryProposalMin).toBeDefined();
    expect(boundaryProposalMin.guidance_level).toBeDefined();

    // テストケース 9: 境界値 100 で正常に処理される
    const boundaryProposalMax = generateCustomizationGuidance({
      ...validContext,
      business_complexity_score: 100,
      learning_data_readiness_rate: 0.9,
    });

    expect(boundaryProposalMax).toBeDefined();
    expect(boundaryProposalMax.guidance_level).toBeDefined();
    expect(
      boundaryProposalMax.estimated_implementation_period_days
    ).toBeGreaterThanOrEqual(boundaryProposalMin.estimated_implementation_period_days);

    // テストケース 10: 複雑度 75 + 学習データ準備率 0.8 の場合の期間計算検証
    const complexProposal = generateCustomizationGuidance({
      ...validContext,
      business_complexity_score: 75,
      learning_data_readiness_rate: 0.8,
    });

    expect(complexProposal.estimated_implementation_period_days).toBeBetween(
      20,
      60
    );
  });
});