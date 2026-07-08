import { aggregateAssessmentPrecisionByRoleWorkTypeAmountBand } from "../../src/logic/it-6-2-1-1";

describe("査定担当者別・工種別・金額帯別の判定精度指標の自動集計と可視化", () => {
  test("SCEN-1549: 運用マニュアルの査定部署長レビュー評価 - OCR精度基準セクションについて、査定業務の実務要件との適合性が正しく評価される", () => {
    // Setup: OCR精度基準セクションのレビュー入力データ
    const review_input = {
      manual_section_id: "OCR_PRECISION_CRITERIA_001",
      section_name: "OCR精度基準",
      reviewer_role: "部署長",
      reviewer_id: "USR_20240115_DeptHead001",
      review_date_time: new Date("2024-01-15T10:30:00Z"),
      evaluation_items: [
        {
          item_id: "EVAL_ITEM_001",
          item_name: "基準値の妥当性",
          item_description: "設定されたOCR精度基準値（90%）が実務要件と合致しているか",
          evaluation_result: "適合",
          comment: "金額・数量項目の読取精度90%は、査定業務の実務要件に適合している",
        },
        {
          item_id: "EVAL_ITEM_002",
          item_name: "運用上の制約条件",
          item_description:
            "OCR精度基準の運用における制約（見積書フォーマット差異対応、季節変動など）が明記されているか",
          evaluation_result: "条件付き適合",
          comment:
            "フォーマット差異対応は記載されているが、地域別精度補正係数の記載が不足している",
        },
        {
          item_id: "EVAL_ITEM_003",
          item_name: "精度目標値",
          item_description:
            "3ヶ月での精度改善目標値（88%→93%）が査定業務の処理能力向上と連動しているか",
          evaluation_result: "適合",
          comment:
            "月次5%の段階的改善計画は、査定員の処理時間短縮目標と整合している",
        },
      ],
      overall_conformity: "条件付き適合",
      overall_comment:
        "基準値と精度目標は妥当。地域別・工種別の補正係数を追記することで完全適合可能",
      approval_status: "待機",
    };

    // 実行: レビュー評価の集計・記録
    const evaluation_result = aggregateAssessmentPrecisionByRoleWorkTypeAmountBand(
      review_input
    );

    // 検証: 評価結果が正しく記録されたこと
    expect(evaluation_result.manual_section_id).toBe("OCR_PRECISION_CRITERIA_001");
    expect(evaluation_result.section_name).toBe("OCR精度基準");
    expect(evaluation_result.reviewer_role).toBe("部署長");
    expect(evaluation_result.reviewer_id).toBe("USR_20240115_DeptHead001");
    expect(evaluation_result.review_date_time).toEqual(
      new Date("2024-01-15T10:30:00Z")
    );

    // 検証: 個別評価項目の記録
    expect(evaluation_result.evaluation_items).toHaveLength(3);
    expect(evaluation_result.evaluation_items[0].item_id).toBe("EVAL_ITEM_001");
    expect(evaluation_result.evaluation_items[0].item_name).toBe("基準値の妥当性");
    expect(evaluation_result.evaluation_items[0].evaluation_result).toBe("適合");
    expect(evaluation_result.evaluation_items[0].comment).toContain(
      "査定業務の実務要件に適合"
    );

    expect(evaluation_result.evaluation_items[1].item_id).toBe("EVAL_ITEM_002");
    expect(evaluation_result.evaluation_items[1].item_name).toBe(
      "運用上の制約条件"
    );
    expect(evaluation_result.evaluation_items[1].evaluation_result).toBe(
      "条件付き適合"
    );
    expect(evaluation_result.evaluation_items[1].comment).toContain(
      "地域別精度補正係数の記載が不足"
    );

    expect(evaluation_result.evaluation_items[2].item_id).toBe("EVAL_ITEM_003");
    expect(evaluation_result.evaluation_items[2].item_name).toBe("精度目標値");
    expect(evaluation_result.evaluation_items[2].evaluation_result).toBe("適合");
    expect(evaluation_result.evaluation_items[2].comment).toContain("整合している");

    // 検証: 総合評価結果
    expect(evaluation_result.overall_conformity).toBe("条件付き適合");
    expect(evaluation_result.overall_comment).toContain("地域別・工種別の補正係数を追記");

    // 検証: 承認ステータス（レビュー待機）
    expect(evaluation_result.approval_status).toBe("待機");

    // 検証: 評価項目の適合性スコア計算（適合=1.0, 条件付き=0.67, 非適合=0）
    const conformity_scores = evaluation_result.evaluation_items.map(
      (item: { evaluation_result: string }) => {
        if (item.evaluation_result === "適合") return 1.0;
        if (item.evaluation_result === "条件付き適合") return 0.67;
        if (item.evaluation_result === "非適合") return 0;
        return 0;
      }
    );
    const average_conformity_score =
      conformity_scores.reduce((a: number, b: number) => a + b, 0) /
      conformity_scores.length;
    expect(Math.round(average_conformity_score * 100) / 100).toBe(0.89);

    // 検証: 評価履歴に記録されていること
    expect(evaluation_result.review_history).toBeDefined();
    expect(evaluation_result.review_history.reviewer_id).toBe(
      "USR_20240115_DeptHead001"
    );
    expect(evaluation_result.review_history.reviewer_role).toBe("部署長");
    expect(evaluation_result.review_history.review_timestamp).toEqual(
      new Date("2024-01-15T10:30:00Z")
    );
    expect(evaluation_result.review_history.conformity_decision).toBe(
      "条件付き適合"
    );
    expect(evaluation_result.review_history.review_comments).toContain(
      "地域別・工種別の補正係数を追記することで完全適合可能"
    );

    // 検証: 複数の査定員役割（新人・経験者）の精度指標が集計される場合
    const role_based_precision = evaluation_result.assessor_role_precision_stats;
    expect(role_based_precision).toBeDefined();
    expect(Array.isArray(role_based_precision)).toBe(true);

    // 検証: 工種別の精度指標が集計される場合
    const work_type_precision = evaluation_result.work_type_precision_stats;
    expect(work_type_precision).toBeDefined();
    expect(Array.isArray(work_type_precision)).toBe(true);

    // 検証: 金額帯別の精度指標が集計される場合
    const amount_band_precision = evaluation_result.amount_band_precision_stats;
    expect(amount_band_precision).toBeDefined();
    expect(Array.isArray(amount_band_precision)).toBe(true);

    // 検証: レビュー結果のシステム記録のタイムスタンプ精度
    expect(
      evaluation_result.review_history.review_timestamp.getFullYear()
    ).toBe(2024);
    expect(
      evaluation_result.review_history.review_timestamp.getMonth()
    ).toBe(0);
    expect(evaluation_result.review_history.review_timestamp.getDate()).toBe(15);
  });
});