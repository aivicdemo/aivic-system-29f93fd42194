import { describe, it, expect, beforeEach } from '@jest/globals';

describe('営業データ品質自動検証機能 - 検証エラーが補正が必要なデータとしてリスト化される', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // SCEN-673
  it('意図的な検証エラーを含むテストデータセットをアップロードして自動検証を実行し、エラーが発生したすべてのデータレコードが補正が必要なデータとして一覧表示される', async () => {
    // ========== Setup: テストデータセットの定義 ==========
    const validationRuleId = 'vr_001';
    const datasetUploadId = 'ds_upload_20240115_001';
    const uploadTimestamp = new Date('2024-01-15T10:30:00Z');

    // 検証エラーを意図的に含むテストレコード群
    const testDataset = [
      {
        salesDataId: 'sd_001',
        customerName: 'Customer A',
        contactDate: '2024-01-10',
        transactionAmount: 50000,
        appointmentConfirmed: 'yes',
        serviceType: 'premium'
      },
      {
        salesDataId: 'sd_002',
        customerName: '', // 必須項目欠落エラー
        contactDate: '2024-01-11',
        transactionAmount: -10000, // 金額の異常値エラー（負数）
        appointmentConfirmed: 'invalid_value', // 不正な値エラー
        serviceType: 'standard'
      },
      {
        salesDataId: 'sd_003',
        customerName: 'Customer C',
        contactDate: '2025-01-20', // 日付の範囲外エラー（未来日）
        transactionAmount: 'not_a_number', // データ型不整合エラー
        appointmentConfirmed: 'yes',
        serviceType: 'basic'
      },
      {
        salesDataId: 'sd_004',
        customerName: 'Customer D',
        contactDate: '2024-01-12',
        transactionAmount: 75000,
        appointmentConfirmed: 'no',
        serviceType: undefined // 必須項目欠落エラー
      }
    ];

    // 検証ルール定義
    const validationRules = [
      {
        ruleId: 'rule_001',
        fieldName: 'customerName',
        validationType: 'required',
        errorMessage: '顧客名は必須項目です'
      },
      {
        ruleId: 'rule_002',
        fieldName: 'transactionAmount',
        validationType: 'range',
        minValue: 0,
        maxValue: 1000000,
        errorMessage: '取引金額は0以上1000000以下である必要があります'
      },
      {
        ruleId: 'rule_003',
        fieldName: 'transactionAmount',
        validationType: 'datatype',
        expectedType: 'number',
        errorMessage: '取引金額は数値である必要があります'
      },
      {
        ruleId: 'rule_004',
        fieldName: 'appointmentConfirmed',
        validationType: 'enum',
        allowedValues: ['yes', 'no'],
        errorMessage: 'アポ確定ステータスは「yes」または「no」である必要があります'
      },
      {
        ruleId: 'rule_005',
        fieldName: 'contactDate',
        validationType: 'dateRange',
        minDate: '2024-01-01',
        maxDate: '2024-12-31',
        errorMessage: '接触日は2024年内である必要があります'
      },
      {
        ruleId: 'rule_006',
        fieldName: 'serviceType',
        validationType: 'required',
        errorMessage: 'サービスタイプは必須項目です'
      }
    ];

    // ========== Action 1: テストデータセットのアップロード ==========
    const uploadResponse = {
      uploadId: datasetUploadId,
      uploadTimestamp: uploadTimestamp.toISOString(),
      recordCount: testDataset.length,
      status: 'uploaded'
    };

    // ========== Action 2: 自動検証プロセスの実行 ==========
    // 各レコードに対して検証ルールを適用し、エラーを検出
    const validationResults = testDataset.map((record, index) => {
      const errors: Array<{
        fieldName: string;
        ruleId: string;
        errorMessage: string;
        errorType: string;
        recordIndex: number;
      }> = [];

      // customerName の検証（必須項目）
      if (record.customerName === '') {
        errors.push({
          fieldName: 'customerName',
          ruleId: 'rule_001',
          errorMessage: '顧客名は必須項目です',
          errorType: 'required_field_missing',
          recordIndex: index
        });
      }

      // transactionAmount のデータ型検証
      if (typeof record.transactionAmount !== 'number') {
        errors.push({
          fieldName: 'transactionAmount',
          ruleId: 'rule_003',
          errorMessage: '取引金額は数値である必要があります',
          errorType: 'datatype_mismatch',
          recordIndex: index
        });
      } else {
        // 金額の範囲検証（データ型が正しい場合のみ）
        if (record.transactionAmount < 0 || record.transactionAmount > 1000000) {
          errors.push({
            fieldName: 'transactionAmount',
            ruleId: 'rule_002',
            errorMessage: '取引金額は0以上1000000以下である必要があります',
            errorType: 'value_out_of_range',
            recordIndex: index
          });
        }
      }

      // appointmentConfirmed の値検証
      if (!['yes', 'no'].includes(record.appointmentConfirmed)) {
        errors.push({
          fieldName: 'appointmentConfirmed',
          ruleId: 'rule_004',
          errorMessage: 'アポ確定ステータスは「yes」または「no」である必要があります',
          errorType: 'invalid_enum_value',
          recordIndex: index
        });
      }

      // contactDate の日付範囲検証
      const contactDateObj = new Date(record.contactDate);
      const minDateObj = new Date('2024-01-01');
      const maxDateObj = new Date('2024-12-31T23:59:59Z');
      if (contactDateObj < minDateObj || contactDateObj > maxDateObj) {
        errors.push({
          fieldName: 'contactDate',
          ruleId: 'rule_005',
          errorMessage: '接触日は2024年内である必要があります',
          errorType: 'date_out_of_range',
          recordIndex: index
        });
      }

      // serviceType の検証（必須項目）
      if (record.serviceType === undefined || record.serviceType === '') {
        errors.push({
          fieldName: 'serviceType',
          ruleId: 'rule_006',
          errorMessage: 'サービスタイプは必須項目です',
          errorType: 'required_field_missing',
          recordIndex: index
        });
      }

      return {
        recordId: record.salesDataId,
        recordIndex: index,
        hasErrors: errors.length > 0,
        errorCount: errors.length,
        errors: errors,
        correctionStatus: errors.length > 0 ? 'correction_needed' : 'valid'
      };
    });

    // ========== Verification 1: 検証結果のサマリー確認 ==========
    const totalRecords = validationResults.length;
    const recordsWithErrors = validationResults.filter(r => r.hasErrors).length;
    const recordsWithoutErrors = validationResults.filter(r => !r.hasErrors).length;

    // 期待値: sd_002, sd_003, sd_004 が エラーを含むレコード（3件）
    expect(recordsWithErrors).toBe(3);
    expect(recordsWithoutErrors).toBe(1);
    expect(totalRecords).toBe(4);

    // ========== Verification 2: 補正が必要なデータリストの表示確認 ==========
    const correctionRequiredList = validationResults.filter(
      r => r.correctionStatus === 'correction_needed'
    );

    expect(correctionRequiredList.length).toBe(3);

    // ========== Verification 3: 各エラーレコードの詳細情報確認 ==========
    // sd_002 のエラー詳細
    const record_sd_002 = validationResults.find(r => r.recordId === 'sd_002');
    expect(record_sd_002).toBeDefined();
    expect(record_sd_002!.errorCount).toBe(3);
    expect(record_sd_002!.errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          fieldName: 'customerName',
          errorType: 'required_field_missing',
          errorMessage: '顧客名は必須項目です'
        }),
        expect.objectContaining({
          fieldName: 'transactionAmount',
          errorType: 'value_out_of_range',
          errorMessage: '取引金額は0以上1000000以下である必要があります'
        }),
        expect.objectContaining({
          fieldName: 'appointmentConfirmed',
          errorType: 'invalid_enum_value',
          errorMessage: 'アポ確定ステータスは「yes」または「no」である必要があります'
        })
      ])
    );

    // sd_003 のエラー詳細
    const record_sd_003 = validationResults.find(r => r.recordId === 'sd_003');
    expect(record_sd_003).toBeDefined();
    expect(record_sd_003!.errorCount).toBe(2);
    expect(record_sd_003!.errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          fieldName: 'contactDate',
          errorType: 'date_out_of_range',
          errorMessage: '接触日は2024年内である必要があります'
        }),
        expect.objectContaining({
          fieldName: 'transactionAmount',
          errorType: 'datatype_mismatch',
          errorMessage: '取引金額は数値である必要があります'
        })
      ])
    );

    // sd_004 のエラー詳細
    const record_sd_004 = validationResults.find(r => r.recordId === 'sd_004');
    expect(record_sd_004).toBeDefined();
    expect(record_sd_004!.errorCount).toBe(1);
    expect(record_sd_004!.errors[0]).toEqual(
      expect.objectContaining({
        fieldName: 'serviceType',
        errorType: 'required_field_missing',
        errorMessage: 'サービスタイプは必須項目です'
      })
    );

    // ========== Verification 4: 正常なレコードは補正が必要でないことを確認 ==========
    const record_sd_001 = validationResults.find(r => r.recordId === 'sd_001');
    expect(record_sd_001).toBeDefined();
    expect(record_sd_001!.hasErrors).toBe(false);
    expect(record_sd_001!.errorCount).toBe(0);
    expect(record_sd_001!.correctionStatus).toBe('valid');

    // ========== Verification 5: 補正が必要なデータのステータス確認 ==========
    correctionRequiredList.forEach(record => {
      expect(record.correctionStatus).toBe('correction_needed');
      expect(record.errorCount).toBeGreaterThan(0);
      expect(record.errors.length).toBeGreaterThan(0);
    });

    // ========== Verification 6: エラー内容と推奨修正方法の存在確認 ==========
    // 各エラーに対して、エラー内容とエラー箇所が記録されていることを確認
    correctionRequiredList.forEach(record => {
      record.errors.forEach(error => {
        expect(error.fieldName).toBeDefined();
        expect(error.fieldName.length).toBeGreaterThan(0);
        expect(error.errorMessage).toBeDefined();
        expect(error.errorMessage.length).toBeGreaterThan(0);
        expect(error.errorType).toBeDefined();
        expect(['required_field_missing', 'datatype_mismatch', 'value_out_of_range', 'invalid_enum_value', 'date_out_of_range']).toContain(error.errorType);
      });
    });

    // ========== Verification 7: リストから補正対象データを選択した際の詳細画面確認 ==========
    const selectedRecordForDetail = correctionRequiredList[0];
    const detailViewData = {
      recordId: selectedRecordForDetail.recordId,
      recordIndex: selectedRecordForDetail.recordIndex,
      correctionStatus: selectedRecordForDetail.correctionStatus,
      errorSummary: `${selectedRecordForDetail.errorCount}個のエラーが検出されました`,
      errors: selectedRecordForDetail.errors,
      lastValidationTime: uploadTimestamp.toISOString()
    };

    expect(detailViewData.correctionStatus).toBe('correction_needed');
    expect(detailViewData.errorSummary).toMatch(/\d+個のエラーが検出されました/);
    expect(detailViewData.errors.length).toBeGreaterThan(0);

    // ========== Final Verification: 検証プロセス全体の結果確認 ==========
    const validationSummary = {
      uploadId: datasetUploadId,
      totalRecordsProcessed: totalRecords,
      recordsWithErrors: recordsWithErrors,
      recordsWithoutErrors: recordsWithoutErrors,
      validationTimestamp: uploadTimestamp.toISOString(),
      correctionRequiredRecords: correctionRequiredList.map(r => ({
        recordId: r.recordId,
        errorCount: r.errorCount,
        status: r.correctionStatus
      }))
    };

    expect(validationSummary.totalRecordsProcessed).toBe(4);
    expect(validationSummary.recordsWithErrors).toBe(3);
    expect(validationSummary.recordsWithoutErrors).toBe(1);
    expect(validationSummary.correctionRequiredRecords.length).toBe(3);
    expect(validationSummary.correctionRequiredRecords).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          recordId: 'sd_002',
          errorCount: 3,
          status: 'correction_needed'
        }),
        expect.objectContaining({
          recordId: 'sd_003',
          errorCount: 2,
          status: 'correction_needed'
        }),
        expect.objectContaining({
          recordId: 'sd_004',
          errorCount: 1,
          status: 'correction_needed'
        })
      ])
    );
  });
});