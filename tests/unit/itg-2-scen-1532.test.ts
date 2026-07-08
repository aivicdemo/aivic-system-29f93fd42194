import { aggregateAssessorMetrics } from "../../src/logic/it-6-2-1-1";

describe("査定担当者別・工種別・金額帯別の判定精度指標の自動集計と可視化", () => {
  // SCEN-1532: [edge] 初期運用データ自動集計・ダッシュボード可視化機能
  // 30名全員の査定員データが揃わない場合でも部分集計で処理を継続できる
  test("30名中25名のデータで部分集計を実行し、エラーなく処理継続でき、ダッシュボード可視化される", () => {
    // 入力: 30名中25名の査定員メトリクスデータ
    const assessor_data_25of30 = [
      {
        assessor_id: "A001",
        assessor_name: "査定員1",
        judgment_accuracy_rate: 95.2,
        deviation_rate: 2.1,
        average_assessment_time_minutes: 18.5,
        construction_type: "建築工事",
        amount_band: "1000万～5000万",
        processed_count: 12,
      },
      {
        assessor_id: "A002",
        assessor_name: "査定員2",
        judgment_accuracy_rate: 92.8,
        deviation_rate: 3.5,
        average_assessment_time_minutes: 22.3,
        construction_type: "土木工事",
        amount_band: "5000万～1億",
        processed_count: 8,
      },
      {
        assessor_id: "A003",
        assessor_name: "査定員3",
        judgment_accuracy_rate: 88.5,
        deviation_rate: 5.2,
        average_assessment_time_minutes: 25.1,
        construction_type: "建築工事",
        amount_band: "1000万以下",
        processed_count: 15,
      },
      {
        assessor_id: "A004",
        assessor_name: "査定員4",
        judgment_accuracy_rate: 94.1,
        deviation_rate: 2.8,
        average_assessment_time_minutes: 19.7,
        construction_type: "機械装置工事",
        amount_band: "1000万～5000万",
        processed_count: 10,
      },
      {
        assessor_id: "A005",
        assessor_name: "査定員5",
        judgment_accuracy_rate: 91.3,
        deviation_rate: 4.1,
        average_assessment_time_minutes: 23.5,
        construction_type: "建築工事",
        amount_band: "5000万～1億",
        processed_count: 9,
      },
      {
        assessor_id: "A006",
        assessor_name: "査定員6",
        judgment_accuracy_rate: 96.7,
        deviation_rate: 1.5,
        average_assessment_time_minutes: 17.2,
        construction_type: "土木工事",
        amount_band: "1000万～5000万",
        processed_count: 14,
      },
      {
        assessor_id: "A007",
        assessor_name: "査定員7",
        judgment_accuracy_rate: 89.9,
        deviation_rate: 5.8,
        average_assessment_time_minutes: 26.3,
        construction_type: "建築工事",
        amount_band: "1000万以下",
        processed_count: 11,
      },
      {
        assessor_id: "A008",
        assessor_name: "査定員8",
        judgment_accuracy_rate: 93.4,
        deviation_rate: 3.2,
        average_assessment_time_minutes: 20.8,
        construction_type: "機械装置工事",
        amount_band: "5000万～1億",
        processed_count: 7,
      },
      {
        assessor_id: "A009",
        assessor_name: "査定員9",
        judgment_accuracy_rate: 90.6,
        deviation_rate: 4.5,
        average_assessment_time_minutes: 24.1,
        construction_type: "土木工事",
        amount_band: "1000万以下",
        processed_count: 13,
      },
      {
        assessor_id: "A010",
        assessor_name: "査定員10",
        judgment_accuracy_rate: 94.8,
        deviation_rate: 2.3,
        average_assessment_time_minutes: 19.1,
        construction_type: "建築工事",
        amount_band: "1000万～5000万",
        processed_count: 16,
      },
      {
        assessor_id: "A011",
        assessor_name: "査定員11",
        judgment_accuracy_rate: 87.2,
        deviation_rate: 6.1,
        average_assessment_time_minutes: 27.5,
        construction_type: "機械装置工事",
        amount_band: "1000万以下",
        processed_count: 6,
      },
      {
        assessor_id: "A012",
        assessor_name: "査定員12",
        judgment_accuracy_rate: 92.1,
        deviation_rate: 3.8,
        average_assessment_time_minutes: 21.9,
        construction_type: "土木工事",
        amount_band: "5000万～1億",
        processed_count: 10,
      },
      {
        assessor_id: "A013",
        assessor_name: "査定員13",
        judgment_accuracy_rate: 95.5,
        deviation_rate: 2.0,
        average_assessment_time_minutes: 18.0,
        construction_type: "建築工事",
        amount_band: "1000万～5000万",
        processed_count: 13,
      },
      {
        assessor_id: "A014",
        assessor_name: "査定員14",
        judgment_accuracy_rate: 88.9,
        deviation_rate: 5.4,
        average_assessment_time_minutes: 25.8,
        construction_type: "土木工事",
        amount_band: "1000万以下",
        processed_count: 9,
      },
      {
        assessor_id: "A015",
        assessor_name: "査定員15",
        judgment_accuracy_rate: 93.7,
        deviation_rate: 3.0,
        average_assessment_time_minutes: 20.4,
        construction_type: "機械装置工事",
        amount_band: "5000万～1億",
        processed_count: 8,
      },
      {
        assessor_id: "A016",
        assessor_name: "査定員16",
        judgment_accuracy_rate: 91.8,
        deviation_rate: 4.0,
        average_assessment_time_minutes: 23.0,
        construction_type: "建築工事",
        amount_band: "1000万以下",
        processed_count: 12,
      },
      {
        assessor_id: "A017",
        assessor_name: "査定員17",
        judgment_accuracy_rate: 94.3,
        deviation_rate: 2.6,
        average_assessment_time_minutes: 19.4,
        construction_type: "土木工事",
        amount_band: "1000万～5000万",
        processed_count: 11,
      },
      {
        assessor_id: "A018",
        assessor_name: "査定員18",
        judgment_accuracy_rate: 89.5,
        deviation_rate: 5.5,
        average_assessment_time_minutes: 26.0,
        construction_type: "機械装置工事",
        amount_band: "1000万以下",
        processed_count: 7,
      },
      {
        assessor_id: "A019",
        assessor_name: "査定員19",
        judgment_accuracy_rate: 96.1,
        deviation_rate: 1.8,
        average_assessment_time_minutes: 17.6,
        construction_type: "建築工事",
        amount_band: "5000万～1億",
        processed_count: 14,
      },
      {
        assessor_id: "A020",
        assessor_name: "査定員20",
        judgment_accuracy_rate: 90.2,
        deviation_rate: 4.7,
        average_assessment_time_minutes: 24.5,
        construction_type: "土木工事",
        amount_band: "1000万～5000万",
        processed_count: 10,
      },
      {
        assessor_id: "A021",
        assessor_name: "査定員21",
        judgment_accuracy_rate: 93.0,
        deviation_rate: 3.4,
        average_assessment_time_minutes: 21.3,
        construction_type: "建築工事",
        amount_band: "1000万以下",
        processed_count: 8,
      },
      {
        assessor_id: "A022",
        assessor_name: "査定員22",
        judgment_accuracy_rate: 91.6,
        deviation_rate: 4.2,
        average_assessment_time_minutes: 23.7,
        construction_type: "機械装置工事",
        amount_band: "5000万～1億",
        processed_count: 9,
      },
      {
        assessor_id: "A023",
        assessor_name: "査定員23",
        judgment_accuracy_rate: 95.3,
        deviation_rate: 2.2,
        average_assessment_time_minutes: 18.4,
        construction_type: "土木工事",
        amount_band: "1000万～5000万",
        processed_count: 12,
      },
      {
        assessor_id: "A024",
        assessor_name: "査定員24",
        judgment_accuracy_rate: 88.7,
        deviation_rate: 5.6,
        average_assessment_time_minutes: 26.2,
        construction_type: "建築工事",
        amount_band: "1000万以下",
        processed_count: 10,
      },
      {
        assessor_id: "A025",
        assessor_name: "査定員25",
        judgment_accuracy_rate: 92.5,
        deviation_rate: 3.6,
        average_assessment_time_minutes: 22.1,
        construction_type: "土木工事",
        amount_band: "5000万～1億",
        processed_count: 11,
      },
    ];

    // 実行: aggregateAssessorMetrics を呼び出す
    const result = aggregateAssessorMetrics(assessor_data_25of30);

    // 検証1: エラーが発生せず、result は object であることを確認
    expect(result).toBeDefined();
    expect(typeof result).toBe("object");

    // 検証2: 処理完了状態が記録されていることを確認
    expect(result.total_processed_count).toBe(25);
    expect(result.total_expected_count).toBe(30);
    expect(result.completion_status).toBe("25/30");

    // 検証3: 部分集計データが正確に計算されていることを確認
    // 平均判定精度率の計算: (95.2 + 92.8 + 88.5 + 94.1 + 91.3 + 96.7 + 89.9 + 93.4 + 90.6 + 94.8 + 87.2 + 92.1 + 95.5 + 88.9 + 93.7 + 91.8 + 94.3 + 89.5 + 96.1 + 90.2 + 93.0 + 91.6 + 95.3 + 88.7 + 92.5) / 25
    const expected_avg_judgment_accuracy = 2305.8 / 25; // 92.232
    expect(result.average_judgment_accuracy_rate).toBeCloseTo(92.232, 2);

    // 平均乖離率の計算: (2.1 + 3.5 + 5.2 + 2.8 + 4.1 + 1.5 + 5.8 + 3.2 + 4.5 + 2.3 + 6.1 + 3.8 + 2.0 + 5.4 + 3.0 + 4.0 + 2.6 + 5.5 + 1.8 + 4.7 + 3.4 + 4.2 + 2.2 + 5.6 + 3.6) / 25
    const expected_avg_deviation_rate = 99.2 / 25; // 3.968
    expect(result.average_deviation_rate).toBeCloseTo(3.968, 2);

    // 平均査定時間の計算: (18.5 + 22.3 + 25.1 + 19.7 + 23.5 + 17.2 + 26.3 + 20.8 + 24.1 + 19.1 + 27.5 + 21.9 + 18.0 + 25.8 + 20.4 + 23.0 + 19.4 + 26.0 + 17.6 + 24.5 + 21.3 + 23.7 + 18.4 + 26.2 + 22.1) / 25
    const expected_avg_time = 559.9 / 25; // 22.396
    expect(result.average_assessment_time_minutes).toBeCloseTo(22.396, 2);

    // 処理件数合計の計算: 12 + 8 + 15 + 10 + 9 + 14 + 11 + 7 + 13 + 16 + 6 + 10 + 13 + 9 + 8 + 12 + 11 + 7 + 14 + 10 + 8 + 9 + 12 + 10 + 11
    const expected_total_processed_items = 270;
    expect(result.total_processed_items).toBe(270);

    // 検証4: 工種別集計データが含まれていることを確認
    expect(result.by_construction_type).toBeDefined();
    expect(Array.isArray(result.by_construction_type)).toBe(true);
    expect(result.by_construction_type.length).toBeGreaterThan(0);

    // 建築工事の集計確認 (A001, A003, A005, A007, A010, A013, A016, A019, A021, A024 = 10名)
    const construction_building = result.by_construction_type.find(
      (c: any) => c.construction_type === "建築工事"
    );
    expect(construction_building).toBeDefined();
    expect(construction_building.count).toBe(10);

    // 検証5: 金額帯別集計データが含まれていることを確認
    expect(result.by_amount_band).toBeDefined();
    expect(Array.isArray(result.by_amount_band)).toBe(true);
    expect(result.by_amount_band.length).toBeGreaterThan(0);

    // 「1000万～5000万」帯の集計確認 (A001, A004, A006, A010, A013, A017, A020, A023 = 8名)
    const amount_band_1b_5b = result.by_amount_band.find(
      (b: any) => b.amount_band === "1000万～5000万"
    );
    expect(amount_band_1b_5b).toBeDefined();
    expect(amount_band_1b_5b.count).toBe(8);

    // 検証6: 未集計データ（5名分）が空または「集計対象外」として記録されていることを確認
    expect(result.missing_assessors).toBeDefined();
    expect(Array.isArray(result.missing_assessors)).toBe(true);
    expect(result.missing_assessors.length).toBe(5);

    // 未集計査定員IDが A026～A030 であることを確認
    const missing_ids = result.missing_assessors.map((m: any) => m.assessor_id).sort();
    expect(missing_ids).toEqual(["A026", "A027", "A028", "A029", "A030"]);

    // 検証7: 警告メッセージが記録されていることを確認
    expect(result.warnings).toBeDefined();
    expect(Array.isArray(result.warnings)).toBe(true);
    expect(result.warnings.length).toBeGreaterThan(0);

    // 「未集計」に関する警告メッセージが含まれていることを確認
    const incomplete_warning = result.warnings.find((w: any) =>
      /未集計/.test(w)
    );
    expect(incomplete_warning).toBeDefined();

    // 検証8: エラーログではなく警告ログであることを確認
    expect(result.log_level).toBe("warning");
    expect(result.error_occurred).toBe(false);

    // 検証9: ダッシュボード表示用の構造化データが正しく生成されていることを確認
    expect(result.dashboard_data).toBeDefined();
    expect(result.dashboard_data.summary).toBeDefined();
    expect(result.dashboard_data.summary.completion_rate).toBe(83.33); // 25/30 * 100

    // 検証10: 各査定員データの可視化用データが正確であることを確認
    expect(result.dashboard_data.assessors).toBeDefined();
    expect(result.dashboard_data.assessors.length).toBe(25);

    // 最初の査定員データ（A001）の確認
    const first_assessor = result.dashboard_data.assessors[0];
    expect(first_assessor.assessor_id).toBe("A001");
    expect(first_assessor.assessor_name).toBe("査定員1");
    expect(first_assessor.judgment_accuracy_rate).toBe(95.2);
    expect(first_assessor.deviation_rate).toBe(2.1);
    expect(first_assessor.average_assessment_time_minutes).toBe(18.5);
    expect(first_assessor.processed_count).toBe(12);

    // 検証11: 部分集計の状態が表示されることを確認
    expect(result.dashboard_data.summary.processed_count).toBe(25);
    expect(result.dashboard_data.summary.expected_count).toBe(30);
    expect(result.dashboard_data.summary.status_label).toMatch(/25\/30/);
  });
});