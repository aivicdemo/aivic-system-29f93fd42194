import { estimateAdditionalLearningDataRequired } from '../../src/logic/it-1-br-6-2-1';

describe('他部署適用時の追加学習データ量見積機能', () => {
  test('SCEN-1377: OCR読取精度低下度10%、相場判定精度低下度5%の場合、必要学習データ件数が正しく算出される', () => {
    // ===== 前提条件 =====
    // 現在のOCR読取精度（ベースライン）: 85%
    const baseline_ocr_accuracy = 85;
    // 現在の相場判定精度（ベースライン）: 90%
    const baseline_judgment_accuracy = 90;
    // 他部署適用時のOCR読取精度低下度: 10%
    const ocr_accuracy_drop_rate = 10;
    // 他部署適用時の相場判定精度低下度: 5%
    const judgment_accuracy_drop_rate = 5;
    // 現在の学習データ件数: 500件
    const current_learning_data_count = 500;

    // ===== シミュレーション入力 =====
    const input = {
      baseline_ocr_accuracy: baseline_ocr_accuracy,
      baseline_judgment_accuracy: baseline_judgment_accuracy,
      ocr_accuracy_drop_rate: ocr_accuracy_drop_rate,
      judgment_accuracy_drop_rate: judgment_accuracy_drop_rate,
      current_learning_data_count: current_learning_data_count,
    };

    // ===== 期待値計算 =====
    // ロジック: 精度低下度に基づいて必要学習データ件数を算出
    // 公式:
    //   OCR精度低下による追加データ = 現在の学習データ件数 × (OCR低下度 / 100) × 係数 (1.5)
    //   判定精度低下による追加データ = 現在の学習データ件数 × (判定低下度 / 100) × 係数 (1.2)
    //   必要追加データ件数 = OCR追加データ + 判定追加データ
    const ocr_additional_data = Math.ceil(current_learning_data_count * (ocr_accuracy_drop_rate / 100) * 1.5);
    const judgment_additional_data = Math.ceil(current_learning_data_count * (judgment_accuracy_drop_rate / 100) * 1.2);
    const expected_additional_data_required = ocr_additional_data + judgment_additional_data;

    // 実測値の計算例:
    // OCR追加データ = ceil(500 × 0.10 × 1.5) = ceil(75) = 75
    // 判定追加データ = ceil(500 × 0.05 × 1.2) = ceil(30) = 30
    // 合計 = 75 + 30 = 105
    const expected_ocr_additional = 75;
    const expected_judgment_additional = 30;
    const expected_total_additional = 105;

    // ===== 実行 =====
    const result = estimateAdditionalLearningDataRequired(input);

    // ===== 検証 =====
    // 1. 返り値が構造化されたオブジェクトであること
    expect(result).toBeDefined();
    expect(typeof result).toBe('object');

    // 2. OCR精度低下による追加データ件数が正しく計算されていること
    expect(result.ocr_additional_data_required).toBe(expected_ocr_additional);

    // 3. 相場判定精度低下による追加データ件数が正しく計算されていること
    expect(result.judgment_additional_data_required).toBe(expected_judgment_additional);

    // 4. 必要追加学習データ総件数が正しく計算されていること
    expect(result.total_additional_data_required).toBe(expected_total_additional);

    // 5. 追加学習期間（営業日ベース、1日50件処理と仮定）が正しく計算されていること
    // 計算式: ceil(必要追加データ件数 / 50)
    const expected_additional_learning_days = Math.ceil(expected_total_additional / 50);
    expect(result.estimated_learning_days).toBe(expected_additional_learning_days);

    // 6. 推定コスト（営業日 × 時給 @2500円/日 × 8時間）が正しく計算されていること
    // 計算式: 推定学習日数 × 2500
    const expected_estimated_cost = expected_additional_learning_days * 2500;
    expect(result.estimated_cost_jpy).toBe(expected_estimated_cost);

    // 7. 実現可能性判定が正しくされていること
    // ロジック: 追加データ件数が150件以上の場合は「条件付き可能（要2週間以上）」、
    //          200件以上の場合は「困難」と判定
    const expected_feasibility_status = 'feasible'; // 105件なので可能
    expect(result.feasibility_status).toBe(expected_feasibility_status);

    // 8. カスタマイズ必要性が true であること（精度低下あるため）
    expect(result.customization_required).toBe(true);

    // 9. 推奨アクション（改善提案）が文字列配列であること
    expect(Array.isArray(result.recommended_actions)).toBe(true);
    expect(result.recommended_actions.length).toBeGreaterThan(0);

    // 10. 推奨アクションに「学習データ追加」が含まれていること
    expect(result.recommended_actions).toEqual(
      expect.arrayContaining([
        expect.stringMatching(/学習データ追加/),
      ])
    );

    // 11. 精度低下の詳細情報が記録されていること
    expect(result.accuracy_analysis).toBeDefined();
    expect(result.accuracy_analysis.ocr_accuracy_drop_rate).toBe(ocr_accuracy_drop_rate);
    expect(result.accuracy_analysis.judgment_accuracy_drop_rate).toBe(judgment_accuracy_drop_rate);
  });
});