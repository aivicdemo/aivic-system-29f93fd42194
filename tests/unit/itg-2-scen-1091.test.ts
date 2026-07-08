import { validateLearningDataInput } from '../../src/logic/it-6-3-1';

describe('学習データ必要性判定機能 - 入力データ検証', () => {
  // SCEN-1091
  test('必須フィールドが空白の場合、エラーレスポンスを返して判定を中止する', () => {
    // ハッピーパスの完全入力
    const validInput = {
      assessmentTarget: '基礎工事',
      assessmentItem: '根切り単価',
      existingDataVolume: 150,
      dataCollectionDays: 90,
      regionCoverage: 0.75,
    };

    // 基本: 完全入力で成功
    const resultValid = validateLearningDataInput(validInput);
    expect(resultValid.isValid).toBe(true);
    expect(resultValid.errors).toEqual([]);

    // エラー1: assessmentTarget が空文字列
    const missingTarget = {
      assessmentTarget: '',
      assessmentItem: '根切り単価',
      existingDataVolume: 150,
      dataCollectionDays: 90,
      regionCoverage: 0.75,
    };
    const resultMissingTarget = validateLearningDataInput(missingTarget);
    expect(resultMissingTarget.isValid).toBe(false);
    expect(resultMissingTarget.errors.length).toBeGreaterThan(0);
    expect(resultMissingTarget.errors[0]).toMatch(/査定対象品/);
    expect(resultMissingTarget.learningDataRequired).toBeUndefined();

    // エラー2: assessmentItem が undefined
    const missingItem = {
      assessmentTarget: '基礎工事',
      assessmentItem: undefined,
      existingDataVolume: 150,
      dataCollectionDays: 90,
      regionCoverage: 0.75,
    };
    const resultMissingItem = validateLearningDataInput(missingItem);
    expect(resultMissingItem.isValid).toBe(false);
    expect(resultMissingItem.errors.length).toBeGreaterThan(0);
    expect(resultMissingItem.errors[0]).toMatch(/査定項目/);
    expect(resultMissingItem.learningDataRequired).toBeUndefined();

    // エラー3: existingDataVolume が null
    const missingVolume = {
      assessmentTarget: '基礎工事',
      assessmentItem: '根切り単価',
      existingDataVolume: null,
      dataCollectionDays: 90,
      regionCoverage: 0.75,
    };
    const resultMissingVolume = validateLearningDataInput(missingVolume);
    expect(resultMissingVolume.isValid).toBe(false);
    expect(resultMissingVolume.errors.length).toBeGreaterThan(0);
    expect(resultMissingVolume.errors[0]).toMatch(/既存学習データ量/);
    expect(resultMissingVolume.learningDataRequired).toBeUndefined();

    // エラー4: dataCollectionDays が 0
    const invalidDays = {
      assessmentTarget: '基礎工事',
      assessmentItem: '根切り単価',
      existingDataVolume: 150,
      dataCollectionDays: 0,
      regionCoverage: 0.75,
    };
    const resultInvalidDays = validateLearningDataInput(invalidDays);
    expect(resultInvalidDays.isValid).toBe(false);
    expect(resultInvalidDays.errors.length).toBeGreaterThan(0);
    expect(resultInvalidDays.errors[0]).toMatch(/データ収集期間/);
    expect(resultInvalidDays.learningDataRequired).toBeUndefined();

    // エラー5: regionCoverage が負数
    const invalidCoverage = {
      assessmentTarget: '基礎工事',
      assessmentItem: '根切り単価',
      existingDataVolume: 150,
      dataCollectionDays: 90,
      regionCoverage: -0.5,
    };
    const resultInvalidCoverage = validateLearningDataInput(invalidCoverage);
    expect(resultInvalidCoverage.isValid).toBe(false);
    expect(resultInvalidCoverage.errors.length).toBeGreaterThan(0);
    expect(resultInvalidCoverage.errors[0]).toMatch(/地域カバー率/);
    expect(resultInvalidCoverage.learningDataRequired).toBeUndefined();

    // エラー6: 複数フィールド欠落
    const multipleErrors = {
      assessmentTarget: '',
      assessmentItem: '',
      existingDataVolume: null,
      dataCollectionDays: 0,
      regionCoverage: 1.5,
    };
    const resultMultiple = validateLearningDataInput(multipleErrors);
    expect(resultMultiple.isValid).toBe(false);
    expect(resultMultiple.errors.length).toBeGreaterThanOrEqual(5);
    expect(resultMultiple.learningDataRequired).toBeUndefined();

    // HTTPステータス検証: エラー時は 400 または 422
    // (実装ではこれを API ラッパーで返す想定)
    expect(resultMissingTarget.httpStatus).toBe(400);
    expect(resultMissingItem.httpStatus).toBe(400);
    expect(resultMissingVolume.httpStatus).toBe(400);
    expect(resultInvalidDays.httpStatus).toBe(400);
    expect(resultInvalidCoverage.httpStatus).toBe(400);
    expect(resultMultiple.httpStatus).toBe(400);

    // 判定処理が中止されたことを確認（learningDataRequired が含まれない）
    expect(resultMissingTarget).not.toHaveProperty('learningDataRequired');
    expect(resultMissingItem).not.toHaveProperty('learningDataRequired');
    expect(resultMissingVolume).not.toHaveProperty('learningDataRequired');
  });
});