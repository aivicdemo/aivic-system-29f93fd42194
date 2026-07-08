import { recordImprovementFeedback } from "../../src/logic/it-6-3-1";

describe("改善効果検証フィードバック記録機能", () => {
  test("SCEN-1156: 改善内容1週間実務適用後のフィードバック記録", () => {
    // Arrange: 改善効果検証フィードバック記録に必要な入力データ
    const improvement_id = "IMP-2024-001";
    const assessor_id = "ASR-00123";
    const effect_presence = "有";
    const effect_magnitude = 3; // 5段階評価で中程度 = 3
    const side_effect = "特になし";
    const challenges = "実務運用時の時間負荷がやや増加";
    const recorded_at_base = new Date("2024-02-15T14:30:00Z");

    // Act: 改善効果検証フィードバック記録関数を呼び出し
    const result = recordImprovementFeedback({
      improvement_id,
      assessor_id,
      effect_presence,
      effect_magnitude,
      side_effect,
      challenges,
      recorded_at: recorded_at_base,
    });

    // Assert: 記録内容の正確性を複数の観点から検証
    // 1. 戻り値の型と基本構造
    expect(result).toBeDefined();
    expect(result).toHaveProperty("feedback_id");
    expect(result).toHaveProperty("improvement_id");
    expect(result).toHaveProperty("assessor_id");
    expect(result).toHaveProperty("effect_presence");
    expect(result).toHaveProperty("effect_magnitude");
    expect(result).toHaveProperty("side_effect");
    expect(result).toHaveProperty("challenges");
    expect(result).toHaveProperty("recorded_at");
    expect(result).toHaveProperty("status");

    // 2. 改善ID と査定員IDが正確に記録されているか
    expect(result.improvement_id).toBe(improvement_id);
    expect(result.assessor_id).toBe(assessor_id);

    // 3. 効果有無が正確に記録されているか
    expect(result.effect_presence).toBe("有");
    expect(["有", "無", "要検証"]).toContain(result.effect_presence);

    // 4. 効果の大きさが5段階評価の数値で正確に記録されているか
    expect(result.effect_magnitude).toBe(3);
    expect(result.effect_magnitude).toBeGreaterThanOrEqual(1);
    expect(result.effect_magnitude).toBeLessThanOrEqual(5);

    // 5. 副作用の記録内容が正確か
    expect(result.side_effect).toBe("特になし");
    expect(typeof result.side_effect).toBe("string");

    // 6. 課題の記録内容が正確か
    expect(result.challenges).toBe("実務運用時の時間負荷がやや増加");
    expect(typeof result.challenges).toBe("string");

    // 7. 記録日時が入力値と一致しているか
    expect(result.recorded_at).toBe(recorded_at_base.toISOString());

    // 8. 保存ステータスが「完了」に設定されているか
    expect(result.status).toBe("完了");

    // 9. フィードバック ID が生成されているか（一意性の確認）
    expect(result.feedback_id).toBeTruthy();
    expect(typeof result.feedback_id).toBe("string");
    expect(result.feedback_id.length).toBeGreaterThan(0);

    // 10. 全フィールドが null/undefined でないことを確認
    expect(result.improvement_id).not.toBeNull();
    expect(result.assessor_id).not.toBeNull();
    expect(result.effect_presence).not.toBeNull();
    expect(result.effect_magnitude).not.toBeNull();
    expect(result.side_effect).not.toBeNull();
    expect(result.challenges).not.toBeNull();
    expect(result.recorded_at).not.toBeNull();

    // 11. 記録が改善効果検証一覧に反映可能な形式であるか
    expect(result).toEqual({
      feedback_id: result.feedback_id,
      improvement_id: "IMP-2024-001",
      assessor_id: "ASR-00123",
      effect_presence: "有",
      effect_magnitude: 3,
      side_effect: "特になし",
      challenges: "実務運用時の時間負荷がやや増加",
      recorded_at: recorded_at_base.toISOString(),
      status: "完了",
    });
  });
});