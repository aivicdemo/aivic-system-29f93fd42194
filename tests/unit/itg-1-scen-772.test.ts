import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { validateDocumentVersionValidity } from '../../src/logic/it-1781935279444-2-2-1';

describe('Document Version Validity Validation - Missing Application Rule Error Detection', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // SCEN-772: [error] 顧客別・案件別・資料種別バージョン有効性自動判定機能 - 登録済み適用ルールが存在しない場合にエラーとして検出される
  test('should detect and throw error when application rule is not registered', () => {
    const customer_id = 'CUST-20240115-001';
    const project_id = 'PROJ-20240115-001';
    const material_type = 'CONTRACT_DOCUMENT';
    const application_rule_id = 'RULE-NOT-EXISTS-001';
    const check_date = new Date('2024-01-15T09:00:00Z');

    const input = {
      customer_id: customer_id,
      project_id: project_id,
      material_type: material_type,
      application_rule_id: application_rule_id,
      check_date: check_date,
    };

    expect(() => validateDocumentVersionValidity(input)).toThrow(/ルール未登録/);
  });
});