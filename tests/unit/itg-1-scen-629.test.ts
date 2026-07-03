import { submitObjection, routeObjectionByType, notifyDepartment, trackObjectionProgress } from '../../src/logic/it-1-1-1';

describe('営業成果データの自動検証ルール定義と異常検出機能', () => {
  // SCEN-629: [normal] 異議申し立て・対応ルート分岐 - 複数の異議が同時に申し立てられた場合、異議内容ごとに対応ルートが正しく分岐される
  test('複数の異議を同時に申し立てた場合、異議内容ごとに対応ルートが自動分岐される', () => {
    const user_id = 'customer_001';
    const contract_id = 'contract_001';
    const objection_submission_time = new Date('2024-01-15T10:30:00Z');

    // 複数の異議を同時に申し立てる
    const objection_billing_amount = {
      objection_type: 'billing_amount',
      objection_content: '請求金額が契約内容と異なる',
      objection_reason: '契約書では基本料金5万円のはずだが、請求額は7万円になっている',
      user_id,
      contract_id,
      submission_time: objection_submission_time,
    };

    const objection_billing_date = {
      objection_type: 'billing_date',
      objection_content: '請求日が予定と異なる',
      objection_reason: '月末締めの予定だったが、月中に請求が来ている',
      user_id,
      contract_id,
      submission_time: objection_submission_time,
    };

    const objection_product_content = {
      objection_type: 'product_content',
      objection_content: '商品内容が提案資料と異なる',
      objection_reason: 'サービスA付属のはずだが請求に含まれていない',
      user_id,
      contract_id,
      submission_time: objection_submission_time,
    };

    // 異議を申し立てる
    const result_billing_amount = submitObjection(objection_billing_amount);
    const result_billing_date = submitObjection(objection_billing_date);
    const result_product_content = submitObjection(objection_product_content);

    // すべての異議が正常に登録されたことを確認
    expect(result_billing_amount).toHaveProperty('objection_id');
    expect(result_billing_amount.status).toBe('submitted');
    expect(result_billing_date).toHaveProperty('objection_id');
    expect(result_billing_date.status).toBe('submitted');
    expect(result_product_content).toHaveProperty('objection_id');
    expect(result_product_content.status).toBe('submitted');

    // 異議内容ごとに対応ルートが正しく分岐される
    const route_billing_amount = routeObjectionByType(result_billing_amount.objection_id, 'billing_amount');
    const route_billing_date = routeObjectionByType(result_billing_date.objection_id, 'billing_date');
    const route_product_content = routeObjectionByType(result_product_content.objection_id, 'product_content');

    // 請求金額の異議が「財務部門対応ルート」に振り分けられていることを確認
    expect(route_billing_amount.assigned_department).toBe('finance');
    expect(route_billing_amount.assigned_route).toBe('financial_review');
    expect(route_billing_amount.priority).toBe('high');

    // 請求日の異議が「事務部門対応ルート」に振り分けられていることを確認
    expect(route_billing_date.assigned_department).toBe('admin');
    expect(route_billing_date.assigned_route).toBe('administrative_check');
    expect(route_billing_date.priority).toBe('medium');

    // 商品内容の異議が「営業部門対応ルート」に振り分けられていることを確認
    expect(route_product_content.assigned_department).toBe('sales');
    expect(route_product_content.assigned_route).toBe('sales_verification');
    expect(route_product_content.priority).toBe('high');

    // 各対応ルートの担当者に通知が送信されていることを確認
    const notification_finance = notifyDepartment({
      objection_id: result_billing_amount.objection_id,
      department: 'finance',
      objection_type: 'billing_amount',
      notification_time: new Date('2024-01-15T10:30:30Z'),
    });
    expect(notification_finance.notification_sent).toBe(true);
    expect(notification_finance.recipient_department).toBe('finance');
    expect(notification_finance.notification_count).toBe(1);

    const notification_admin = notifyDepartment({
      objection_id: result_billing_date.objection_id,
      department: 'admin',
      objection_type: 'billing_date',
      notification_time: new Date('2024-01-15T10:30:30Z'),
    });
    expect(notification_admin.notification_sent).toBe(true);
    expect(notification_admin.recipient_department).toBe('admin');
    expect(notification_admin.notification_count).toBe(1);

    const notification_sales = notifyDepartment({
      objection_id: result_product_content.objection_id,
      department: 'sales',
      objection_type: 'product_content',
      notification_time: new Date('2024-01-15T10:30:30Z'),
    });
    expect(notification_sales.notification_sent).toBe(true);
    expect(notification_sales.recipient_department).toBe('sales');
    expect(notification_sales.notification_count).toBe(1);

    // 各異議の対応状況がそれぞれ独立して進行していることを確認
    const progress_billing_amount = trackObjectionProgress(result_billing_amount.objection_id);
    expect(progress_billing_amount.objection_id).toBe(result_billing_amount.objection_id);
    expect(progress_billing_amount.current_status).toBe('notified');
    expect(progress_billing_amount.assigned_department).toBe('finance');
    expect(progress_billing_amount.last_update_time).toBeDefined();

    const progress_billing_date = trackObjectionProgress(result_billing_date.objection_id);
    expect(progress_billing_date.objection_id).toBe(result_billing_date.objection_id);
    expect(progress_billing_date.current_status).toBe('notified');
    expect(progress_billing_date.assigned_department).toBe('admin');
    expect(progress_billing_date.last_update_time).toBeDefined();

    const progress_product_content = trackObjectionProgress(result_product_content.objection_id);
    expect(progress_product_content.objection_id).toBe(result_product_content.objection_id);
    expect(progress_product_content.current_status).toBe('notified');
    expect(progress_product_content.assigned_department).toBe('sales');
    expect(progress_product_content.last_update_time).toBeDefined();

    // 3 つの異議が独立していることを確認（異なるオブジェクションIDを保有）
    expect(result_billing_amount.objection_id).not.toBe(result_billing_date.objection_id);
    expect(result_billing_date.objection_id).not.toBe(result_product_content.objection_id);
    expect(result_billing_amount.objection_id).not.toBe(result_product_content.objection_id);
  });
});