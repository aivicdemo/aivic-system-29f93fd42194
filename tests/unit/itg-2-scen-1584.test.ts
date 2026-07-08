import { judgeExpansionPlan } from '../../src/logic/it-6-2-1-1';

describe('展開計画実行可否判定機能 - 境界値検証', () => {
  test('SCEN-1584: 品質均一化指標・システム稼働率がGo基準最小値での境界判定を検証', () => {
    // テストデータセットアップ: Go基準の最小値を定義
    const qualityUniformityGoMinimum = 0.85;
    const systemUptimeGoMinimum = 0.95;

    // ケース1: 品質均一化指標とシステム稼働率の両方がGo基準の最小値
    const testCase1Input = {
      qualityUniformityIndex: qualityUniformityGoMinimum,
      systemUptimeRate: systemUptimeGoMinimum,
    };
    const result1 = judgeExpansionPlan(testCase1Input);
    expect(result1.judgment).toBe('Go');
    expect(result1.qualityUniformityMeetsStandard).toBe(true);
    expect(result1.uptimeMeetsStandard).toBe(true);

    // ケース2: 品質均一化指標がGo基準の最小値より0.001下回った場合
    const testCase2Input = {
      qualityUniformityIndex: qualityUniformityGoMinimum - 0.001,
      systemUptimeRate: systemUptimeGoMinimum,
    };
    const result2 = judgeExpansionPlan(testCase2Input);
    expect(result2.judgment).toBe('NoGo');
    expect(result2.qualityUniformityMeetsStandard).toBe(false);
    expect(result2.uptimeMeetsStandard).toBe(true);

    // ケース3: システム稼働率がGo基準の最小値より0.001下回った場合
    const testCase3Input = {
      qualityUniformityIndex: qualityUniformityGoMinimum,
      systemUptimeRate: systemUptimeGoMinimum - 0.001,
    };
    const result3 = judgeExpansionPlan(testCase3Input);
    expect(result3.judgment).toBe('NoGo');
    expect(result3.qualityUniformityMeetsStandard).toBe(true);
    expect(result3.uptimeMeetsStandard).toBe(false);

    // ケース4: 品質均一化指標とシステム稼働率の両方がGo基準の最小値より0.001下回った場合
    const testCase4Input = {
      qualityUniformityIndex: qualityUniformityGoMinimum - 0.001,
      systemUptimeRate: systemUptimeGoMinimum - 0.001,
    };
    const result4 = judgeExpansionPlan(testCase4Input);
    expect(result4.judgment).toBe('NoGo');
    expect(result4.qualityUniformityMeetsStandard).toBe(false);
    expect(result4.uptimeMeetsStandard).toBe(false);
  });
});