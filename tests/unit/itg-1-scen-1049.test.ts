import { describe, test, expect } from '@jest/globals';
import { validateMonthlySummaryPeriod } from '../../src/logic/it-1-br-1781935279444-1-2-1';

describe('月次サマリーテンプレート期間確定エラー処理', () => {
  // SCEN-1049: 期間開始日時の指定が無効な値のとき期間確定エラーが発生する
  test('期間開始日時が無効な値（不正な日付形式）のとき、期間確定エラーを返す', () => {
    const invalid_start_datetime = '2024-13-45';
    const valid_end_datetime = '2024-01-31T23:59:59Z';

    expect(() => {
      validateMonthlySummaryPeriod({
        start_datetime: invalid_start_datetime,
        end_datetime: valid_end_datetime,
      });
    }).toThrow(/期間開始日時/);
  });

  test('期間開始日時が無効な値（非日時文字列）のとき、期間確定エラーを返す', () => {
    const invalid_start_datetime = 'abc';
    const valid_end_datetime = '2024-01-31T23:59:59Z';

    expect(() => {
      validateMonthlySummaryPeriod({
        start_datetime: invalid_start_datetime,
        end_datetime: valid_end_datetime,
      });
    }).toThrow(/期間開始日時/);
  });

  test('期間開始日時が無効な値（空文字列）のとき、期間確定エラーを返す', () => {
    const invalid_start_datetime = '';
    const valid_end_datetime = '2024-01-31T23:59:59Z';

    expect(() => {
      validateMonthlySummaryPeriod({
        start_datetime: invalid_start_datetime,
        end_datetime: valid_end_datetime,
      });
    }).toThrow(/期間開始日時/);
  });

  test('期間開始日時が無効な値（null）のとき、期間確定エラーを返す', () => {
    const invalid_start_datetime = null;
    const valid_end_datetime = '2024-01-31T23:59:59Z';

    expect(() => {
      validateMonthlySummaryPeriod({
        start_datetime: invalid_start_datetime as any,
        end_datetime: valid_end_datetime,
      });
    }).toThrow(/期間開始日時/);
  });

  test('期間開始日時が有効な値（ISO 8601 形式）のとき、期間確定処理が実行される', () => {
    const valid_start_datetime = '2024-01-01T00:00:00Z';
    const valid_end_datetime = '2024-01-31T23:59:59Z';

    const result = validateMonthlySummaryPeriod({
      start_datetime: valid_start_datetime,
      end_datetime: valid_end_datetime,
    });

    expect(result).toEqual({
      is_valid: true,
      period_id: expect.any(String),
      start_datetime: valid_start_datetime,
      end_datetime: valid_end_datetime,
      data_extraction_status: 'pending',
    });
  });
});