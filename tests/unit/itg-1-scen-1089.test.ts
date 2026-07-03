import { describe, test, expect } from '@jest/globals';
import { validateSalesDataCompleteness } from '../../src/logic/it-1781935279444-2-2-1';

describe('営業データの完全性・正確性自動検証', () => {
  test('SCEN-1089: 確認・検証データが不完全な場合にエラーが発生する', () => {
    // テストデータセットアップ: 不完全なデータを準備
    const incompleteDataset = {
      student_id: 'STU20240001',
      name: '山田太郎',
      enrollment_date: '2020-04-01',
      grade_records: null,
      acquired_credits: undefined,
      gpa: 3.5,
      completion_status: 'pending',
    };

    // エラーハンドリング処理の検証: 不完全なデータで実行
    expect(() =>
      validateSalesDataCompleteness(incompleteDataset)
    ).toThrow(/成績情報/);

    // 異なる欠落パターンをテスト: 修得単位数が未設定
    const missingCreditsDataset = {
      student_id: 'STU20240002',
      name: '佐藤花子',
      enrollment_date: '2020-04-01',
      grade_records: [
        { subject: '数学', score: 85 },
        { subject: '英語', score: 90 },
      ],
      acquired_credits: null,
      gpa: 3.8,
      completion_status: 'pending',
    };

    expect(() =>
      validateSalesDataCompleteness(missingCreditsDataset)
    ).toThrow(/修得単位/);

    // 複数の必須フィールドが欠落したパターン
    const multipleFieldsMissingDataset = {
      student_id: 'STU20240003',
      name: undefined,
      enrollment_date: '2020-04-01',
      grade_records: null,
      acquired_credits: undefined,
      gpa: null,
      completion_status: 'pending',
    };

    expect(() =>
      validateSalesDataCompleteness(multipleFieldsMissingDataset)
    ).toThrow(/学生名|成績情報|修得単位|GPA/);

    // 完全なデータで成功する場合を検証
    const completeDataset = {
      student_id: 'STU20240004',
      name: '鈴木次郎',
      enrollment_date: '2020-04-01',
      grade_records: [
        { subject: '数学', score: 88 },
        { subject: '英語', score: 92 },
        { subject: '国語', score: 85 },
      ],
      acquired_credits: 124,
      gpa: 3.7,
      completion_status: 'verified',
    };

    const result = validateSalesDataCompleteness(completeDataset);

    // 判定結果が成功状態で返されることを確認
    expect(result).toEqual({
      status: 'success',
      is_graduation_eligible: true,
      validation_details: {
        completeness_check: 'passed',
        student_id: 'STU20240004',
        acquired_credits: 124,
        gpa: 3.7,
        grade_records_count: 3,
      },
    });

    // GPA基準を満たさないが他は完全なデータ
    const low_gpa_dataset = {
      student_id: 'STU20240005',
      name: '田中美咲',
      enrollment_date: '2020-04-01',
      grade_records: [
        { subject: '数学', score: 60 },
        { subject: '英語', score: 62 },
      ],
      acquired_credits: 128,
      gpa: 1.8,
      completion_status: 'verified',
    };

    const result_low_gpa = validateSalesDataCompleteness(low_gpa_dataset);

    // 完全性チェックはパスするが、卒業要件は不満たし
    expect(result_low_gpa).toEqual({
      status: 'success',
      is_graduation_eligible: false,
      validation_details: {
        completeness_check: 'passed',
        student_id: 'STU20240005',
        acquired_credits: 128,
        gpa: 1.8,
        grade_records_count: 2,
      },
      reason: 'GPA基準を満たしていません',
    });

    // 修得単位不足の場合
    const insufficient_credits_dataset = {
      student_id: 'STU20240006',
      name: '伊藤健一',
      enrollment_date: '2020-04-01',
      grade_records: [
        { subject: '数学', score: 90 },
        { subject: '英語', score: 88 },
      ],
      acquired_credits: 110,
      gpa: 3.6,
      completion_status: 'verified',
    };

    const result_insufficient_credits = validateSalesDataCompleteness(
      insufficient_credits_dataset
    );

    expect(result_insufficient_credits).toEqual({
      status: 'success',
      is_graduation_eligible: false,
      validation_details: {
        completeness_check: 'passed',
        student_id: 'STU20240006',
        acquired_credits: 110,
        gpa: 3.6,
        grade_records_count: 2,
      },
      reason: '修得単位数が不足しています',
    });
  });
});