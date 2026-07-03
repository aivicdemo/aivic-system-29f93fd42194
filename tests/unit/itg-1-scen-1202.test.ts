import { validateContractChangeRequiredFields } from '../../src/logic/it-1781935279444-2-2-1';

describe('営業データの完全性・正確性を自動検証し、不足データ・誤りを検出・通知する機能', () => {
  // SCEN-1202
  test('契約変更内容の必須項目検証 - 必須項目が1つ以上不足している場合、不足項目を特定してエラーを返す', () => {
    // ケース1: 契約IDが不足している場合
    const input_missing_contract_id = {
      contractId: undefined,
      changeDate: '2024-01-15',
      changeItem: '納期',
      changeValue: '2024-02-28',
      approver: '営業責任者'
    };

    const result_missing_contract_id = validateContractChangeRequiredFields(
      input_missing_contract_id
    );

    expect(result_missing_contract_id.isValid).toBe(false);
    expect(result_missing_contract_id.errorCode).toBe('VALIDATION_ERROR_MISSING_REQUIRED_FIELD');
    expect(result_missing_contract_id.missingFields).toContain('contractId');
    expect(result_missing_contract_id.missingFields.length).toBe(1);
    expect(result_missing_contract_id.errorMessage).toMatch(/contractId/);

    // ケース2: 変更日が不足している場合
    const input_missing_change_date = {
      contractId: 'C001',
      changeDate: undefined,
      changeItem: '納期',
      changeValue: '2024-02-28',
      approver: '営業責任者'
    };

    const result_missing_change_date = validateContractChangeRequiredFields(
      input_missing_change_date
    );

    expect(result_missing_change_date.isValid).toBe(false);
    expect(result_missing_change_date.errorCode).toBe('VALIDATION_ERROR_MISSING_REQUIRED_FIELD');
    expect(result_missing_change_date.missingFields).toContain('changeDate');
    expect(result_missing_change_date.errorMessage).toMatch(/changeDate/);

    // ケース3: 変更項目が不足している場合
    const input_missing_change_item = {
      contractId: 'C001',
      changeDate: '2024-01-15',
      changeItem: undefined,
      changeValue: '2024-02-28',
      approver: '営業責任者'
    };

    const result_missing_change_item = validateContractChangeRequiredFields(
      input_missing_change_item
    );

    expect(result_missing_change_item.isValid).toBe(false);
    expect(result_missing_change_item.errorCode).toBe('VALIDATION_ERROR_MISSING_REQUIRED_FIELD');
    expect(result_missing_change_item.missingFields).toContain('changeItem');
    expect(result_missing_change_item.errorMessage).toMatch(/changeItem/);

    // ケース4: 変更値が不足している場合
    const input_missing_change_value = {
      contractId: 'C001',
      changeDate: '2024-01-15',
      changeItem: '納期',
      changeValue: undefined,
      approver: '営業責任者'
    };

    const result_missing_change_value = validateContractChangeRequiredFields(
      input_missing_change_value
    );

    expect(result_missing_change_value.isValid).toBe(false);
    expect(result_missing_change_value.errorCode).toBe('VALIDATION_ERROR_MISSING_REQUIRED_FIELD');
    expect(result_missing_change_value.missingFields).toContain('changeValue');
    expect(result_missing_change_value.errorMessage).toMatch(/changeValue/);

    // ケース5: 承認者が不足している場合
    const input_missing_approver = {
      contractId: 'C001',
      changeDate: '2024-01-15',
      changeItem: '納期',
      changeValue: '2024-02-28',
      approver: undefined
    };

    const result_missing_approver = validateContractChangeRequiredFields(
      input_missing_approver
    );

    expect(result_missing_approver.isValid).toBe(false);
    expect(result_missing_approver.errorCode).toBe('VALIDATION_ERROR_MISSING_REQUIRED_FIELD');
    expect(result_missing_approver.missingFields).toContain('approver');
    expect(result_missing_approver.errorMessage).toMatch(/approver/);

    // ケース6: 複数の必須項目が不足している場合
    const input_missing_multiple = {
      contractId: undefined,
      changeDate: undefined,
      changeItem: '納期',
      changeValue: undefined,
      approver: '営業責任者'
    };

    const result_missing_multiple = validateContractChangeRequiredFields(
      input_missing_multiple
    );

    expect(result_missing_multiple.isValid).toBe(false);
    expect(result_missing_multiple.errorCode).toBe('VALIDATION_ERROR_MISSING_REQUIRED_FIELD');
    expect(result_missing_multiple.missingFields.length).toBe(3);
    expect(result_missing_multiple.missingFields).toContain('contractId');
    expect(result_missing_multiple.missingFields).toContain('changeDate');
    expect(result_missing_multiple.missingFields).toContain('changeValue');
    expect(result_missing_multiple.errorMessage).toMatch(/contractId/);
    expect(result_missing_multiple.errorMessage).toMatch(/changeDate/);
    expect(result_missing_multiple.errorMessage).toMatch(/changeValue/);

    // ケース7: すべての必須項目が存在する場合（成功パス）
    const input_valid = {
      contractId: 'C001',
      changeDate: '2024-01-15',
      changeItem: '納期',
      changeValue: '2024-02-28',
      approver: '営業責任者'
    };

    const result_valid = validateContractChangeRequiredFields(input_valid);

    expect(result_valid.isValid).toBe(true);
    expect(result_valid.errorCode).toBeUndefined();
    expect(result_valid.missingFields).toEqual([]);
    expect(result_valid.errorMessage).toBeUndefined();
  });
});