import { recordImprovementEffectFeedback } from '../../src/logic/it-6-3-1';

describe('改善効果検証フィードバック記録機能', () => {
  test('SCEN-1159: 必須フィードバック項目が不足している場合、不完全なデータとして記録しない', () => {
    // 必須項目のうち「効果有無」フィールドを空のままで、その他必須項目は入力
    const incompletePayload = {
      improvementContentId: 'IMP-001',
      implementationDate: '2024-12-20',
      effectPresence: '', // 効果有無：空（不足）
      improvementDetails: 'OCR読取精度が向上した対象項目の詳細説明',
      implementationIssues: '特に問題なし',
    };

    // バリデーションエラーを期待：「効果有無」が未入力
    expect(() => recordImprovementEffectFeedback(incompletePayload)).toThrow(/効果有無/);
  });

  test('SCEN-1159: すべての必須項目が入力されている場合、フィードバックレコードが正常に記録される', () => {
    // すべての必須項目を入力したペイロード
    const completePayload = {
      improvementContentId: 'IMP-002',
      implementationDate: '2024-12-21',
      effectPresence: 'yes',
      improvementDetails: 'AI判定精度が前月比で3%向上',
      implementationIssues: 'なし',
    };

    // 正常に記録される（throws しない）
    const result = recordImprovementEffectFeedback(completePayload);

    // 記録結果の構造を検証
    expect(result).toEqual(
      expect.objectContaining({
        recordId: expect.any(String),
        improvementContentId: 'IMP-002',
        implementationDate: '2024-12-21',
        effectPresence: 'yes',
        improvementDetails: 'AI判定精度が前月比で3%向上',
        implementationIssues: 'なし',
        recordedAt: expect.any(String),
        status: 'recorded',
      })
    );
    expect(result.status).toBe('recorded');
  });

  test('SCEN-1159: 複数の必須項目が不足している場合、最初の欠落項目のエラーを発出する', () => {
    // 複数の必須項目が不足している場合
    const multipleIncompletepayload = {
      improvementContentId: 'IMP-003',
      implementationDate: '', // 実施日：空（不足）
      effectPresence: '', // 効果有無：空（不足）
      improvementDetails: '',
      implementationIssues: '',
    };

    // 最初の欠落項目でエラーを発出（実施日が先）
    expect(() => recordImprovementEffectFeedback(multipleIncompletepayload)).toThrow(
      /実施日/
    );
  });

  test('SCEN-1159: 効果有無が無効な値の場合、形式エラーを発出する', () => {
    // 効果有無フィールドに無効な値を入力
    const invalidEffectValuePayload = {
      improvementContentId: 'IMP-004',
      implementationDate: '2024-12-22',
      effectPresence: 'invalid_value', // 無効な値（yes/no以外）
      improvementDetails: '改善内容の説明',
      implementationIssues: 'なし',
    };

    // 形式エラーを期待
    expect(() => recordImprovementEffectFeedback(invalidEffectValuePayload)).toThrow(
      /効果有無/
    );
  });

  test('SCEN-1159: 効果有無が「no」の場合でも正常に記録される', () => {
    // 効果有無が「no」の完全なペイロード
    const noEffectPayload = {
      improvementContentId: 'IMP-005',
      implementationDate: '2024-12-23',
      effectPresence: 'no',
      improvementDetails: '別の改善手法を検討すべき結果',
      implementationIssues: '効果なし',
    };

    // 正常に記録される
    const result = recordImprovementEffectFeedback(noEffectPayload);

    expect(result).toEqual(
      expect.objectContaining({
        recordId: expect.any(String),
        improvementContentId: 'IMP-005',
        effectPresence: 'no',
        status: 'recorded',
      })
    );
  });
});