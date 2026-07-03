import { validateReportGenerationParameters } from '../../src/logic/it-1-2-1';

describe('営業成果データから請求対象項目を自動抽出し、顧客ごと・サービスごとの請求額を集計する機能', () => {
  // SCEN-658: [edge] レポート生成パラメータ妥当性検証機能 - 期間パラメータが正確に設定値の境界値で検証される
  test('期間パラメータが境界値のすべてのエッジケースで正確に検証される', () => {
    // ケース1: 最小値（1900-01-01）から最大値（2099-12-31）への有効な期間
    const result_valid_full_range = validateReportGenerationParameters({
      start_date: '1900-01-01',
      end_date: '2099-12-31',
    });
    expect(result_valid_full_range.is_valid).toBe(true);
    expect(result_valid_full_range.errors).toEqual([]);

    // ケース2: 開始日が終了日以前であることを確認（有効な期間）
    const result_valid_normal = validateReportGenerationParameters({
      start_date: '2024-01-01',
      end_date: '2024-12-31',
    });
    expect(result_valid_normal.is_valid).toBe(true);
    expect(result_valid_normal.errors).toEqual([]);

    // ケース3: 開始日と終了日の時間差が負の値でないことを確認（同一日付）
    const result_same_date = validateReportGenerationParameters({
      start_date: '2024-06-15',
      end_date: '2024-06-15',
    });
    expect(result_same_date.is_valid).toBe(true);
    expect(result_same_date.errors).toEqual([]);

    // ケース4: 終了日が開始日より前の日付の場合バリデーションエラーが発生
    const result_invalid_reverse = validateReportGenerationParameters({
      start_date: '2024-12-31',
      end_date: '2024-01-01',
    });
    expect(result_invalid_reverse.is_valid).toBe(false);
    expect(result_invalid_reverse.errors).toContain(
      expect.stringMatching(/期間/)
    );

    // ケース5: 開始日のみを設定して検証を実行
    const result_start_only = validateReportGenerationParameters({
      start_date: '2024-01-01',
      end_date: undefined,
    });
    expect(result_start_only.is_valid).toBe(false);
    expect(result_start_only.errors).toContain(
      expect.stringMatching(/終了日/)
    );

    // ケース6: 終了日のみを設定して検証を実行
    const result_end_only = validateReportGenerationParameters({
      start_date: undefined,
      end_date: '2024-12-31',
    });
    expect(result_end_only.is_valid).toBe(false);
    expect(result_end_only.errors).toContain(
      expect.stringMatching(/開始日/)
    );

    // ケース7: 両方のパラメータが空白の場合の検証結果を確認
    const result_both_empty = validateReportGenerationParameters({
      start_date: undefined,
      end_date: undefined,
    });
    expect(result_both_empty.is_valid).toBe(false);
    expect(result_both_empty.errors.length).toBeGreaterThan(0);

    // ケース8: 無効な日付形式の場合
    expect(() =>
      validateReportGenerationParameters({
        start_date: '2024-13-01',
        end_date: '2024-12-31',
      })
    ).toThrow(/日付形式/);

    // ケース9: 無効な日付形式（終了日）の場合
    expect(() =>
      validateReportGenerationParameters({
        start_date: '2024-01-01',
        end_date: '2024-12-32',
      })
    ).toThrow(/日付形式/);
  });
});