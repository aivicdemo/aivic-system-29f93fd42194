import { describe, it, expect, beforeEach } from '@jest/globals';
import {
  validateSalesDataCompleteness,
  validateSalesDataAccuracy,
  executeSalesDataQualityValidation,
  generateValidationResultReport,
} from '../../src/logic/it-1781935279444-2-2-1';

describe('月次営業データ品質検証機能 - 営業データの完全性・正確性自動検証', () => {
  // SCEN-1310
  it('営業データが完全性・正確性の基準を満たす場合、検証完了と判定される', () => {
    // 前提: 営業システムに当月の営業活動データが記録されている
    // 発生条件: 月次締め日に営業データの検証処理を実行する
    // 期待結果: 営業データの全項目が検証基準を満たし、システムが『検証完了』と判定される

    const test_sales_data = {
      record_id: 'SLS-2024-01-001',
      customer_id: 'CUST-001',
      customer_name: '株式会社テスト',
      contact_date: '2024-01-15',
      contact_time: '10:30',
      service_type: '営業代行サービス',
      appointment_count: 5,
      contract_count: 2,
      customer_response: '前向き',
      sales_amount: 150000,
      remarks: 'フォローアップ予定',
      input_date: '2024-01-15',
      input_user_id: 'USER-001',
    };

    // Step 1: 営業データの完全性を検証
    // 必須項目: record_id, customer_id, customer_name, contact_date, contact_time, 
    //           service_type, appointment_count, contract_count, customer_response, sales_amount
    const completeness_check = validateSalesDataCompleteness(test_sales_data);
    expect(completeness_check.is_complete).toBe(true);
    expect(completeness_check.missing_fields).toEqual([]);
    expect(completeness_check.completeness_percentage).toBe(100);

    // Step 2: 営業データの正確性を検証
    // データ型チェック: appointment_count と contract_count は整数、sales_amount は数値
    // 値の範囲チェック: appointment_count >= 0, contract_count >= 0, sales_amount >= 0
    // 矛盾チェック: contract_count <= appointment_count
    const accuracy_check = validateSalesDataAccuracy(test_sales_data);
    expect(accuracy_check.is_accurate).toBe(true);
    expect(accuracy_check.data_type_errors).toEqual([]);
    expect(accuracy_check.range_errors).toEqual([]);
    expect(accuracy_check.contradiction_errors).toEqual([]);

    // Step 3: 月次営業データ品質検証プロセス全体を実行
    // 検証対象: 必須項目の完全性、データ型の正確性、値の範囲、矛盾
    const validation_result = executeSalesDataQualityValidation([test_sales_data]);
    expect(validation_result.validation_status).toBe('完了');
    expect(validation_result.total_records).toBe(1);
    expect(validation_result.passed_records).toBe(1);
    expect(validation_result.failed_records).toBe(0);
    expect(validation_result.overall_judgment).toBe('合格');

    // Step 4: 検証結果レポートを生成
    // レポート内容: 合格ステータス、検証項目ごとの結果、検証完了日時
    const report = generateValidationResultReport(validation_result);
    expect(report.report_status).toBe('検証完了');
    expect(report.judgment).toBe('合格');
    expect(report.validation_items_passed).toBe(4); // 完全性、データ型、範囲、矛盾
    expect(report.validation_items_failed).toBe(0);
    expect(report.pass_percentage).toBe(100);
    expect(report.data_quality_confirmed).toBe(true);

    // Step 5: 検証結果の詳細確認
    expect(report.details).toEqual({
      completeness: { status: '合格', message: '全必須項目が入力されています' },
      data_type: { status: '合格', message: 'データ型が正確です' },
      range_validation: { status: '合格', message: '値の範囲が正確です' },
      contradiction_check: { status: '合格', message: '矛盾がありません' },
    });
  });
});