import { classifyFormatDifferenceCauses } from '../../src/logic/it-6-3-1';

describe('フォーマット差異原因分類', () => {
  test('SCEN-1346: 複数の原因が同時に存在する場合に主要因が正しく特定される', () => {
    // Arrange: 複数の原因が同時に存在するフォーマット差異ケースを準備
    const format_difference_case = {
      detected_causes: [
        {
          cause_type: 'font_change',
          importance_score: 0.8,
          description: 'フォント変更'
        },
        {
          cause_type: 'layout_shift',
          importance_score: 0.9,
          description: 'レイアウトズレ'
        },
        {
          cause_type: 'color_difference',
          importance_score: 0.6,
          description: '色彩差異'
        }
      ],
      format_id: 'fmt_20240115_multi_001',
      analysis_timestamp: '2024-01-15T11:00:00Z'
    };

    // Act: 主要因特定ロジックを実行
    const result = classifyFormatDifferenceCauses(format_difference_case);

    // Assert: 主要因がレイアウトズレ（スコア0.9）として正しく識別されたことを確認
    expect(result.primary_cause.cause_type).toBe('layout_shift');
    expect(result.primary_cause.importance_score).toBe(0.9);
    expect(result.primary_cause.description).toBe('レイアウトズレ');

    // Assert: 主要因の信頼度スコアが期待値（0.9以上）の範囲内であることを検証
    expect(result.primary_cause.confidence_score).toBeGreaterThanOrEqual(0.9);

    // Assert: 関連原因リストにフォント変更と色彩差異が正しく含まれていることを確認
    expect(result.related_causes).toHaveLength(2);
    expect(result.related_causes).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          cause_type: 'font_change',
          importance_score: 0.8,
          description: 'フォント変更'
        }),
        expect.objectContaining({
          cause_type: 'color_difference',
          importance_score: 0.6,
          description: '色彩差異'
        })
      ])
    );

    // Assert: 関連原因が重要度スコアの降順でソートされていることを確認
    expect(result.related_causes[0].importance_score).toBeGreaterThanOrEqual(
      result.related_causes[1].importance_score
    );

    // Assert: 結果オブジェクトが必須フィールドをすべて含んでいることを確認
    expect(result).toHaveProperty('primary_cause');
    expect(result).toHaveProperty('related_causes');
    expect(result).toHaveProperty('analysis_status');
    expect(result.analysis_status).toBe('completed');
  });
});