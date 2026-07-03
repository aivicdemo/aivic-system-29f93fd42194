import { validateReportGenerationParameters } from '../../src/logic/it-1-2-1';

describe('営業成果データから請求対象項目を自動抽出し、顧客ごと・サービスごとの請求額を集計する機能', () => {
  // SCEN-657
  test('レポート生成パラメータ妥当性検証機能 - 契約条件に違反するパラメータが指定された場合、検証エラーが通知される', () => {
    const validContract = {
      contract_id: 'C001',
      customer_id: 'CUS001',
      service_id: 'SVC001',
      contract_start_date: '2024-01-01',
      contract_end_date: '2024-12-31',
      allowed_sales_divisions: ['SalesDiv_A', 'SalesDiv_B'],
      report_frequency: 'monthly',
    };

    const validParams = {
      report_start_date: '2024-01-01',
      report_end_date: '2024-01-31',
      target_customer_id: 'CUS001',
      sales_division: 'SalesDiv_A',
      include_discount: false,
    };

    const validationResult = validateReportGenerationParameters(
      validContract,
      validParams
    );
    expect(validationResult.is_valid).toBe(true);
    expect(validationResult.error_details).toEqual([]);

    // 契約期間外の開始日付を指定
    const invalidParamsOutOfRange = {
      report_start_date: '2023-12-15',
      report_end_date: '2024-01-31',
      target_customer_id: 'CUS001',
      sales_division: 'SalesDiv_A',
      include_discount: false,
    };

    const resultOutOfRange = validateReportGenerationParameters(
      validContract,
      invalidParamsOutOfRange
    );
    expect(resultOutOfRange.is_valid).toBe(false);
    expect(resultOutOfRange.error_details).toContainEqual(
      expect.objectContaining({
        error_code: 'REPORT_DATE_OUT_OF_CONTRACT_PERIOD',
        message: expect.stringMatching(/契約期間/),
        detail: expect.objectContaining({
          contract_start_date: '2024-01-01',
          contract_end_date: '2024-12-31',
          specified_start_date: '2023-12-15',
        }),
      })
    );

    // 許可されていない売上区分を指定
    const invalidParamsSalesDivision = {
      report_start_date: '2024-01-01',
      report_end_date: '2024-01-31',
      target_customer_id: 'CUS001',
      sales_division: 'SalesDiv_C',
      include_discount: false,
    };

    const resultSalesDivision = validateReportGenerationParameters(
      validContract,
      invalidParamsSalesDivision
    );
    expect(resultSalesDivision.is_valid).toBe(false);
    expect(resultSalesDivision.error_details).toContainEqual(
      expect.objectContaining({
        error_code: 'SALES_DIVISION_NOT_ALLOWED',
        message: expect.stringMatching(/売上区分/),
        detail: expect.objectContaining({
          specified_division: 'SalesDiv_C',
          allowed_divisions: ['SalesDiv_A', 'SalesDiv_B'],
        }),
      })
    );

    // 無効な顧客IDを指定
    const invalidParamsCustomerId = {
      report_start_date: '2024-01-01',
      report_end_date: '2024-01-31',
      target_customer_id: 'CUS999',
      sales_division: 'SalesDiv_A',
      include_discount: false,
    };

    const resultCustomerId = validateReportGenerationParameters(
      validContract,
      invalidParamsCustomerId
    );
    expect(resultCustomerId.is_valid).toBe(false);
    expect(resultCustomerId.error_details).toContainEqual(
      expect.objectContaining({
        error_code: 'CUSTOMER_ID_MISMATCH',
        message: expect.stringMatching(/顧客/),
        detail: expect.objectContaining({
          contract_customer_id: 'CUS001',
          specified_customer_id: 'CUS999',
        }),
      })
    );

    // 複数エラーを同時に検出する場合
    const invalidParamsMultiple = {
      report_start_date: '2023-11-01',
      report_end_date: '2024-02-28',
      target_customer_id: 'CUS999',
      sales_division: 'SalesDiv_D',
      include_discount: false,
    };

    const resultMultiple = validateReportGenerationParameters(
      validContract,
      invalidParamsMultiple
    );
    expect(resultMultiple.is_valid).toBe(false);
    expect(resultMultiple.error_details.length).toBeGreaterThanOrEqual(2);
    expect(resultMultiple.error_details).toContainEqual(
      expect.objectContaining({
        error_code: expect.stringMatching(/DATE_OUT_OF_CONTRACT_PERIOD|CUSTOMER_ID_MISMATCH|SALES_DIVISION_NOT_ALLOWED/),
      })
    );
  });
});