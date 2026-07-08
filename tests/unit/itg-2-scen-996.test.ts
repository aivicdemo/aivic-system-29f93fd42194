import { aggregateAssessorAccuracyByDimension } from "../../src/logic/it-6-2-1-1";

describe("査定担当者別・工種別・金額帯別の判定精度指標の自動集計と可視化", () => {
  // SCEN-996: [edge] 最適参照候補データの優先度付け表示 - 参照候補が複数存在する場合、全候補が信頼度順で表示される（最大5件まで表示可能など）
  test("複数の参照候補データが信頼度スコア順に表示され、最大5件に制限される", () => {
    const referenceCandidate_1 = {
      candidate_id: "cand_001",
      reference_data_name: "案件2024-01東京",
      confidence_score: 95,
      category: "過去案件",
      unit_price: 5200,
      quantity: 100,
      total_amount: 520000,
      region: "東京",
      work_type: "鉄骨工事",
      period: "2024-01"
    };

    const referenceCandidate_2 = {
      candidate_id: "cand_002",
      reference_data_name: "案件2024-02東京",
      confidence_score: 88,
      category: "過去案件",
      unit_price: 5100,
      quantity: 100,
      total_amount: 510000,
      region: "東京",
      work_type: "鉄骨工事",
      period: "2024-02"
    };

    const referenceCandidate_3 = {
      candidate_id: "cand_003",
      reference_data_name: "物価本_2024Q1",
      confidence_score: 82,
      category: "物価本",
      unit_price: 5000,
      quantity: 100,
      total_amount: 500000,
      region: "東京",
      work_type: "鉄骨工事",
      period: "2024-Q1"
    };

    const referenceCandidate_4 = {
      candidate_id: "cand_004",
      reference_data_name: "案件2023-12東京",
      confidence_score: 75,
      category: "過去案件",
      unit_price: 4900,
      quantity: 100,
      total_amount: 490000,
      region: "東京",
      work_type: "鉄骨工事",
      period: "2023-12"
    };

    const referenceCandidate_5 = {
      candidate_id: "cand_005",
      reference_data_name: "案件2023-11東京",
      confidence_score: 68,
      category: "過去案件",
      unit_price: 4800,
      quantity: 100,
      total_amount: 480000,
      region: "東京",
      work_type: "鉄骨工事",
      period: "2023-11"
    };

    const referenceCandidate_6 = {
      candidate_id: "cand_006",
      reference_data_name: "案件2023-10東京",
      confidence_score: 62,
      category: "過去案件",
      unit_price: 4700,
      quantity: 100,
      total_amount: 470000,
      region: "東京",
      work_type: "鉄骨工事",
      period: "2023-10"
    };

    const assessmentData = {
      assessment_id: "asm_996_001",
      assessor_id: "assessor_A1",
      work_type: "鉄骨工事",
      amount_range: "500万円以上1000万円未満",
      reference_candidates: [
        referenceCandidate_1,
        referenceCandidate_2,
        referenceCandidate_3,
        referenceCandidate_4,
        referenceCandidate_5,
        referenceCandidate_6
      ],
      assessment_count: 12,
      accuracy_rate: 0.92,
      deviation_rate: 0.08,
      processing_time_minutes: 8.5
    };

    const result = aggregateAssessorAccuracyByDimension(assessmentData);

    // 表示される候補の件数が5件に制限されていることを検証
    expect(result.displayed_candidates.length).toBe(5);

    // 信頼度スコアが高い順に並んでいることを検証
    expect(result.displayed_candidates[0].candidate_id).toBe("cand_001");
    expect(result.displayed_candidates[0].confidence_score).toBe(95);
    expect(result.displayed_candidates[0].reference_data_name).toBe("案件2024-01東京");
    expect(result.displayed_candidates[0].category).toBe("過去案件");

    expect(result.displayed_candidates[1].candidate_id).toBe("cand_002");
    expect(result.displayed_candidates[1].confidence_score).toBe(88);
    expect(result.displayed_candidates[1].reference_data_name).toBe("案件2024-02東京");

    expect(result.displayed_candidates[2].candidate_id).toBe("cand_003");
    expect(result.displayed_candidates[2].confidence_score).toBe(82);
    expect(result.displayed_candidates[2].reference_data_name).toBe("物価本_2024Q1");
    expect(result.displayed_candidates[2].category).toBe("物価本");

    expect(result.displayed_candidates[3].candidate_id).toBe("cand_004");
    expect(result.displayed_candidates[3].confidence_score).toBe(75);
    expect(result.displayed_candidates[3].reference_data_name).toBe("案件2023-12東京");

    expect(result.displayed_candidates[4].candidate_id).toBe("cand_005");
    expect(result.displayed_candidates[4].confidence_score).toBe(68);
    expect(result.displayed_candidates[4].reference_data_name).toBe("案件2023-11東京");

    // 6件目の候補（confidence_score: 62）が表示されないことを検証
    const candidate_6_exists = result.displayed_candidates.some(
      (c) => c.candidate_id === "cand_006"
    );
    expect(candidate_6_exists).toBe(false);

    // 各候補の詳細情報が正確に表示されていることを確認
    expect(result.displayed_candidates[0].unit_price).toBe(5200);
    expect(result.displayed_candidates[0].quantity).toBe(100);
    expect(result.displayed_candidates[0].total_amount).toBe(520000);
    expect(result.displayed_candidates[0].region).toBe("東京");
    expect(result.displayed_candidates[0].work_type).toBe("鉄骨工事");
    expect(result.displayed_candidates[0].period).toBe("2024-01");

    // 集計結果の整合性検証
    expect(result.assessment_id).toBe("asm_996_001");
    expect(result.assessor_id).toBe("assessor_A1");
    expect(result.work_type).toBe("鉄骨工事");
    expect(result.amount_range).toBe("500万円以上1000万円未満");
    expect(result.total_reference_candidates).toBe(6);
    expect(result.assessment_count).toBe(12);
    expect(result.accuracy_rate).toBe(0.92);
    expect(result.deviation_rate).toBe(0.08);
    expect(result.processing_time_minutes).toBe(8.5);

    // 候補データが信頼度スコアの高い順に配列されていることを再検証
    for (let i = 0; i < result.displayed_candidates.length - 1; i++) {
      expect(result.displayed_candidates[i].confidence_score).toBeGreaterThanOrEqual(
        result.displayed_candidates[i + 1].confidence_score
      );
    }

    // 最大表示件数が5件に制限されていることを確認
    expect(result.max_display_count).toBe(5);
    expect(result.has_more_candidates).toBe(true);
  });
});