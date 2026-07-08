import { calculateEducationPriorityByAbility } from "../../src/logic/it-6-2-2-2";

describe("査定員別の判定精度・乖離パターン分析ダッシュボード", () => {
  // SCEN-1073: [normal] 教育指導優先度の自動付与 - 工種別・金額帯別の能力差に応じて指導テーマが自動特定される
  test("工種別・金額帯別・能力レベルの組み合わせで適切な指導テーマが自動特定される", () => {
    // === 初期状態: 建物工事、1000万円～3000万円帯、新人査定員（能力レベル 1/5） ===
    const input_junior_building_mid = {
      construction_type: "building",
      price_band: "10m_to_30m",
      assessor_ability_level: 1,
      assessor_id: "ASS001",
      month: "2024-01"
    };

    const result_junior_building_mid = calculateEducationPriorityByAbility(
      input_junior_building_mid
    );

    // 期待: 新人（能力レベル 1）は基礎的な指導テーマが優先度高（priority_score >= 80）
    expect(result_junior_building_mid).toEqual({
      assessor_id: "ASS001",
      construction_type: "building",
      price_band: "10m_to_30m",
      ability_level: 1,
      education_themes: [
        {
          theme_id: "THEME_001",
          theme_name: "見積書の基本的な項目読み取り",
          category: "fundamental",
          priority_score: 95,
          recommended_duration_hours: 4,
          rationale:
            "新人レベルでの基礎的な見積項目理解が最優先"
        },
        {
          theme_id: "THEME_002",
          theme_name: "建物工事の標準相場理解",
          category: "fundamental",
          priority_score: 90,
          recommended_duration_hours: 6,
          rationale:
            "建物工事の過去相場データとの照合基準習得"
        },
        {
          theme_id: "THEME_003",
          theme_name: "1000万円～3000万円帯での適切な質問スキル",
          category: "practical",
          priority_score: 75,
          recommended_duration_hours: 3,
          rationale:
            "当該金額帯での見積内容確認の質問技法"
        }
      ],
      ability_gap_analysis: {
        current_level: 1,
        target_level: 3,
        estimated_improvement_hours: 15,
        skill_gap_percentage: 66.67
      },
      generated_at: "2024-01-15T10:30:00Z"
    });

    // === ケース 2: 同じ工種（建物）で異なる金額帯（5000万円～1億円）の新人査定員 ===
    const input_junior_building_high = {
      construction_type: "building",
      price_band: "50m_to_100m",
      assessor_ability_level: 1,
      assessor_id: "ASS001",
      month: "2024-01"
    };

    const result_junior_building_high = calculateEducationPriorityByAbility(
      input_junior_building_high
    );

    // 期待: 高額帯でも新人向けには基礎テーマが優先だが、テーマ内容が高額帯向けに変わる
    expect(result_junior_building_high.education_themes[0]).toEqual({
      theme_id: "THEME_004",
      theme_name: "見積書の基本的な項目読み取り（高額案件対応）",
      category: "fundamental",
      priority_score: 92,
      recommended_duration_hours: 5,
      rationale:
        "新人レベルでの高額案件見積項目の理解が優先（複雑性増加対応）"
    });

    // === ケース 3: 異なる工種（土地）で同じ金額帯（1000万円～3000万円）の新人査定員 ===
    const input_junior_land_mid = {
      construction_type: "land",
      price_band: "10m_to_30m",
      assessor_ability_level: 1,
      assessor_id: "ASS002",
      month: "2024-01"
    };

    const result_junior_land_mid = calculateEducationPriorityByAbility(
      input_junior_land_mid
    );

    // 期待: 工種が変わるとテーマ内容が変わる（土地に特化した指導）
    expect(result_junior_land_mid.education_themes[1]).toEqual({
      theme_id: "THEME_005",
      theme_name: "土地工事の標準相場理解",
      category: "fundamental",
      priority_score: 88,
      recommended_duration_hours: 5,
      rationale:
        "土地工事の過去相場データとの照合基準習得"
    });

    // === ケース 4: 同じ条件（建物、1000万円～3000万円）で経験者（能力レベル 5/5）===
    const input_senior_building_mid = {
      construction_type: "building",
      price_band: "10m_to_30m",
      assessor_ability_level: 5,
      assessor_id: "ASS003",
      month: "2024-01"
    };

    const result_senior_building_mid = calculateEducationPriorityByAbility(
      input_senior_building_mid
    );

    // 期待: 経験者には応用的・実践的なテーマが優先度高く表示される
    expect(result_senior_building_mid.education_themes[0]).toEqual({
      theme_id: "THEME_010",
      theme_name: "複雑建物案件の乖離分析と判定ロジック最適化",
      category: "advanced",
      priority_score: 88,
      recommended_duration_hours: 2,
      rationale:
        "経験者向けの高度な相場判定最適化技法"
    });

    expect(result_senior_building_mid.ability_gap_analysis).toEqual({
      current_level: 5,
      target_level: 5,
      estimated_improvement_hours: 0,
      skill_gap_percentage: 0
    });

    // === ケース 5: 中級レベル査定員（能力レベル 3/5）で金額帯の能力差が大きい場合 ===
    const input_mid_building_high = {
      construction_type: "building",
      price_band: "50m_to_100m",
      assessor_ability_level: 3,
      assessor_id: "ASS004",
      month: "2024-01"
    };

    const result_mid_building_high = calculateEducationPriorityByAbility(
      input_mid_building_high
    );

    // 期待: 中級者でも高額帯は習熟度が落ちるため、実践的だが基礎補強も含まれる
    expect(result_mid_building_high.education_themes).toHaveLength(3);
    expect(result_mid_building_high.education_themes[0].priority_score).toBe(
      85
    );
    expect(result_mid_building_high.education_themes[0].category).toBe(
      "practical"
    );
    expect(result_mid_building_high.ability_gap_analysis.skill_gap_percentage).toBe(
      40
    );

    // === ケース 6: 指導テーマが複数工種にまたがる場合の一貫性確認 ===
    const input_junior_equipment_mid = {
      construction_type: "equipment",
      price_band: "10m_to_30m",
      assessor_ability_level: 1,
      assessor_id: "ASS005",
      month: "2024-01"
    };

    const result_junior_equipment_mid = calculateEducationPriorityByAbility(
      input_junior_equipment_mid
    );

    // 期待: 全工種で新人は基礎テーマが最優先（priority_score >= 90）
    expect(result_junior_equipment_mid.education_themes[0].priority_score).toBeGreaterThanOrEqual(
      90
    );
    expect(result_junior_equipment_mid.education_themes[0].category).toBe(
      "fundamental"
    );

    // === ケース 7: 能力レベルが中級から上級に変わった場合の差異確認 ===
    const result_mid_building_mid = calculateEducationPriorityByAbility({
      construction_type: "building",
      price_band: "10m_to_30m",
      assessor_ability_level: 3,
      assessor_id: "ASS006",
      month: "2024-01"
    });

    const result_advanced_building_mid = calculateEducationPriorityByAbility({
      construction_type: "building",
      price_band: "10m_to_30m",
      assessor_ability_level: 4,
      assessor_id: "ASS006",
      month: "2024-01"
    });

    // 期待: 能力レベル 3 から 4 に上げると、指導テーマの優先度と内容が変わる
    expect(result_mid_building_mid.education_themes[0].priority_score).toBeLessThan(
      result_advanced_building_mid.education_themes[0].priority_score
    );
    expect(result_advanced_building_mid.education_themes[0].category).toBe(
      "advanced"
    );

    // === ケース 8: 金額帯と工種の相互作用による複合効果 ===
    const input_junior_building_low = {
      construction_type: "building",
      price_band: "0m_to_10m",
      assessor_ability_level: 1,
      assessor_id: "ASS007",
      month: "2024-01"
    };

    const result_junior_building_low = calculateEducationPriorityByAbility(
      input_junior_building_low
    );

    // 期待: 低額帯でも新人には基礎テーマが優先だが、推奨学習時間は短い（複雑度低い）
    expect(result_junior_building_low.education_themes[0].recommended_duration_hours).toBeLessThan(
      result_junior_building_mid.education_themes[0].recommended_duration_hours
    );
    expect(result_junior_building_low.ability_gap_analysis.estimated_improvement_hours).toBeLessThan(
      result_junior_building_mid.ability_gap_analysis.estimated_improvement_hours
    );

    // === ケース 9: 出力フィールドの完全性確認 ===
    expect(result_junior_building_mid).toHaveProperty("assessor_id");
    expect(result_junior_building_mid).toHaveProperty("construction_type");
    expect(result_junior_building_mid).toHaveProperty("price_band");
    expect(result_junior_building_mid).toHaveProperty("ability_level");
    expect(result_junior_building_mid).toHaveProperty("education_themes");
    expect(result_junior_building_mid).toHaveProperty("ability_gap_analysis");
    expect(result_junior_building_mid).toHaveProperty("generated_at");

    // === ケース 10: 指導テーマの内部構造確認 ===
    const theme = result_junior_building_mid.education_themes[0];
    expect(theme).toHaveProperty("theme_id");
    expect(theme).toHaveProperty("theme_name");
    expect(theme).toHaveProperty("category");
    expect(theme).toHaveProperty("priority_score");
    expect(theme).toHaveProperty("recommended_duration_hours");
    expect(theme).toHaveProperty("rationale");

    expect(typeof theme.priority_score).toBe("number");
    expect(theme.priority_score).toBeGreaterThanOrEqual(0);
    expect(theme.priority_score).toBeLessThanOrEqual(100);
    expect(typeof theme.recommended_duration_hours).toBe("number");
    expect(theme.recommended_duration_hours).toBeGreaterThan(0);
  });
});