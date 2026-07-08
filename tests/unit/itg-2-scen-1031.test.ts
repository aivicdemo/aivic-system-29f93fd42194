import { validateQuestionTextLength } from '../../src/logic/it-1-br-2-2-2-1';

describe('ゼネコン質問対応自動判定機能 - 質問テキスト長バリデーション', () => {
  test('SCEN-1031: 質問テキストが10000文字を超える場合、エラーハンドリングが正常に動作する', () => {
    // Arrange: 10001文字の質問テキストを生成
    const excessiveText = 'a'.repeat(10001);
    const validText = 'a'.repeat(10000);
    const shortText = 'これは有効な質問です。';

    // Act & Assert: 10001文字 - エラーが発生することを確認
    expect(() => {
      validateQuestionTextLength({ questionText: excessiveText });
    }).toThrow(/質問テキスト長/);

    // Act & Assert: 10000文字（上限）- 成功
    const result_valid = validateQuestionTextLength({ questionText: validText });
    expect(result_valid).toEqual({
      isValid: true,
      errorMessage: null,
      textLength: 10000
    });

    // Act & Assert: 短いテキスト - 成功
    const result_short = validateQuestionTextLength({ questionText: shortText });
    expect(result_short).toEqual({
      isValid: true,
      errorMessage: null,
      textLength: shortText.length
    });

    // Act & Assert: 空文字列 - 成功（最小値は0）
    const result_empty = validateQuestionTextLength({ questionText: '' });
    expect(result_empty).toEqual({
      isValid: true,
      errorMessage: null,
      textLength: 0
    });

    // Act & Assert: 境界値テスト - 9999文字（有効）
    const boundaryText = 'x'.repeat(9999);
    const result_boundary = validateQuestionTextLength({ questionText: boundaryText });
    expect(result_boundary).toEqual({
      isValid: true,
      errorMessage: null,
      textLength: 9999
    });

    // Act & Assert: 境界値テスト - 10002文字（無効）
    const excessiveBoundaryText = 'y'.repeat(10002);
    expect(() => {
      validateQuestionTextLength({ questionText: excessiveBoundaryText });
    }).toThrow(/質問テキスト長/);

    // Act & Assert: ユーザーがテキストを削減して再入力できることを確認
    const correctedText = excessiveText.substring(0, 10000);
    const result_corrected = validateQuestionTextLength({ questionText: correctedText });
    expect(result_corrected).toEqual({
      isValid: true,
      errorMessage: null,
      textLength: 10000
    });

    // Act & Assert: 改行を含む10001文字テキスト - エラーが発生
    const textWithNewlines = 'a'.repeat(5000) + '\n' + 'b'.repeat(5001);
    expect(() => {
      validateQuestionTextLength({ questionText: textWithNewlines });
    }).toThrow(/質問テキスト長/);

    // Act & Assert: 改行を含む10000文字以下のテキスト - 成功
    const validTextWithNewlines = 'a'.repeat(5000) + '\n' + 'b'.repeat(4999);
    const result_newlines = validateQuestionTextLength({ questionText: validTextWithNewlines });
    expect(result_newlines).toEqual({
      isValid: true,
      errorMessage: null,
      textLength: 10000
    });
  });
});