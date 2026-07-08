import { calculateCorrelationCoefficient } from "../../src/logic/it-6-2-2-1";

describe("学習データ更新履歴との相関分析機能", () => {
  // SCEN-1197
  test("複数の学習データ変更イベントが同時期に存在する場合に相関係数が正しく計算される", () => {
    // ===== Pattern 1: 基本的な相関分析 =====
    // 複数の学習データ変更イベント（最低3件以上）を同じ日時または1日以内の期間に登録
    const learningDataEvents1 = [
      {
        eventId: "evt_001",
        eventDate: new Date("2024-01-15T09:00:00Z"),
        ocr_accuracy_before: 85.2,
        ocr_accuracy_after: 87.5,
        ai_judgment_accuracy_before: 78.3,
        ai_judgment_accuracy_after: 81.4,
      },
      {
        eventId: "evt_002",
        eventDate: new Date("2024-01-15T14:30:00Z"),
        ocr_accuracy_before: 87.5,
        ocr_accuracy_after: 89.1,
        ai_judgment_accuracy_before: 81.4,
        ai_judgment_accuracy_after: 83.6,
      },
      {
        eventId: "evt_003",
        eventDate: new Date("2024-01-16T10:15:00Z"),
        ocr_accuracy_before: 89.1,
        ocr_accuracy_after: 91.2,
        ai_judgment_accuracy_before: 83.6,
        ai_judgment_accuracy_after: 85.8,
      },
    ];

    // 相関分析機能を実行
    const result1 = calculateCorrelationCoefficient(learningDataEvents1);

    // 相関係数が-1.0〜1.0の範囲内であることを検証
    expect(result1.correlationCoefficient).toBeGreaterThanOrEqual(-1.0);
    expect(result1.correlationCoefficient).toBeLessThanOrEqual(1.0);

    // 手動計算した相関係数との値を比較検証
    // OCR精度の改善度: [2.3, 1.6, 2.1]
    // AI判定精度の改善度: [3.1, 2.2, 2.2]
    // 相関係数の手動計算:
    // 平均: ocr_improvements = 2.0, ai_improvements = 2.5
    // 偏差積の合計 = (2.3-2.0)*(3.1-2.5) + (1.6-2.0)*(2.2-2.5) + (2.1-2.0)*(2.2-2.5)
    //              = 0.3*0.6 + (-0.4)*(-0.3) + 0.1*(-0.3)
    //              = 0.18 + 0.12 - 0.03 = 0.27
    // 標準偏差_ocr = sqrt(((2.3-2.0)^2 + (1.6-2.0)^2 + (2.1-2.0)^2)/3)
    //              = sqrt((0.09 + 0.16 + 0.01)/3) = sqrt(0.26/3) ≈ 0.2945
    // 標準偏差_ai = sqrt(((3.1-2.5)^2 + (2.2-2.5)^2 + (2.2-2.5)^2)/3)
    //             = sqrt((0.36 + 0.09 + 0.09)/3) = sqrt(0.54/3) ≈ 0.4243
    // 相関係数 = 0.27 / (0.2945 * 0.4243) ≈ 0.2159
    expect(result1.correlationCoefficient).toBeCloseTo(0.2159, 3);

    // ===== Pattern 2: 強い正の相関パターン =====
    const learningDataEvents2 = [
      {
        eventId: "evt_010",
        eventDate: new Date("2024-01-20T08:00:00Z"),
        ocr_accuracy_before: 80.0,
        ocr_accuracy_after: 82.0,
        ai_judgment_accuracy_before: 75.0,
        ai_judgment_accuracy_after: 77.0,
      },
      {
        eventId: "evt_011",
        eventDate: new Date("2024-01-20T12:00:00Z"),
        ocr_accuracy_before: 82.0,
        ocr_accuracy_after: 84.0,
        ai_judgment_accuracy_before: 77.0,
        ai_judgment_accuracy_after: 79.0,
      },
      {
        eventId: "evt_012",
        eventDate: new Date("2024-01-20T16:00:00Z"),
        ocr_accuracy_before: 84.0,
        ocr_accuracy_after: 86.0,
        ai_judgment_accuracy_before: 79.0,
        ai_judgment_accuracy_after: 81.0,
      },
    ];

    const result2 = calculateCorrelationCoefficient(learningDataEvents2);

    // 完全な正の相関（改善度がすべて同じ）
    // OCR改善度: [2.0, 2.0, 2.0], AI改善度: [2.0, 2.0, 2.0]
    // 相関係数 = 1.0
    expect(result2.correlationCoefficient).toBeCloseTo(1.0, 3);

    // ===== Pattern 3: 負の相関パターン =====
    const learningDataEvents3 = [
      {
        eventId: "evt_020",
        eventDate: new Date("2024-01-25T09:00:00Z"),
        ocr_accuracy_before: 90.0,
        ocr_accuracy_after: 91.0,
        ai_judgment_accuracy_before: 85.0,
        ai_judgment_accuracy_after: 83.0,
      },
      {
        eventId: "evt_021",
        eventDate: new Date("2024-01-25T13:00:00Z"),
        ocr_accuracy_before: 91.0,
        ocr_accuracy_after: 93.0,
        ai_judgment_accuracy_before: 83.0,
        ai_judgment_accuracy_after: 80.0,
      },
      {
        eventId: "evt_022",
        eventDate: new Date("2024-01-25T17:00:00Z"),
        ocr_accuracy_before: 93.0,
        ocr_accuracy_after: 94.0,
        ai_judgment_accuracy_before: 80.0,
        ai_judgment_accuracy_after: 78.0,
      },
    ];

    const result3 = calculateCorrelationCoefficient(learningDataEvents3);

    // OCR改善度: [1.0, 2.0, 1.0], AI改善度: [-2.0, -3.0, -2.0]
    // 完全な負の相関に近い
    // 平均: ocr = 1.333, ai = -2.333
    // 偏差積の合計 = (1-1.333)*(-2-(-2.333)) + (2-1.333)*(-3-(-2.333)) + (1-1.333)*(-2-(-2.333))
    //              = (-0.333)*(0.333) + (0.667)*(-0.667) + (-0.333)*(0.333)
    //              = -0.111 - 0.445 - 0.111 = -0.667
    // 標準偏差計算...
    expect(result3.correlationCoefficient).toBeLessThan(0.0);
    expect(result3.correlationCoefficient).toBeGreaterThanOrEqual(-1.0);

    // ===== Pattern 4: エッジケース - 4件以上の複数イベント =====
    const learningDataEvents4 = [
      {
        eventId: "evt_100",
        eventDate: new Date("2024-02-01T08:00:00Z"),
        ocr_accuracy_before: 85.0,
        ocr_accuracy_after: 86.5,
        ai_judgment_accuracy_before: 80.0,
        ai_judgment_accuracy_after: 81.5,
      },
      {
        eventId: "evt_101",
        eventDate: new Date("2024-02-01T12:00:00Z"),
        ocr_accuracy_before: 86.5,
        ocr_accuracy_after: 88.0,
        ai_judgment_accuracy_before: 81.5,
        ai_judgment_accuracy_after: 83.0,
      },
      {
        eventId: "evt_102",
        eventDate: new Date("2024-02-02T10:00:00Z"),
        ocr_accuracy_before: 88.0,
        ocr_accuracy_after: 89.2,
        ai_judgment_accuracy_before: 83.0,
        ai_judgment_accuracy_after: 84.3,
      },
      {
        eventId: "evt_103",
        eventDate: new Date("2024-02-02T14:00:00Z"),
        ocr_accuracy_before: 89.2,
        ocr_accuracy_after: 90.5,
        ai_judgment_accuracy_before: 84.3,
        ai_judgment_accuracy_after: 85.6,
      },
    ];

    const result4 = calculateCorrelationCoefficient(learningDataEvents4);

    // 相関係数が有効な範囲内
    expect(result4.correlationCoefficient).toBeGreaterThanOrEqual(-1.0);
    expect(result4.correlationCoefficient).toBeLessThanOrEqual(1.0);

    // ===== 結果メタデータの検証 =====
    expect(result1.eventCount).toBe(3);
    expect(result1.eventCount).toEqual(learningDataEvents1.length);

    expect(result2.eventCount).toBe(3);
    expect(result3.eventCount).toBe(3);
    expect(result4.eventCount).toBe(4);

    // タイムスタンプが記録されていることを確認
    expect(result1.analysisTimestamp).toBeDefined();
    expect(typeof result1.analysisTimestamp).toBe("string");

    // 分析対象期間が正しく計算されていることを確認
    expect(result1.analysisStartDate).toBeDefined();
    expect(result1.analysisEndDate).toBeDefined();
  });
});