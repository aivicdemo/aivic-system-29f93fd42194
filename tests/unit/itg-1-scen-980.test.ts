import { describe, test, expect } from '@jest/globals';
import { validateInvoiceForMissingRequiredFields } from '../../src/logic/it-1781935279444-2-1-1';

describe('営業データ入力時の品質検証ルール定義・実行機能', () => {
  test('SCEN-980: 請求書に必須項目が不足している場合、修正要件が自動検出される', () => {
    // ハッピーパス: 必須項目が不足した請求書データを入力
    const incompleteInvoice = {
      invoiceNumber: 'INV-2024-001',
      // invoiceDate: 欠落
      invoiceSource: '営業代行企業A',
      // invoiceTo: 欠落
      totalAmount: 150000,
      // description: 欠落
      dueDate: '2024-02-15',
      paymentTerms: 'NET30'
    };

    const result = validateInvoiceForMissingRequiredFields(incompleteInvoice);

    // 修正要件が配列として返されることを確認
    expect(Array.isArray(result.correctionRequirements)).toBe(true);

    // 修正要件に不足している全ての必須項目が列挙されていることを確認
    expect(result.correctionRequirements.length).toBe(3);

    const missingFieldNames = result.correctionRequirements.map(
      (req: { fieldName: string }) => req.fieldName
    );
    expect(missingFieldNames).toContain('invoiceDate');
    expect(missingFieldNames).toContain('invoiceTo');
    expect(missingFieldNames).toContain('description');

    // 各修正要件に項目名、エラーコード、エラーメッセージが含まれていることを確認
    result.correctionRequirements.forEach(
      (req: { fieldName: string; errorCode: string; errorMessage: string }) => {
        expect(typeof req.fieldName).toBe('string');
        expect(req.fieldName.length).toBeGreaterThan(0);
        expect(typeof req.errorCode).toBe('string');
        expect(req.errorCode.match(/^ERR_/)).toBeTruthy();
        expect(typeof req.errorMessage).toBe('string');
        expect(req.errorMessage.length).toBeGreaterThan(0);
      }
    );

    // 修正要件の形式がスキーマに準拠していることを検証
    expect(result.validationPassed).toBe(false);
    expect(result.correctionRequirements[0]).toHaveProperty('fieldName');
    expect(result.correctionRequirements[0]).toHaveProperty('errorCode');
    expect(result.correctionRequirements[0]).toHaveProperty('errorMessage');

    // 不足している項目の具体的なエラーコードを確認
    const invoiceDateError = result.correctionRequirements.find(
      (req: { fieldName: string }) => req.fieldName === 'invoiceDate'
    );
    expect(invoiceDateError.errorCode).toBe('ERR_MISSING_INVOICE_DATE');

    const invoiceToError = result.correctionRequirements.find(
      (req: { fieldName: string }) => req.fieldName === 'invoiceTo'
    );
    expect(invoiceToError.errorCode).toBe('ERR_MISSING_INVOICE_TO');

    const descriptionError = result.correctionRequirements.find(
      (req: { fieldName: string }) => req.fieldName === 'description'
    );
    expect(descriptionError.errorCode).toBe('ERR_MISSING_DESCRIPTION');

    // エラーメッセージが業務的に理解可能であることを確認
    expect(invoiceDateError.errorMessage).toMatch(/請求日/);
    expect(invoiceToError.errorMessage).toMatch(/請求先/);
    expect(descriptionError.errorMessage).toMatch(/摘要/);
  });
});