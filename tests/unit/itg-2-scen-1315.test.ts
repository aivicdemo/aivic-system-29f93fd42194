import { judgeDeploymentFeasibility } from "../../src/logic/it-6-2-2-1";

describe("展開可能性判定と期待効果の定量抽出", () => {
  test("SCEN-1315: 処理時間短縮率30%、品質均一化指標95%、稼働率99%の場合、展開可能性を肯定判定で出力する", () => {
    // 入力値
    const input = {
      processingTimeShorteningRate: 30,
      qualityUniformityIndex: 95,
      operatingRate: 99,
    };

    // 実行
    const result = judgeDeploymentFeasibility(input);

    // 展開可能性が肯定判定であることを検証
    expect(result.feasibilityJudgment).toBe("可能");

    // ステータスメッセージが展開可能を示していることを検証
    expect(result.statusMessage).toMatch(/展開可能/);

    // 各指標が判定根拠として記録されていることを検証
    expect(result.judgmentBasis).toEqual({
      processingTimeShorteningRate: 30,
      qualityUniformityIndex: 95,
      operatingRate: 99,
    });

    // 判定根拠に含まれる各指標の値が入力値と一致することを検証
    expect(result.judgmentBasis.processingTimeShorteningRate).toBe(30);
    expect(result.judgmentBasis.qualityUniformityIndex).toBe(95);
    expect(result.judgmentBasis.operatingRate).toBe(99);

    // 入力値の妥当性検証が合格していることを検証
    expect(result.validationResult).toBe("合格");
  });
});