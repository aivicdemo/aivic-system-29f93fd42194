import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';

describe('月次サマリーテンプレートの定義・管理機能', () => {
  test('SCEN-861: 契約変更検証レポートの自動生成機能 - 必須項目不足時にエラーが発生する', async () => {
    const fetchMock = require('jest-fetch-mock');
    fetchMock.enableMocks();
    fetchMock.resetMocks();

    const { generateContractChangeValidationReport } = await import(
      '../../src/logic/it-1-br-1781935279444-1-2-1'
    );

    // ハッピーパス: 必須項目すべて入力
    const validInput = {
      contract_id: 'CTR-2024-001',
      customer_name: 'テスト顧客A',
      change_details: '契約期間を延長する',
      change_date: '2024-02-01',
    };

    const validResult = await generateContractChangeValidationReport(validInput);
    expect(validResult).toHaveProperty('report_id');
    expect(validResult.status).toBe('success');
    expect(validResult.report_file_path).toBeDefined();

    // エラーケース1: 契約IDが空文字
    const noContractIdInput = {
      contract_id: '',
      customer_name: 'テスト顧客A',
      change_details: '契約期間を延長する',
      change_date: '2024-02-01',
    };

    expect(() =>
      generateContractChangeValidationReport(noContractIdInput)
    ).toThrow(/契約ID/);

    // エラーケース2: 顧客名が未入力
    const noCustomerNameInput = {
      contract_id: 'CTR-2024-001',
      customer_name: '',
      change_details: '契約期間を延長する',
      change_date: '2024-02-01',
    };

    expect(() =>
      generateContractChangeValidationReport(noCustomerNameInput)
    ).toThrow(/顧客名/);

    // エラーケース3: 変更内容詳細が空文字
    const noChangeDetailsInput = {
      contract_id: 'CTR-2024-001',
      customer_name: 'テスト顧客A',
      change_details: '',
      change_date: '2024-02-01',
    };

    expect(() =>
      generateContractChangeValidationReport(noChangeDetailsInput)
    ).toThrow(/変更内容/);

    // エラーケース4: 複数の必須項目が不足している場合
    const multipleFieldsMissingInput = {
      contract_id: '',
      customer_name: '',
      change_details: '',
      change_date: '2024-02-01',
    };

    expect(() =>
      generateContractChangeValidationReport(multipleFieldsMissingInput)
    ).toThrow(/契約ID/);

    // エラーケース5: 契約IDがnull
    const nullContractIdInput = {
      contract_id: null,
      customer_name: 'テスト顧客A',
      change_details: '契約期間を延長する',
      change_date: '2024-02-01',
    } as any;

    expect(() =>
      generateContractChangeValidationReport(nullContractIdInput)
    ).toThrow(/契約ID/);

    // エラーケース6: 顧客名がundefined
    const undefinedCustomerNameInput = {
      contract_id: 'CTR-2024-001',
      customer_name: undefined,
      change_details: '契約期間を延長する',
      change_date: '2024-02-01',
    } as any;

    expect(() =>
      generateContractChangeValidationReport(undefinedCustomerNameInput)
    ).toThrow(/顧客名/);

    fetchMock.disableMocks();
  });
});