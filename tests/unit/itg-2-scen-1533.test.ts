import { determineDataUpdatePriority } from "../../src/logic/it-6-2-2-1";

describe("学習データ更新優先度・実施タイミング自動判定", () => {
  test("SCEN-1533: OCR精度低下率・AI判定精度低下率・フィードバック増加率から優先度と実施タイミングを正しく判定", () => {
    // ケース1: OCR精度低下率=5%, AI判定精度低下率=3%, フィードバック増加率=2%
    // 期待: 優先度='中', 実施タイミング='1週間以内'
    const result1 = determineDataUpdatePriority({
      ocr_accuracy_decline_rate: 5,
      ai_judgment_accuracy_decline_rate: 3,
      feedback_increase_rate: 2,
    });
    expect(result1.priority_level).toBe("中");
    expect(result1.recommended_timing).toBe("1週間以内");

    // ケース2: OCR精度低下率=15%に更新
    // 期待: 優先度='高', 実施タイミング='24時間以内'
    const result2 = determineDataUpdatePriority({
      ocr_accuracy_decline_rate: 15,
      ai_judgment_accuracy_decline_rate: 3,
      feedback_increase_rate: 2,
    });
    expect(result2.priority_level).toBe("高");
    expect(result2.recommended_timing).toBe("24時間以内");

    // ケース3: AI判定精度低下率=12%, フィードバック増加率=8%に更新
    // 期待: 優先度='緊急', 実施タイミング='即実施'
    const result3 = determineDataUpdatePriority({
      ocr_accuracy_decline_rate: 15,
      ai_judgment_accuracy_decline_rate: 12,
      feedback_increase_rate: 8,
    });
    expect(result3.priority_level).toBe("緊急");
    expect(result3.recommended_timing).toBe("即実施");

    // ケース4: すべての閾値が基準以下に戻す
    // 期待: 優先度='低', 実施タイミング='月1回以上'
    const result4 = determineDataUpdatePriority({
      ocr_accuracy_decline_rate: 1,
      ai_judgment_accuracy_decline_rate: 1,
      feedback_increase_rate: 0.5,
    });
    expect(result4.priority_level).toBe("低");
    expect(result4.recommended_timing).toBe("月1回以上");
  });
});