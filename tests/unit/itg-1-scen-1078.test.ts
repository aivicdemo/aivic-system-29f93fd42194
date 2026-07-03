import { describe, test, expect } from '@jest/globals';
import { validateContractRegistration } from '../../src/logic/it-1781935279444-2-1-1';

describe('契約書登録内容検証機能', () => {
  // SCEN-1078: [normal] 契約書登録内容検証機能 - 契約書の登録内容・バージョン管理・顧客情報がすべてチェックリスト基準を満たす場合に合格判定される
  test('すべての必須項目が入力されている場合、合格判定が返される', () => {
    const contractData = {
      contractNumber: 'CT20240115001',
      contractName: '営業代行サービス契約',
      contractDate: '2024-01-15',
      versionNumber: '1.0',
      updatedAt: '2024-01-15T10:30:00Z',
      changeContent: '初版作成',
      customerName: '株式会社ABC',
      customerId: 'CUST001',
      customerAddress: '東京都渋谷区1-1-1',
      contactPhone: '03-XXXX-XXXX',
      contactEmail: 'contact@example.com',
    };

    const result = validateContractRegistration(contractData);

    expect(result).toEqual({
      status: 'PASS',
      message: '契約書登録内容がすべてのチェックリスト基準を満たしています',
      validationDetails: {
        basicInfo: {
          contractNumber: true,
          contractName: true,
          contractDate: true,
        },
        versionInfo: {
          versionNumber: true,
          updatedAt: true,
          changeContent: true,
        },
        customerInfo: {
          customerName: true,
          customerId: true,
          customerAddress: true,
          contactPhone: true,
          contactEmail: true,
        },
      },
      isRegistrationAllowed: true,
    });
  });

  test('契約番号が未入力の場合、不合格判定が返される', () => {
    const contractData = {
      contractNumber: '',
      contractName: '営業代行サービス契約',
      contractDate: '2024-01-15',
      versionNumber: '1.0',
      updatedAt: '2024-01-15T10:30:00Z',
      changeContent: '初版作成',
      customerName: '株式会社ABC',
      customerId: 'CUST001',
      customerAddress: '東京都渋谷区1-1-1',
      contactPhone: '03-XXXX-XXXX',
      contactEmail: 'contact@example.com',
    };

    const result = validateContractRegistration(contractData);

    expect(result.status).toBe('FAIL');
    expect(result.validationDetails.basicInfo.contractNumber).toBe(false);
    expect(result.isRegistrationAllowed).toBe(false);
  });

  test('バージョン情報が不完全な場合、不合格判定が返される', () => {
    const contractData = {
      contractNumber: 'CT20240115001',
      contractName: '営業代行サービス契約',
      contractDate: '2024-01-15',
      versionNumber: '',
      updatedAt: '2024-01-15T10:30:00Z',
      changeContent: '初版作成',
      customerName: '株式会社ABC',
      customerId: 'CUST001',
      customerAddress: '東京都渋谷区1-1-1',
      contactPhone: '03-XXXX-XXXX',
      contactEmail: 'contact@example.com',
    };

    const result = validateContractRegistration(contractData);

    expect(result.status).toBe('FAIL');
    expect(result.validationDetails.versionInfo.versionNumber).toBe(false);
    expect(result.isRegistrationAllowed).toBe(false);
  });

  test('顧客情報が不完全な場合、不合格判定が返される', () => {
    const contractData = {
      contractNumber: 'CT20240115001',
      contractName: '営業代行サービス契約',
      contractDate: '2024-01-15',
      versionNumber: '1.0',
      updatedAt: '2024-01-15T10:30:00Z',
      changeContent: '初版作成',
      customerName: '',
      customerId: 'CUST001',
      customerAddress: '東京都渋谷区1-1-1',
      contactPhone: '03-XXXX-XXXX',
      contactEmail: 'contact@example.com',
    };

    const result = validateContractRegistration(contractData);

    expect(result.status).toBe('FAIL');
    expect(result.validationDetails.customerInfo.customerName).toBe(false);
    expect(result.isRegistrationAllowed).toBe(false);
  });

  test('複数の項目が未入力の場合、全て不合格として記録される', () => {
    const contractData = {
      contractNumber: '',
      contractName: '営業代行サービス契約',
      contractDate: '',
      versionNumber: '',
      updatedAt: '2024-01-15T10:30:00Z',
      changeContent: '',
      customerName: '',
      customerId: '',
      customerAddress: '東京都渋谷区1-1-1',
      contactPhone: '03-XXXX-XXXX',
      contactEmail: 'contact@example.com',
    };

    const result = validateContractRegistration(contractData);

    expect(result.status).toBe('FAIL');
    expect(result.validationDetails.basicInfo.contractNumber).toBe(false);
    expect(result.validationDetails.basicInfo.contractDate).toBe(false);
    expect(result.validationDetails.versionInfo.versionNumber).toBe(false);
    expect(result.validationDetails.versionInfo.changeContent).toBe(false);
    expect(result.validationDetails.customerInfo.customerName).toBe(false);
    expect(result.validationDetails.customerInfo.customerId).toBe(false);
    expect(result.isRegistrationAllowed).toBe(false);
  });

  test('連絡先メールアドレスの形式が不正な場合、不合格判定が返される', () => {
    const contractData = {
      contractNumber: 'CT20240115001',
      contractName: '営業代行サービス契約',
      contractDate: '2024-01-15',
      versionNumber: '1.0',
      updatedAt: '2024-01-15T10:30:00Z',
      changeContent: '初版作成',
      customerName: '株式会社ABC',
      customerId: 'CUST001',
      customerAddress: '東京都渋谷区1-1-1',
      contactPhone: '03-XXXX-XXXX',
      contactEmail: 'invalid-email',
    };

    const result = validateContractRegistration(contractData);

    expect(result.status).toBe('FAIL');
    expect(result.validationDetails.customerInfo.contactEmail).toBe(false);
    expect(result.isRegistrationAllowed).toBe(false);
  });

  test('契約日が将来日の場合、エラースローが発生する', () => {
    const contractData = {
      contractNumber: 'CT20240115001',
      contractName: '営業代行サービス契約',
      contractDate: '2099-12-31',
      versionNumber: '1.0',
      updatedAt: '2024-01-15T10:30:00Z',
      changeContent: '初版作成',
      customerName: '株式会社ABC',
      customerId: 'CUST001',
      customerAddress: '東京都渋谷区1-1-1',
      contactPhone: '03-XXXX-XXXX',
      contactEmail: 'contact@example.com',
    };

    expect(() => {
      validateContractRegistration(contractData);
    }).toThrow(/契約日/);
  });

  test('更新日時がISO8601形式でない場合、エラースローが発生する', () => {
    const contractData = {
      contractNumber: 'CT20240115001',
      contractName: '営業代行サービス契約',
      contractDate: '2024-01-15',
      versionNumber: '1.0',
      updatedAt: '2024/01/15 10:30:00',
      changeContent: '初版作成',
      customerName: '株式会社ABC',
      customerId: 'CUST001',
      customerAddress: '東京都渋谷区1-1-1',
      contactPhone: '03-XXXX-XXXX',
      contactEmail: 'contact@example.com',
    };

    expect(() => {
      validateContractRegistration(contractData);
    }).toThrow(/更新日時/);
  });

  test('契約番号が重複する場合、エラースローが発生する', () => {
    const contractData = {
      contractNumber: 'CT20240115001',
      contractName: '営業代行サービス契約',
      contractDate: '2024-01-15',
      versionNumber: '1.0',
      updatedAt: '2024-01-15T10:30:00Z',
      changeContent: '初版作成',
      customerName: '株式会社ABC',
      customerId: 'CUST001',
      customerAddress: '東京都渋谷区1-1-1',
      contactPhone: '03-XXXX-XXXX',
      contactEmail: 'contact@example.com',
      isDuplicate: true,
    };

    expect(() => {
      validateContractRegistration(contractData);
    }).toThrow(/重複/);
  });
});