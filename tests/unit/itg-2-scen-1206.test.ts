import { generateImprovementMeasures } from "../../src/logic/it-6-2-2-2";

describe("改善対策立案機能 - 複数原因併存時の統合対策生成", () => {
  // SCEN-1206
  test("複数の不適合原因が併存する場合に統合的な改善対策が生成される", () => {
    // 複数の不適合原因を含むテストデータ
    const nonconformances = [
      {
        id: "nc001",
        assessorId: "assessor_A",
        cause_category: "skill_gap",
        cause_detail: "新人査定員の判定基準理解不足",
        severity: 85,
        frequency: 12,
        related_causes: ["nc002"],
      },
      {
        id: "nc002",
        assessorId: "assessor_A",
        cause_category: "criteria_ambiguity",
        cause_detail: "判定基準の曖昧性により複数解釈が存在",
        severity: 75,
        frequency: 18,
        related_causes: ["nc001", "nc003"],
      },
      {
        id: "nc003",
        assessorId: "assessor_B",
        cause_category: "system_error",
        cause_detail: "システム入力時の誤操作による誤判定",
        severity: 60,
        frequency: 8,
        related_causes: ["nc002"],
      },
    ];

    const result = generateImprovementMeasures(nonconformances);

    // 生成結果の構造検証
    expect(result).toHaveProperty("individual_measures");
    expect(result).toHaveProperty("integrated_measures");
    expect(result).toHaveProperty("measure_map");
    expect(result).toHaveProperty("priority_ranking");

    // 個別対策が各原因に対応して生成されていることを確認
    expect(Array.isArray(result.individual_measures)).toBe(true);
    expect(result.individual_measures.length).toBe(3);

    const skill_measure = result.individual_measures.find(
      (m: any) => m.target_cause_id === "nc001"
    );
    expect(skill_measure).toBeDefined();
    expect(skill_measure.measure_type).toBe("training");
    expect(skill_measure.description).toContain("判定基準");

    const criteria_measure = result.individual_measures.find(
      (m: any) => m.target_cause_id === "nc002"
    );
    expect(criteria_measure).toBeDefined();
    expect(criteria_measure.measure_type).toBe("guideline_revision");

    const system_measure = result.individual_measures.find(
      (m: any) => m.target_cause_id === "nc003"
    );
    expect(system_measure).toBeDefined();
    expect(system_measure.measure_type).toBe("process_improvement");

    // 統合対策が生成されていることを確認
    expect(Array.isArray(result.integrated_measures)).toBe(true);
    expect(result.integrated_measures.length).toBeGreaterThan(0);

    // 統合対策の検証：複数原因を横断する対策が含まれていることを確認
    const integrated = result.integrated_measures[0];
    expect(integrated).toHaveProperty("integrated_measure_id");
    expect(integrated).toHaveProperty("target_cause_ids");
    expect(Array.isArray(integrated.target_cause_ids)).toBe(true);
    expect(integrated.target_cause_ids.length).toBeGreaterThanOrEqual(2);

    // 統合対策の内容検証：スキルギャップと基準曖昧性を同時に解決する対策
    const skill_criteria_integrated = result.integrated_measures.find(
      (m: any) =>
        m.target_cause_ids.includes("nc001") &&
        m.target_cause_ids.includes("nc002")
    );
    expect(skill_criteria_integrated).toBeDefined();
    expect(skill_criteria_integrated.integrated_description).toContain(
      "統一"
    );
    expect(skill_criteria_integrated.integration_type).toBe(
      "criteria_and_training"
    );

    // 原因間の関連性がマッピングされていることを確認
    expect(result.measure_map).toHaveProperty("nc001");
    expect(result.measure_map["nc001"]).toHaveProperty("individual_measure_id");
    expect(result.measure_map["nc001"]).toHaveProperty(
      "related_integrated_measures"
    );
    expect(Array.isArray(result.measure_map["nc001"].related_integrated_measures)).toBe(true);
    expect(result.measure_map["nc001"].related_integrated_measures.length).toBeGreaterThan(0);

    // 重複の確認：同じ対策が重複していないことを確認
    const all_measure_ids = [
      ...result.individual_measures.map((m: any) => m.id),
      ...result.integrated_measures.map((m: any) => m.integrated_measure_id),
    ];
    const unique_ids = new Set(all_measure_ids);
    expect(unique_ids.size).toBe(all_measure_ids.length);

    // 優先度ランキングの検証
    expect(Array.isArray(result.priority_ranking)).toBe(true);
    expect(result.priority_ranking.length).toBeGreaterThan(0);

    const first_priority = result.priority_ranking[0];
    expect(first_priority).toHaveProperty("rank");
    expect(first_priority).toHaveProperty("measure_id");
    expect(first_priority).toHaveProperty("priority_score");
    expect(first_priority.rank).toBe(1);
    expect(typeof first_priority.priority_score).toBe("number");
    expect(first_priority.priority_score).toBeGreaterThanOrEqual(0);
    expect(first_priority.priority_score).toBeLessThanOrEqual(100);

    // 優先度スコアが降順にソートされていることを確認
    for (let i = 1; i < result.priority_ranking.length; i++) {
      expect(result.priority_ranking[i].priority_score).toBeLessThanOrEqual(
        result.priority_ranking[i - 1].priority_score
      );
    }

    // 統合対策の優先度：複数原因対応の対策は高優先度になっていることを期待
    const integrated_priority = result.priority_ranking.find(
      (p: any) =>
        result.integrated_measures.some(
          (m: any) => m.integrated_measure_id === p.measure_id
        )
    );
    expect(integrated_priority).toBeDefined();
    expect(integrated_priority.priority_score).toBeGreaterThanOrEqual(70);

    // JSON構造の仕様準拠確認
    expect(result).toHaveProperty("generation_timestamp");
    expect(typeof result.generation_timestamp).toBe("string");

    expect(result).toHaveProperty("input_nonconformance_count");
    expect(result.input_nonconformance_count).toBe(3);

    expect(result).toHaveProperty("total_measures_count");
    expect(result.total_measures_count).toBe(
      result.individual_measures.length +
        result.integrated_measures.length
    );

    // 各個別対策が実装可能性情報を持っていることを確認
    result.individual_measures.forEach((measure: any) => {
      expect(measure).toHaveProperty("implementation_effort");
      expect(measure).toHaveProperty("estimated_duration_days");
      expect(typeof measure.implementation_effort).toBe("number");
      expect(typeof measure.estimated_duration_days).toBe("number");
      expect(measure.implementation_effort).toBeGreaterThan(0);
      expect(measure.estimated_duration_days).toBeGreaterThan(0);
    });

    // 各統合対策が関連性情報を持っていることを確認
    result.integrated_measures.forEach((measure: any) => {
      expect(measure).toHaveProperty("cause_relationship");
      expect(typeof measure.cause_relationship).toBe("object");
      expect(measure.cause_relationship).toHaveProperty("primary_cause");
      expect(measure.cause_relationship).toHaveProperty("related_causes");
      expect(Array.isArray(measure.cause_relationship.related_causes)).toBe(
        true
      );
    });

    // 矛盾がないことを確認：同じ原因に対する対策が矛盾していないこと
    const cause_nc001_measures = result.individual_measures.filter(
      (m: any) => m.target_cause_id === "nc001"
    );
    expect(cause_nc001_measures.length).toBe(1);

    // 統合対策のマッピングが正確であることを確認
    result.integrated_measures.forEach((integrated_measure: any) => {
      integrated_measure.target_cause_ids.forEach((cause_id: string) => {
        expect(result.measure_map[cause_id].related_integrated_measures).toContain(
          integrated_measure.integrated_measure_id
        );
      });
    });
  });
});