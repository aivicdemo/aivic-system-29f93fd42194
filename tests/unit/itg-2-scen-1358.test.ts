import { describe, test, expect } from '@jest/globals';
import { validateLearningDatasetQuality } from '../../src/logic/it-6-2-1-1';

describe('査定担当者別・工種別・金額帯別の判定精度指標の自動集計と可視化', () => {
  test('SCEN-1358: 学習データセット品質検証 - 項目体系が部分的に異なる場合に不適合箇所が正確に特定される', () => {
    // テストデータ: 標準的な項目体系を持つ学習データセットA
    const standardDataset = {
      id: 'dataset-A-standard',
      schema: [
        { fieldName: 'project_id', fieldType: 'string', required: true },
        { fieldName: 'work_category', fieldType: 'string', required: true },
        { fieldName: 'estimated_amount', fieldType: 'number', required: true },
        { fieldName: 'quantity', fieldType: 'number', required: true },
        { fieldName: 'unit_price', fieldType: 'number', required: true },
        { fieldName: 'region', fieldType: 'string', required: true },
        { fieldName: 'season', fieldType: 'string', required: false },
      ],
      records: [
        {
          project_id: 'P001',
          work_category: '土木工事',
          estimated_amount: 1500000,
          quantity: 100,
          unit_price: 15000,
          region: '東京都',
          season: '春',
        },
      ],
    };

    // テストデータ: 項目体系が部分的に異なるデータセットB
    // - estimated_amount が欠落
    // - unit_price が名称変更（price に変更）
    // - new_field が追加
    const partiallyDifferentDataset = {
      id: 'dataset-B-partial-diff',
      schema: [
        { fieldName: 'project_id', fieldType: 'string', required: true },
        { fieldName: 'work_category', fieldType: 'string', required: true },
        { fieldName: 'quantity', fieldType: 'number', required: true },
        { fieldName: 'price', fieldType: 'number', required: true }, // 名称変更: unit_price → price
        { fieldName: 'region', fieldType: 'string', required: true },
        { fieldName: 'season', fieldType: 'string', required: false },
        { fieldName: 'new_field', fieldType: 'string', required: false }, // 追加項目
      ],
      records: [
        {
          project_id: 'P001',
          work_category: '土木工事',
          quantity: 100,
          price: 15000,
          region: '東京都',
          season: '春',
          new_field: 'additional_data',
        },
      ],
    };

    // 品質検証機能を実行
    const validationResult = validateLearningDatasetQuality({
      referenceSchema: standardDataset.schema,
      targetDataset: partiallyDifferentDataset,
    });

    // 検証結果の構造を確認
    expect(validationResult).toHaveProperty('isValid');
    expect(validationResult).toHaveProperty('mismatchList');
    expect(validationResult).toHaveProperty('validationTimestamp');

    // 検証が失敗（isValid === false）であることを確認
    expect(validationResult.isValid).toBe(false);

    // 不適合箇所の一覧を確認
    expect(Array.isArray(validationResult.mismatchList)).toBe(true);
    expect(validationResult.mismatchList.length).toBe(3);

    // 欠落項目を確認: estimated_amount
    const missingField = validationResult.mismatchList.find(
      (m: any) => m.fieldName === 'estimated_amount' && m.mismatchType === 'MISSING'
    );
    expect(missingField).toBeDefined();
    expect(missingField.mismatchType).toBe('MISSING');
    expect(missingField.location).toEqual({ rowNumber: null, columnIndex: null });
    expect(missingField.detail).toMatch(/estimated_amount/);
    expect(missingField.recommendedAction).toMatch(/追加/);

    // 名称変更項目を確認: unit_price → price
    const renamedField = validationResult.mismatchList.find(
      (m: any) => m.fieldName === 'unit_price' && m.mismatchType === 'RENAMED'
    );
    expect(renamedField).toBeDefined();
    expect(renamedField.mismatchType).toBe('RENAMED');
    expect(renamedField.detail).toMatch(/unit_price/);
    expect(renamedField.detail).toMatch(/price/);
    expect(renamedField.recommendedAction).toMatch(/名称/);

    // 追加項目を確認: new_field
    const additionalField = validationResult.mismatchList.find(
      (m: any) => m.fieldName === 'new_field' && m.mismatchType === 'EXTRA'
    );
    expect(additionalField).toBeDefined();
    expect(additionalField.mismatchType).toBe('EXTRA');
    expect(additionalField.location).toEqual({ rowNumber: null, columnIndex: null });
    expect(additionalField.detail).toMatch(/new_field/);
    expect(additionalField.recommendedAction).toMatch(/削除/);

    // 各不適合箇所の詳細情報を確認
    validationResult.mismatchList.forEach((mismatch: any) => {
      expect(mismatch).toHaveProperty('fieldName');
      expect(mismatch).toHaveProperty('mismatchType');
      expect(mismatch).toHaveProperty('location');
      expect(mismatch).toHaveProperty('detail');
      expect(mismatch).toHaveProperty('recommendedAction');

      // 位置情報が記録されていることを確認
      expect(mismatch.location).toHaveProperty('rowNumber');
      expect(mismatch.location).toHaveProperty('columnIndex');

      // 詳細情報が空文字列でないことを確認
      expect(mismatch.detail.length).toBeGreaterThan(0);
      expect(mismatch.recommendedAction.length).toBeGreaterThan(0);
    });

    // 不適合箇所の分類が正確であることを確認
    const mismatchTypes = validationResult.mismatchList.map((m: any) => m.mismatchType);
    expect(mismatchTypes).toContain('MISSING');
    expect(mismatchTypes).toContain('RENAMED');
    expect(mismatchTypes).toContain('EXTRA');

    // 検証タイムスタンプが ISO 8601 形式であることを確認
    expect(validationResult.validationTimestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/);

    // 要件別の検証結果を確認
    expect(validationResult.summary).toEqual({
      totalMismatches: 3,
      missingFields: 1,
      renamedFields: 1,
      extraFields: 1,
    });
  });
});