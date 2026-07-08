import { measureOcrAccuracyDifference } from '../../src/logic/it-6-2-2-2';

describe('他部署フォーマットOCR読取精度測定機能', () => {
  // SCEN-1360
  test('他部署フォーマット見積書のOCR読取精度が査定部署モデルとの精度差を定量化して出力される', () => {
    // Arrange: 査定部署モデルと他部署モデルの読取結果を用意
    const headquarters_model_result = {
      document_id: 'DOC-2024-001',
      format_type: 'standard_headquarters',
      ocr_accuracy_score: 94.5,
      total_items: 20,
      correctly_recognized_items: 19,
      extraction_timestamp: '2024-01-15T10:30:00Z',
    };

    const other_division_model_result = {
      document_id: 'DOC-2024-001',
      format_type: 'other_division_custom',
      ocr_accuracy_score: 87.3,
      total_items: 20,
      correctly_recognized_items: 17.46,
      extraction_timestamp: '2024-01-15T10:31:00Z',
    };

    // Act: 精度差測定関数を実行
    const accuracy_difference = measureOcrAccuracyDifference(
      headquarters_model_result,
      other_division_model_result
    );

    // Assert: 精度差が正確に計算され、出力される
    // 期待値計算: 94.5 - 87.3 = 7.2 (パーセンテージポイント)
    expect(accuracy_difference.accuracy_difference_percentage).toBe(7.2);
    
    // 査정부署 모델이 더 높은 정확도를 가지고 있음을 확인
    expect(accuracy_difference.higher_accuracy_model).toBe('headquarters');
    
    // 정확도 차이가 양수임을 확인 (본사 모델이 더 정확함)
    expect(accuracy_difference.accuracy_difference_percentage).toBeGreaterThan(0);
    
    // 출력된 정확도 점수가 각각 일치함을 확인
    expect(accuracy_difference.headquarters_accuracy_score).toBe(94.5);
    expect(accuracy_difference.other_division_accuracy_score).toBe(87.3);

    // 정확도 차이 수준을 확인
    expect(accuracy_difference.accuracy_level).toBe('acceptable_difference');

    // 모델 비교 결과가 명확하게 식별 가능한지 확인
    expect(accuracy_difference.model_comparison_result).toEqual({
      headquarters_recognized_count: 19,
      other_division_recognized_count: 17.46,
      difference_in_recognized_items: 1.54,
    });

    // 측정 타임스탬프가 기록되었는지 확인
    expect(accuracy_difference.measurement_timestamp).toBeDefined();
    expect(typeof accuracy_difference.measurement_timestamp).toBe('string');

    // 문서 ID가 일치함을 확인
    expect(accuracy_difference.document_id).toBe('DOC-2024-001');
  });

  test('他部署モデルが査定部署モデルより高精度の場合、負の精度差で表示される', () => {
    // Arrange: 他部署モデルが高精度なケース
    const headquarters_model_result = {
      document_id: 'DOC-2024-002',
      format_type: 'standard_headquarters',
      ocr_accuracy_score: 82.1,
      total_items: 20,
      correctly_recognized_items: 16.42,
      extraction_timestamp: '2024-01-15T11:00:00Z',
    };

    const other_division_model_result = {
      document_id: 'DOC-2024-002',
      format_type: 'other_division_custom',
      ocr_accuracy_score: 91.8,
      total_items: 20,
      correctly_recognized_items: 18.36,
      extraction_timestamp: '2024-01-15T11:01:00Z',
    };

    // Act
    const accuracy_difference = measureOcrAccuracyDifference(
      headquarters_model_result,
      other_division_model_result
    );

    // Assert: 他部署モデルが高精度なため負の差が出力される
    // 期待値計算: 82.1 - 91.8 = -9.7
    expect(accuracy_difference.accuracy_difference_percentage).toBe(-9.7);
    
    // 他部署モデルがより高い精度を持つ
    expect(accuracy_difference.higher_accuracy_model).toBe('other_division');
    
    // 負の値で表示されることを確認
    expect(accuracy_difference.accuracy_difference_percentage).toBeLessThan(0);
    
    // 精度レベルが適切に分類される
    expect(accuracy_difference.accuracy_level).toBe('acceptable_difference');
  });

  test('精度差が閾値を超える場合、警告レベルが高く設定される', () => {
    // Arrange: 大きな精度差が存在するケース
    const headquarters_model_result = {
      document_id: 'DOC-2024-003',
      format_type: 'standard_headquarters',
      ocr_accuracy_score: 96.2,
      total_items: 20,
      correctly_recognized_items: 19.24,
      extraction_timestamp: '2024-01-15T11:30:00Z',
    };

    const other_division_model_result = {
      document_id: 'DOC-2024-003',
      format_type: 'other_division_custom',
      ocr_accuracy_score: 71.4,
      total_items: 20,
      correctly_recognized_items: 14.28,
      extraction_timestamp: '2024-01-15T11:31:00Z',
    };

    // Act
    const accuracy_difference = measureOcrAccuracyDifference(
      headquarters_model_result,
      other_division_model_result
    );

    // Assert: 大きな精度差（24.8ポイント）が警告レベルで分類される
    // 期待値計算: 96.2 - 71.4 = 24.8
    expect(accuracy_difference.accuracy_difference_percentage).toBe(24.8);
    
    // 精度差が大きいため警告レベルが上がる
    expect(accuracy_difference.accuracy_level).toBe('high_risk_difference');
    
    // カスタマイズ必要性フラグが立つ
    expect(accuracy_difference.customization_required).toBe(true);
  });

  test('入力データが不完全な場合、エラーが発生する', () => {
    // Arrange: 必須フィールドが不足しているケース
    const invalid_input = {
      document_id: 'DOC-2024-004',
      // ocr_accuracy_score が missing
      total_items: 20,
    };

    const valid_input = {
      document_id: 'DOC-2024-004',
      format_type: 'other_division_custom',
      ocr_accuracy_score: 85.0,
      total_items: 20,
      correctly_recognized_items: 17,
      extraction_timestamp: '2024-01-15T12:00:00Z',
    };

    // Act & Assert: 不完全な入力でエラーが発生
    expect(() =>
      measureOcrAccuracyDifference(invalid_input as any, valid_input)
    ).toThrow(/精度スコア/);
  });

  test('同一ドキュメントでない場合、エラーが発生する', () => {
    // Arrange: 異なるドキュメント ID
    const result1 = {
      document_id: 'DOC-2024-005',
      format_type: 'standard_headquarters',
      ocr_accuracy_score: 90.0,
      total_items: 20,
      correctly_recognized_items: 18,
      extraction_timestamp: '2024-01-15T12:30:00Z',
    };

    const result2 = {
      document_id: 'DOC-2024-006',
      format_type: 'other_division_custom',
      ocr_accuracy_score: 88.0,
      total_items: 20,
      correctly_recognized_items: 17.6,
      extraction_timestamp: '2024-01-15T12:31:00Z',
    };

    // Act & Assert: ドキュメント ID が一致しないためエラー
    expect(() => measureOcrAccuracyDifference(result1, result2)).toThrow(
      /ドキュメント/
    );
  });

  test('精度スコアが有効な範囲外の場合、エラーが発生する', () => {
    // Arrange: 精度スコアが 100 を超える不正なケース
    const invalid_result = {
      document_id: 'DOC-2024-007',
      format_type: 'standard_headquarters',
      ocr_accuracy_score: 105.5,
      total_items: 20,
      correctly_recognized_items: 21,
      extraction_timestamp: '2024-01-15T13:00:00Z',
    };

    const valid_result = {
      document_id: 'DOC-2024-007',
      format_type: 'other_division_custom',
      ocr_accuracy_score: 88.0,
      total_items: 20,
      correctly_recognized_items: 17.6,
      extraction_timestamp: '2024-01-15T13:01:00Z',
    };

    // Act & Assert: 無効な精度スコアでエラー
    expect(() =>
      measureOcrAccuracyDifference(invalid_result, valid_result)
    ).toThrow(/精度スコア範囲/);
  });

  test('精度差がちょうど境界値の場合、正確に分類される', () => {
    // Arrange: 精度差が境界値（15ポイント）のケース
    const headquarters_model_result = {
      document_id: 'DOC-2024-008',
      format_type: 'standard_headquarters',
      ocr_accuracy_score: 92.5,
      total_items: 20,
      correctly_recognized_items: 18.5,
      extraction_timestamp: '2024-01-15T13:30:00Z',
    };

    const other_division_model_result = {
      document_id: 'DOC-2024-008',
      format_type: 'other_division_custom',
      ocr_accuracy_score: 77.5,
      total_items: 20,
      correctly_recognized_items: 15.5,
      extraction_timestamp: '2024-01-15T13:31:00Z',
    };

    // Act
    const accuracy_difference = measureOcrAccuracyDifference(
      headquarters_model_result,
      other_division_model_result
    );

    // Assert: 境界値で正確に分類される
    // 期待値計算: 92.5 - 77.5 = 15.0
    expect(accuracy_difference.accuracy_difference_percentage).toBe(15.0);
    
    // 境界値でのカスタマイズ必要性判定
    expect(accuracy_difference.customization_required).toBe(true);
    
    // レベルが正確に分類される
    expect(accuracy_difference.accuracy_level).toBe('high_risk_difference');
  });

  test('精度差がゼロに近い場合、許容範囲として分類される', () => {
    // Arrange: 精度差が 1 ポイント以下のケース
    const headquarters_model_result = {
      document_id: 'DOC-2024-009',
      format_type: 'standard_headquarters',
      ocr_accuracy_score: 89.8,
      total_items: 20,
      correctly_recognized_items: 17.96,
      extraction_timestamp: '2024-01-15T14:00:00Z',
    };

    const other_division_model_result = {
      document_id: 'DOC-2024-009',
      format_type: 'other_division_custom',
      ocr_accuracy_score: 89.2,
      total_items: 20,
      correctly_recognized_items: 17.84,
      extraction_timestamp: '2024-01-15T14:01:00Z',
    };

    // Act
    const accuracy_difference = measureOcrAccuracyDifference(
      headquarters_model_result,
      other_division_model_result
    );

    // Assert: ほぼ同等の精度で許容範囲
    // 期待値計算: 89.8 - 89.2 = 0.6
    expect(accuracy_difference.accuracy_difference_percentage).toBe(0.6);
    
    // カスタマイズ不要と分類される
    expect(accuracy_difference.customization_required).toBe(false);
    
    // 許容範囲内として分類される
    expect(accuracy_difference.accuracy_level).toBe('acceptable_difference');
  });

  test('出力形式が正確に構成されている', () => {
    // Arrange
    const headquarters_model_result = {
      document_id: 'DOC-2024-010',
      format_type: 'standard_headquarters',
      ocr_accuracy_score: 93.0,
      total_items: 25,
      correctly_recognized_items: 23.25,
      extraction_timestamp: '2024-01-15T14:30:00Z',
    };

    const other_division_model_result = {
      document_id: 'DOC-2024-010',
      format_type: 'other_division_custom',
      ocr_accuracy_score: 86.0,
      total_items: 25,
      correctly_recognized_items: 21.5,
      extraction_timestamp: '2024-01-15T14:31:00Z',
    };

    // Act
    const result = measureOcrAccuracyDifference(
      headquarters_model_result,
      other_division_model_result
    );

    // Assert: 出力形式が完全であることを確認
    expect(result).toHaveProperty('document_id');
    expect(result).toHaveProperty('accuracy_difference_percentage');
    expect(result).toHaveProperty('higher_accuracy_model');
    expect(result).toHaveProperty('headquarters_accuracy_score');
    expect(result).toHaveProperty('other_division_accuracy_score');
    expect(result).toHaveProperty('accuracy_level');
    expect(result).toHaveProperty('customization_required');
    expect(result).toHaveProperty('model_comparison_result');
    expect(result).toHaveProperty('measurement_timestamp');

    // 型チェック
    expect(typeof result.accuracy_difference_percentage).toBe('number');
    expect(typeof result.higher_accuracy_model).toBe('string');
    expect(typeof result.customization_required).toBe('boolean');
    
    // 期待値計算: 93.0 - 86.0 = 7.0
    expect(result.accuracy_difference_percentage).toBe(7.0);
    expect(result.higher_accuracy_model).toBe('headquarters');
  });
});