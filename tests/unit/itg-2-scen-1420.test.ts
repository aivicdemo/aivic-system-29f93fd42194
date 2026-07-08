import { validateOCRAccuracy } from '../../src/logic/it-6-3-1';

describe('OCR精度検証・判定機能', () => {
  // SCEN-1420
  test('OCR読取精度が合格基準を下回る場合に不合格判定が返される', () => {
    const testInput = {
      measured_accuracy_percent: 90,
      required_accuracy_percent: 95,
      ocr_item_count: 50,
      correct_item_count: 45,
    };

    const result = validateOCRAccuracy(testInput);

    // (1) ステータスコードが不合格を示す値である
    expect(result.status_code).toBe('NG');

    // (2) 判定結果フィールドに不合格フラグが立っている
    expect(result.is_pass).toBe(false);

    // (3) エラーメッセージに精度が基準値を下回っている旨の詳細情報が含まれている
    expect(result.error_message).toMatch(/基準値/);
    expect(result.error_message).toMatch(/精度/);

    // 追加検証: 精度の数値と基準値が詳細情報に含まれているか
    expect(result.detail).toEqual({
      measured_accuracy: 90,
      required_accuracy: 95,
      accuracy_gap: -5,
      judgment_reason: 'OCR精度が基準値を下回っています',
    });
  });
});