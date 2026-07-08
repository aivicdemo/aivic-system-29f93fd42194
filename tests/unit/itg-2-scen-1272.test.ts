import { validateMonthlyPerformanceData } from "../../src/logic/it-6-2-1-1";

describe("査定担当者別・工種別・金額帯別の判定精度指標の自動集計と可視化", () => {
  test("SCEN-1272: 月次実績データ自動検証機能 - 全査定員のデータが揃い業務ルール合致時、検証済みの統合データセットが生成される", () => {
    // Arrange: テストデータの準備
    const assessors = [
      {
        assessor_id: "ASS001",
        assessor_name: "査定員A",
        assessment_count: 45,
        average_assessment_amount: 1250000,
        assessment_time_minutes: 18,
        judgment_accuracy_rate: 92.5,
        judgment_consistency_score: 88,
        construction_type: "建築",
        amount_range: "1000万-2000万",
        region: "東京",
      },
      {
        assessor_id: "ASS002",
        assessor_name: "査定員B",
        assessment_count: 52,
        average_assessment_amount: 1580000,
        assessment_time_minutes: 22,
        judgment_accuracy_rate: 89.0,
        judgment_consistency_score: 85,
        construction_type: "土木",
        amount_range: "1500万-2500万",
        region: "大阪",
      },
      {
        assessor_id: "ASS003",
        assessor_name: "査定員C",
        assessment_count: 38,
        average_assessment_amount: 950000,
        assessment_time_minutes: 16,
        judgment_accuracy_rate: 94.2,
        judgment_consistency_score: 90,
        construction_type: "建築",
        amount_range: "500万-1500万",
        region: "名古屋",
      },
      {
        assessor_id: "ASS004",
        assessor_name: "査定員D",
        assessment_count: 61,
        average_assessment_amount: 1820000,
        assessment_time_minutes: 25,
        judgment_accuracy_rate: 87.5,
        judgment_consistency_score: 82,
        construction_type: "設備",
        amount_range: "1500万-2500万",
        region: "福岡",
      },
      {
        assessor_id: "ASS005",
        assessor_name: "査定員E",
        assessment_count: 48,
        average_assessment_amount: 1120000,
        assessment_time_minutes: 19,
        judgment_accuracy_rate: 91.8,
        judgment_consistency_score: 87,
        construction_type: "建築",
        amount_range: "1000万-2000万",
        region: "東京",
      },
    ];

    const validation_period = "2024-01";
    const business_rules = {
      assessment_count_min: 30,
      assessment_count_max: 70,
      average_assessment_amount_min: 500000,
      average_assessment_amount_max: 3000000,
      assessment_time_min_minutes: 12,
      assessment_time_max_minutes: 35,
      judgment_accuracy_min_rate: 85.0,
      judgment_consistency_min_score: 75,
    };

    // Act: 検証関数を実行
    const result = validateMonthlyPerformanceData(
      assessors,
      validation_period,
      business_rules
    );

    // Assert: 検証ステータスが「検証済み」であること
    expect(result.validation_status).toBe("検証済み");

    // Assert: 統合データセットが生成されていること
    expect(result.consolidated_dataset).toBeDefined();
    expect(Array.isArray(result.consolidated_dataset)).toBe(true);

    // Assert: 統合データセットに全査定員のデータが含まれていること（5名）
    expect(result.consolidated_dataset.length).toBe(5);

    // Assert: 統合データセット内の各要素が必須項目を保有していること
    result.consolidated_dataset.forEach((record) => {
      expect(record.assessor_id).toBeDefined();
      expect(record.assessor_name).toBeDefined();
      expect(record.assessment_count).toBeDefined();
      expect(record.average_assessment_amount).toBeDefined();
      expect(record.assessment_time_minutes).toBeDefined();
      expect(record.judgment_accuracy_rate).toBeDefined();
      expect(record.judgment_consistency_score).toBeDefined();
    });

    // Assert: 統合データセット内のデータ整合性を検証
    // 合計査定件数の正確性
    const total_assessment_count = result.consolidated_dataset.reduce(
      (sum, record) => sum + record.assessment_count,
      0
    );
    expect(total_assessment_count).toBe(45 + 52 + 38 + 61 + 48); // 244

    // Assert: 平均査定精度の計算が正確であること
    const aggregate_judgment_accuracy =
      result.consolidated_dataset.reduce(
        (sum, record) => sum + record.judgment_accuracy_rate,
        0
      ) / result.consolidated_dataset.length;
    const expected_avg_accuracy = (92.5 + 89.0 + 94.2 + 87.5 + 91.8) / 5;
    expect(aggregate_judgment_accuracy).toBeCloseTo(expected_avg_accuracy, 1);

    // Assert: 平均査定一貫性スコアの計算が正確であること
    const aggregate_consistency_score =
      result.consolidated_dataset.reduce(
        (sum, record) => sum + record.judgment_consistency_score,
        0
      ) / result.consolidated_dataset.length;
    const expected_avg_consistency = (88 + 85 + 90 + 82 + 87) / 5;
    expect(aggregate_consistency_score).toBeCloseTo(
      expected_avg_consistency,
      1
    );

    // Assert: 平均査定時間の計算が正確であること
    const average_assessment_time =
      result.consolidated_dataset.reduce(
        (sum, record) => sum + record.assessment_time_minutes,
        0
      ) / result.consolidated_dataset.length;
    const expected_avg_time = (18 + 22 + 16 + 25 + 19) / 5;
    expect(average_assessment_time).toBeCloseTo(expected_avg_time, 1);

    // Assert: 出力形式がシステム要件に準拠していること
    expect(result.validation_timestamp).toBeDefined();
    expect(typeof result.validation_timestamp).toBe("string");
    expect(result.validated_records_count).toBe(5);
    expect(result.failed_records_count).toBe(0);

    // Assert: 検証期間が正しく記録されていること
    expect(result.validation_period).toBe("2024-01");

    // Assert: 業務ルール適合状況がすべて合格であること
    expect(result.business_rule_compliance).toBeDefined();
    expect(result.business_rule_compliance.assessment_count_compliance).toBe(
      true
    );
    expect(
      result.business_rule_compliance.average_amount_compliance
    ).toBe(true);
    expect(result.business_rule_compliance.assessment_time_compliance).toBe(
      true
    );
    expect(result.business_rule_compliance.accuracy_compliance).toBe(true);
    expect(result.business_rule_compliance.consistency_compliance).toBe(true);

    // Assert: 統合データセットの工種別集計が正確であること
    const construction_type_breakdown = result.consolidated_dataset.reduce(
      (acc: { [key: string]: number }, record) => {
        acc[record.construction_type] =
          (acc[record.construction_type] || 0) + record.assessment_count;
        return acc;
      },
      {}
    );
    expect(construction_type_breakdown["建築"]).toBe(45 + 38 + 48); // 131
    expect(construction_type_breakdown["土木"]).toBe(52); // 52
    expect(construction_type_breakdown["設備"]).toBe(61); // 61

    // Assert: 統合データセットの金額帯別集計が正確であること
    const amount_range_breakdown = result.consolidated_dataset.reduce(
      (acc: { [key: string]: number }, record) => {
        acc[record.amount_range] =
          (acc[record.amount_range] || 0) + record.assessment_count;
        return acc;
      },
      {}
    );
    expect(amount_range_breakdown["1000万-2000万"]).toBe(45 + 48); // 93
    expect(amount_range_breakdown["1500万-2500万"]).toBe(52 + 61); // 113
    expect(amount_range_breakdown["500万-1500万"]).toBe(38); // 38

    // Assert: 統合データセットの地域別集計が正確であること
    const region_breakdown = result.consolidated_dataset.reduce(
      (acc: { [key: string]: number }, record) => {
        acc[record.region] = (acc[record.region] || 0) + record.assessment_count;
        return acc;
      },
      {}
    );
    expect(region_breakdown["東京"]).toBe(45 + 48); // 93
    expect(region_breakdown["大阪"]).toBe(52); // 52
    expect(region_breakdown["名古屋"]).toBe(38); // 38
    expect(region_breakdown["福岡"]).toBe(61); // 61
  });
});