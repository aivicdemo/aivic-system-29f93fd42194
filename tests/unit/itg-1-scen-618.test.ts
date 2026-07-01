import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { routeObjectionHandling } from '../../src/logic/it-1-1-1';

describe('異議対応ルート分岐 - 説明対応ルートの正常処理', () => {
  // SCEN-618
  test('説明対応を選択した場合、システムが正常に説明対応ルートに分岐し、対応画面が正常に表示され、対応履歴に選択内容が正確に記録されること', () => {
    const input_objection_id = 'obj_20240215_001';
    const input_objection_content = '請求額が前月比で50%増加しており、その根拠が不明確です。詳細な説明をお願いします。';
    const input_customer_id = 'cust_acme_corp';
    const input_handling_method = 'explanation';
    const input_handler_user_id = 'user_rep_001';
    const input_handler_timestamp = new Date('2024-02-15T10:30:00Z');

    const result = routeObjectionHandling({
      objection_id: input_objection_id,
      objection_content: input_objection_content,
      customer_id: input_customer_id,
      handling_method: input_handling_method,
      handler_user_id: input_handler_user_id,
      handler_timestamp: input_handler_timestamp,
    });

    expect(result).toBeDefined();
    expect(result.objection_id).toBe(input_objection_id);
    expect(result.customer_id).toBe(input_customer_id);
    expect(result.handling_method).toBe('explanation');
    expect(result.route_name).toBe('explanation_route');
    expect(result.route_status).toBe('active');
    expect(result.initial_screen_displayed).toBe(true);
    expect(result.initial_screen_name).toBe('explanation_detail_screen');

    expect(result.history_log).toBeDefined();
    expect(Array.isArray(result.history_log)).toBe(true);
    expect(result.history_log.length).toBeGreaterThan(0);

    const latest_log_entry = result.history_log[result.history_log.length - 1];
    expect(latest_log_entry).toBeDefined();
    expect(latest_log_entry.event_type).toBe('handling_method_selected');
    expect(latest_log_entry.handling_method_selected).toBe('explanation');
    expect(latest_log_entry.recorded_at).toEqual(input_handler_timestamp);
    expect(latest_log_entry.recorded_by_user_id).toBe(input_handler_user_id);
    expect(latest_log_entry.is_recorded_successfully).toBe(true);

    expect(result.next_action).toBe('proceed_to_explanation_screen');
    expect(result.is_processing_complete).toBe(true);
  });
});