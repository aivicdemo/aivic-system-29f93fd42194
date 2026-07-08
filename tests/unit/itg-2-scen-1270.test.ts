import { verifyImproveEffectMetrics } from "../../src/logic/it-6-2-1-1";

describe("改善対策効果検証機能 - 指標比較可能性検証", () => {
  test("SCEN-1270: 改善前後の指標が比較不可能な場合、検証処理がエラーとなる", () => {
    // 改善前の指標：件数（単位：件）
    const before_metric = {
      metric_id: "M001",
      metric_name: "査定処理件数",
      value: 150,
      unit: "件",
      measurement_date: "2024-01-15T09:00:00Z",
    };

    // 改善後の指標：金額（単位：円）- 異なる単位
    const after_metric = {
      metric_id: "M002",
      metric_name: "査定処理金額",
      value: 5000000,
      unit: "円",
      measurement_date: "2024-02-15T09:00:00Z",
    };

    // 異なる単位の指標を比較しようとした場合、エラーが発生すること
    expect(() =>
      verifyImproveEffectMetrics(before_metric, after_metric)
    ).toThrow(/比較可能/);
  });

  test("SCEN-1270: 改善前後の指標がデータ型互換性がない場合、検証処理がエラーとなる", () => {
    // 改善前の指標：数値型
    const before_metric = {
      metric_id: "M001",
      metric_name: "OCR読取精度",
      value: 85.5,
      unit: "%",
      measurement_date: "2024-01-15T09:00:00Z",
    };

    // 改善後の指標：文字列型 - データ型互換性がない
    const after_metric = {
      metric_id: "M001",
      metric_name: "OCR読取精度",
      value: "高精度",
      unit: "%",
      measurement_date: "2024-02-15T09:00:00Z",
    };

    // 互換性のないデータ型の指標を比較しようとした場合、エラーが発生すること
    expect(() =>
      verifyImproveEffectMetrics(before_metric, after_metric)
    ).toThrow(/比較可能/);
  });

  test("SCEN-1270: 改善前後の指標が同一単位・同一データ型の場合、検証処理が成功する", () => {
    // 改善前の指標：OCR精度（単位：%）
    const before_metric = {
      metric_id: "M001",
      metric_name: "OCR読取精度",
      value: 82.0,
      unit: "%",
      measurement_date: "2024-01-15T09:00:00Z",
    };

    // 改善後の指標：OCR精度（単位：%）- 同一単位
    const after_metric = {
      metric_id: "M001",
      metric_name: "OCR読取精度",
      value: 88.5,
      unit: "%",
      measurement_date: "2024-02-15T09:00:00Z",
    };

    // 同一単位・同一データ型の指標を比較する場合、成功する
    const result = verifyImproveEffectMetrics(before_metric, after_metric);

    // 改善度が正確に計算されること：（88.5 - 82.0）/ 82.0 * 100 ≈ 7.93%
    expect(result.is_comparable).toBe(true);
    expect(result.improvement_rate).toBeCloseTo(7.93, 1);
    expect(result.improvement_status).toBe("improved");
  });

  test("SCEN-1270: 改善前後の指標の種類が異なる場合、検証処理がエラーとなる", () => {
    // 改善前の指標：査定員別生産性（件/日）
    const before_metric = {
      metric_id: "M001",
      metric_name: "査定員生産性",
      metric_type: "productivity",
      value: 25,
      unit: "件/日",
      measurement_date: "2024-01-15T09:00:00Z",
    };

    // 改善後の指標：判定精度（%）- 異なる種類
    const after_metric = {
      metric_id: "M002",
      metric_name: "判定精度",
      metric_type: "accuracy",
      value: 92.5,
      unit: "%",
      measurement_date: "2024-02-15T09:00:00Z",
    };

    // 異なる種類の指標を比較しようとした場合、エラーが発生すること
    expect(() =>
      verifyImproveEffectMetrics(before_metric, after_metric)
    ).toThrow(/比較可能/);
  });

  test("SCEN-1270: 改善前後で同一指標だが単位が異なる場合、検証処理がエラーとなる", () => {
    // 改善前の指標：処理時間（単位：分）
    const before_metric = {
      metric_id: "M003",
      metric_name: "平均査定処理時間",
      value: 45,
      unit: "分",
      measurement_date: "2024-01-15T09:00:00Z",
    };

    // 改善後の指標：処理時間（単位：秒）- 単位が異なる
    const after_metric = {
      metric_id: "M003",
      metric_name: "平均査定処理時間",
      value: 1800,
      unit: "秒",
      measurement_date: "2024-02-15T09:00:00Z",
    };

    // 同一指標だが単位が異なる場合、エラーが発生すること
    expect(() =>
      verifyImproveEffectMetrics(before_metric, after_metric)
    ).toThrow(/比較可能/);
  });

  test("SCEN-1270: 改善前後で同一指標かつ同一単位の場合、改善度が正確に計算される", () => {
    // 改善前の指標：AI判定精度（単位：%）
    const before_metric = {
      metric_id: "M004",
      metric_name: "AI判定精度",
      value: 79.0,
      unit: "%",
      measurement_date: "2024-01-20T09:00:00Z",
    };

    // 改善後の指標：AI判定精度（単位：%）- 同一単位
    const after_metric = {
      metric_id: "M004",
      metric_name: "AI判定精度",
      value: 91.5,
      unit: "%",
      measurement_date: "2024-02-20T09:00:00Z",
    };

    // 同一指標・同一単位の比較が成功し、改善度が正確に計算されること
    const result = verifyImproveEffectMetrics(before_metric, after_metric);

    expect(result.is_comparable).toBe(true);
    // 改善度：（91.5 - 79.0）/ 79.0 * 100 ≈ 15.82%
    expect(result.improvement_rate).toBeCloseTo(15.82, 1);
    expect(result.improvement_status).toBe("improved");
    expect(result.before_value).toBe(79.0);
    expect(result.after_value).toBe(91.5);
  });
});