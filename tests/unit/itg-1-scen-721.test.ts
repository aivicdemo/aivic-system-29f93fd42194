import { validateSalesDataQuality } from '../../src/logic/it-1781935279444-2-1-1';

describe('営業データ品質基準チェック・承認機能', () => {
  // SCEN-721: [error] 営業データ品質基準チェック・承認機能 - 修正済みデータが複数の品質基準に違反し、承認が拒否される
  test('複数の品質基準違反を含むデータの承認が拒否され、詳細な違反リストが返却される', () => {
    const correctedData = {
      customerId: '',
      contactDate: '2024-13-45',
      dealAmount: -50000,
      status: 'INVALID_STATUS',
      appointmentConfirmed: 'YES',
      serviceType: 'UNKNOWN_SERVICE',
      notes: '',
    };

    const result = validateSalesDataQuality(correctedData);

    expect(result.approved).toBe(false);
    expect(result.violations).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          field: 'customerId',
          code: 'REQUIRED_FIELD_EMPTY',
          message: '顧客ID',
        }),
        expect.objectContaining({
          field: 'contactDate',
          code: 'DATE_FORMAT_INVALID',
          message: '接触日時',
        }),
        expect.objectContaining({
          field: 'dealAmount',
          code: 'AMOUNT_OUT_OF_RANGE',
          message: '金額',
        }),
        expect.objectContaining({
          field: 'status',
          code: 'INVALID_ENUM_VALUE',
          message: 'ステータス',
        }),
        expect.objectContaining({
          field: 'serviceType',
          code: 'INVALID_ENUM_VALUE',
          message: 'サービス種別',
        }),
      ])
    );
    expect(result.violations.length).toBeGreaterThanOrEqual(5);
    expect(result.dataStatus).toBe('UNAPPROVED');
  });
});