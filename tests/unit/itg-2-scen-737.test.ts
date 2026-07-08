import { calculateTrustScoreByDistance } from "../../src/logic/it-6-3-1";

describe("査定判定ロジックの適用履歴と根拠の記録・検索機能", () => {
  // SCEN-737: [edge] 参照データ適切性判定・信頼度可視化機能 - 参照データの地域が査定対象から100km以上離れているとき信頼度が中に判定される
  test("参照データの地域が査定対象から100km以上離れている場合、信頼度が中に判定される", () => {
    // 査定対象の位置情報：東京都渋谷区
    const assessment_target_location = {
      latitude: 35.6595,
      longitude: 139.7004,
      region_name: "東京都渋谷区",
    };

    // 参照データの位置情報：大阪府大阪市（東京から約400km離れている）
    const reference_data_location = {
      latitude: 34.6937,
      longitude: 135.5023,
      region_name: "大阪府大阪市",
    };

    // 参照データの情報
    const reference_data = {
      past_case_id: "CASE-20240115-001",
      project_name: "商業施設改修工事",
      location: reference_data_location,
      sample_count: 25,
      data_age_days: 180,
      location_distance_km: 400,
    };

    // 信頼度判定の実行
    const trust_score_result = calculateTrustScoreByDistance({
      assessment_target_location: assessment_target_location,
      reference_data: reference_data,
    });

    // 期待結果の検証
    expect(trust_score_result.trust_level).toBe("中");
    expect(trust_score_result.trust_score).toBe(50);
    expect(trust_score_result.distance_km).toBe(400);
    expect(trust_score_result.distance_threshold_km).toBe(100);
    expect(trust_score_result.is_threshold_exceeded).toBe(true);
    expect(trust_score_result.reference_data_id).toBe("CASE-20240115-001");
    expect(trust_score_result.assessment_region).toBe("東京都渋谷区");
    expect(trust_score_result.reference_region).toBe("大阪府大阪市");
  });
});