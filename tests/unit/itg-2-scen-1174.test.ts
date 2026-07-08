import { diagnoseAccuracyDecline } from "../../src/logic/it-6-2-2-2";

describe("精度低下要因診断 - OCR精度またはAI判定精度の自動検知と診断フラグ", () => {
  // SCEN-1174
  test("OCR精度またはAI判定精度が設定された閾値を下回った場合、システムが自動的に精度低下を検知し、診断フラグが立てられること。診断フラグには精度低下の原因、発生時刻、影響を受けた査定項目などの詳細情報が正確に記録されること。", () => {
    // Precondition: OCR精度が95%、AI判定精度が90%の閾値が設定されている
    // Trigger: OCR精度またはAI判定精度が閾値を下回るシナリオが発生
    // Outcome: 診断フラグが立てられ、詳細情報が記録される

    // ========== OCR精度が閾値を下回るケース ==========
    const ocr_decline_result = diagnoseAccuracyDecline({
      metric_type: "OCR_ACCURACY",
      current_accuracy: 92.5,
      threshold_accuracy: 95.0,
      previous_accuracy: 95.8,
      diagnosis_timestamp: new Date("2024-01-15T10:30:00Z"),
      affected_items: ["金額項目", "数量項目"],
      sample_size: 200,
      decline_reason_candidates: ["学習データ不足", "見積書フォーマット変化"],
    });

    expect(ocr_decline_result.flag_raised).toBe(true);
    expect(ocr_decline_result.decline_detected).toBe(true);
    expect(ocr_decline_result.decline_severity).toBe("high");
    expect(ocr_decline_result.accuracy_decline_rate).toBe(-3.3);
    expect(ocr_decline_result.diagnosis_timestamp).toEqual(
      new Date("2024-01-15T10:30:00Z")
    );
    expect(ocr_decline_result.affected_items_count).toBe(2);
    expect(ocr_decline_result.affected_items).toEqual([
      "金額項目",
      "数量項目",
    ]);
    expect(ocr_decline_result.root_cause_diagnosis).toBeDefined();
    expect(ocr_decline_result.root_cause_diagnosis.length).toBeGreaterThan(0);

    // ========== AI判定精度が閾値を下回るケース ==========
    const ai_decline_result = diagnoseAccuracyDecline({
      metric_type: "AI_JUDGMENT_ACCURACY",
      current_accuracy: 87.3,
      threshold_accuracy: 90.0,
      previous_accuracy: 90.2,
      diagnosis_timestamp: new Date("2024-01-15T11:45:00Z"),
      affected_items: ["相場判定", "乖離パターン分類"],
      sample_size: 150,
      decline_reason_candidates: ["モデルドリフト", "季節変動未対応"],
    });

    expect(ai_decline_result.flag_raised).toBe(true);
    expect(ai_decline_result.decline_detected).toBe(true);
    expect(ai_decline_result.decline_severity).toBe("high");
    expect(ai_decline_result.accuracy_decline_rate).toBe(-2.9);
    expect(ai_decline_result.diagnosis_timestamp).toEqual(
      new Date("2024-01-15T11:45:00Z")
    );
    expect(ai_decline_result.affected_items_count).toBe(2);
    expect(ai_decline_result.affected_items).toEqual([
      "相場判定",
      "乖離パターン分類",
    ]);

    // ========== 診断フラグが立たないケース（精度が閾値以上） ==========
    const normal_result = diagnoseAccuracyDecline({
      metric_type: "OCR_ACCURACY",
      current_accuracy: 96.5,
      threshold_accuracy: 95.0,
      previous_accuracy: 96.2,
      diagnosis_timestamp: new Date("2024-01-15T12:00:00Z"),
      affected_items: [],
      sample_size: 180,
      decline_reason_candidates: [],
    });

    expect(normal_result.flag_raised).toBe(false);
    expect(normal_result.decline_detected).toBe(false);
    expect(normal_result.decline_severity).toBe("none");
    expect(normal_result.accuracy_decline_rate).toBe(-0.7);

    // ========== 詳細情報の完全性検証 ==========
    expect(ocr_decline_result).toHaveProperty("diagnosis_id");
    expect(ocr_decline_result).toHaveProperty("metric_type");
    expect(ocr_decline_result).toHaveProperty("current_accuracy");
    expect(ocr_decline_result).toHaveProperty("threshold_accuracy");
    expect(ocr_decline_result).toHaveProperty("previous_accuracy");
    expect(ocr_decline_result).toHaveProperty("accuracy_decline_rate");
    expect(ocr_decline_result).toHaveProperty("flag_raised");
    expect(ocr_decline_result).toHaveProperty("decline_detected");
    expect(ocr_decline_result).toHaveProperty("decline_severity");
    expect(ocr_decline_result).toHaveProperty("diagnosis_timestamp");
    expect(ocr_decline_result).toHaveProperty("affected_items");
    expect(ocr_decline_result).toHaveProperty("affected_items_count");
    expect(ocr_decline_result).toHaveProperty("sample_size");
    expect(ocr_decline_result).toHaveProperty("root_cause_diagnosis");
    expect(ocr_decline_result).toHaveProperty("remediation_action_required");

    // ========== 根本原因候補が正確に記録されているか検証 ==========
    expect(
      ocr_decline_result.root_cause_diagnosis.some(
        (cause: string) => cause === "学習データ不足"
      )
    ).toBe(true);
    expect(
      ocr_decline_result.root_cause_diagnosis.some(
        (cause: string) => cause === "見積書フォーマット変化"
      )
    ).toBe(true);

    // ========== 異常な閾値突破の大きさ検証 ==========
    const severe_decline_result = diagnoseAccuracyDecline({
      metric_type: "OCR_ACCURACY",
      current_accuracy: 80.0,
      threshold_accuracy: 95.0,
      previous_accuracy: 95.0,
      diagnosis_timestamp: new Date("2024-01-15T13:15:00Z"),
      affected_items: [
        "金額項目",
        "数量項目",
        "補正係数",
        "工事種別",
      ],
      sample_size: 500,
      decline_reason_candidates: ["システム障害", "データ品質急落"],
    });

    expect(severe_decline_result.flag_raised).toBe(true);
    expect(severe_decline_result.decline_detected).toBe(true);
    expect(severe_decline_result.decline_severity).toBe("critical");
    expect(severe_decline_result.accuracy_decline_rate).toBe(-15.0);
    expect(severe_decline_result.affected_items_count).toBe(4);
    expect(severe_decline_result.remediation_action_required).toBe(true);

    // ========== 境界値テスト：精度がちょうど閾値と同じケース ==========
    const boundary_result = diagnoseAccuracyDecline({
      metric_type: "AI_JUDGMENT_ACCURACY",
      current_accuracy: 90.0,
      threshold_accuracy: 90.0,
      previous_accuracy: 90.5,
      diagnosis_timestamp: new Date("2024-01-15T14:00:00Z"),
      affected_items: [],
      sample_size: 100,
      decline_reason_candidates: [],
    });

    expect(boundary_result.flag_raised).toBe(false);
    expect(boundary_result.decline_detected).toBe(false);

    // ========== エラーテスト：不正な入力値 ==========
    expect(() =>
      diagnoseAccuracyDecline({
        metric_type: "INVALID_METRIC",
        current_accuracy: 92.5,
        threshold_accuracy: 95.0,
        previous_accuracy: 95.8,
        diagnosis_timestamp: new Date("2024-01-15T10:30:00Z"),
        affected_items: [],
        sample_size: 200,
        decline_reason_candidates: [],
      })
    ).toThrow(/メトリクス/);

    expect(() =>
      diagnoseAccuracyDecline({
        metric_type: "OCR_ACCURACY",
        current_accuracy: -5.0,
        threshold_accuracy: 95.0,
        previous_accuracy: 95.8,
        diagnosis_timestamp: new Date("2024-01-15T10:30:00Z"),
        affected_items: [],
        sample_size: 200,
        decline_reason_candidates: [],
      })
    ).toThrow(/精度/);

    expect(() =>
      diagnoseAccuracyDecline({
        metric_type: "OCR_ACCURACY",
        current_accuracy: 92.5,
        threshold_accuracy: 95.0,
        previous_accuracy: 95.8,
        diagnosis_timestamp: new Date("2024-01-15T10:30:00Z"),
        affected_items: [],
        sample_size: 0,
        decline_reason_candidates: [],
      })
    ).toThrow(/サンプル数/);
  });
});