import { describe, test, expect, beforeEach } from '@jest/globals';
import { generateQualityChecklistFromMetadata } from '../../src/logic/it-1781935279444-2-1-1';

describe('品質管理ルール・チェックリスト作成機能 - メタデータ必須項目検証', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // SCEN-1358: メタデータに必須項目が不足している場合、チェックリスト生成がエラーとなり詳細なエラーメッセージが返される
  test('should reject checklist generation when required metadata fields are missing and return detailed error message', () => {
    const incompleteMetadata = {
      dataSourceName: '',
      checkItems: [],
      mandatoryFields: ['顧客名', '接触日時'],
      dataType: 'sales_activity',
      validationRules: [
        {
          fieldName: '顧客名',
          ruleType: 'required',
          expectedFormat: 'string',
        },
      ],
    };

    expect(() =>
      generateQualityChecklistFromMetadata(incompleteMetadata)
    ).toThrow(/データソース名/);
  });

  test('should reject checklist generation when check items are empty and return error message', () => {
    const incompleteMetadata = {
      dataSourceName: 'sales_pipeline',
      checkItems: [],
      mandatoryFields: ['顧客名', '接触日時'],
      dataType: 'sales_activity',
      validationRules: [
        {
          fieldName: '顧客名',
          ruleType: 'required',
          expectedFormat: 'string',
        },
      ],
    };

    expect(() =>
      generateQualityChecklistFromMetadata(incompleteMetadata)
    ).toThrow(/チェック項目/);
  });

  test('should reject checklist generation when mandatory fields are empty', () => {
    const incompleteMetadata = {
      dataSourceName: 'sales_pipeline',
      checkItems: [
        {
          itemId: 'check_001',
          itemName: '必須項目チェック',
          description: '顧客名が入力されているか確認',
        },
      ],
      mandatoryFields: [],
      dataType: 'sales_activity',
      validationRules: [
        {
          fieldName: '顧客名',
          ruleType: 'required',
          expectedFormat: 'string',
        },
      ],
    };

    expect(() =>
      generateQualityChecklistFromMetadata(incompleteMetadata)
    ).toThrow(/必須項目/);
  });

  test('should reject checklist generation when validation rules are missing', () => {
    const incompleteMetadata = {
      dataSourceName: 'sales_pipeline',
      checkItems: [
        {
          itemId: 'check_001',
          itemName: '必須項目チェック',
          description: '顧客名が入力されているか確認',
        },
      ],
      mandatoryFields: ['顧客名', '接触日時'],
      dataType: 'sales_activity',
      validationRules: [],
    };

    expect(() =>
      generateQualityChecklistFromMetadata(incompleteMetadata)
    ).toThrow(/検証ルール/);
  });

  test('should successfully generate checklist when all required metadata fields are provided', () => {
    const completeMetadata = {
      dataSourceName: 'sales_pipeline',
      checkItems: [
        {
          itemId: 'check_001',
          itemName: '必須項目チェック',
          description: '顧客名が入力されているか確認',
        },
        {
          itemId: 'check_002',
          itemName: 'データ型チェック',
          description: '接触日時が日付形式か確認',
        },
      ],
      mandatoryFields: ['顧客名', '接触日時'],
      dataType: 'sales_activity',
      validationRules: [
        {
          fieldName: '顧客名',
          ruleType: 'required',
          expectedFormat: 'string',
          errorMessage: '顧客名は必須項目です',
        },
        {
          fieldName: '接触日時',
          ruleType: 'dateFormat',
          expectedFormat: 'YYYY-MM-DD HH:mm:ss',
          errorMessage: '接触日時は日付形式で入力してください',
        },
      ],
      createdBy: 'operator_001',
      createdAt: '2024-01-15T09:00:00Z',
    };

    const result = generateQualityChecklistFromMetadata(completeMetadata);

    expect(result).toBeDefined();
    expect(result.checklistId).toBeDefined();
    expect(result.dataSourceName).toBe('sales_pipeline');
    expect(result.checkItems.length).toBe(2);
    expect(result.mandatoryFields).toEqual(['顧客名', '接触日時']);
    expect(result.validationRulesCount).toBe(2);
    expect(result.status).toBe('generated');
    expect(result.generatedAt).toBeDefined();
  });
});