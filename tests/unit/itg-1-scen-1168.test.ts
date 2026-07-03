import { describe, test, expect, beforeEach } from '@jest/globals';
import {
  validateReportAccuracy,
} from '../../src/logic/it-1781935279444-2-2-1';

describe('営業データ品質検証 - レポート数値とソースデータの照合', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // SCEN-1168: レポート数値とソースデータの照合機能 - 完全一致判定
  test('should verify report values match source data completely when all numeric items are identical', () => {
    // Arrange: ソースデータを準備
    const source_data = {
      sales_amount: 1500000,
      transaction_count: 25,
      customer_count: 8,
      average_deal_size: 60000,
      appointment_count: 45,
      contract_count: 12,
    };

    // Arrange: レポート生成されたデータ
    const generated_report = {
      sales_amount: 1500000,
      transaction_count: 25,
      customer_count: 8,
      average_deal_size: 60000,
      appointment_count: 45,
      contract_count: 12,
    };

    // Act: レポート値とソースデータを照合
    const verification_result = validateReportAccuracy({
      source_data: source_data,
      report_data: generated_report,
    });

    // Assert: 全ての数値項目が完全一致
    expect(verification_result.is_complete_match).toBe(true);
    expect(verification_result.match_percentage).toBe(100);
    expect(verification_result.mismatched_items).toEqual([]);
    expect(verification_result.validation_status).toBe('PASS');
  });
});