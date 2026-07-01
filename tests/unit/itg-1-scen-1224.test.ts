import { detectAndRegisterContractChange } from '../../src/logic/it-1-2-1';

describe('営業成果データから請求対象項目を自動抽出し、顧客ごと・サービスごとの請求額を集計する機能', () => {
  test('SCEN-1224: 成果物納期の手動変更が自動で検知され、契約変更管理システムに自動登録される', () => {
    // 前提条件: 既存の営業案件と成果物納期情報が存在
    const caseId = 'CASE-2024-001';
    const customerId = 'CUST-ABC-001';
    const serviceName = 'システム開発・保守サービス';
    
    // 変更前の納期: 2024-06-15
    const deliveryDateBefore = new Date('2024-06-15T00:00:00Z');
    
    // 変更後の納期: 当日（2024-03-17）から30日後 = 2024-04-16
    const today = new Date('2024-03-17T09:00:00Z');
    const thirtyDaysLater = new Date('2024-04-16T09:00:00Z');
    
    // 変更を実行
    const changeResult = detectAndRegisterContractChange({
      caseId,
      customerId,
      serviceName,
      changeType: 'delivery_date_update',
      previousValue: deliveryDateBefore.toISOString(),
      newValue: thirtyDaysLater.toISOString(),
      changedAt: today,
      changedByUserId: 'USER-REP-001',
      changedByUserName: '営業代行企業 代表者',
    });

    // 成功判定: 変更が正常に検知・登録された
    expect(changeResult.success).toBe(true);

    // 登録されたレコードのID（連携確認用）
    expect(changeResult.registeredContractChangeId).toBeDefined();
    expect(typeof changeResult.registeredContractChangeId).toBe('string');

    // 変更内容の正確性確認
    expect(changeResult.registeredChange).toEqual({
      contractChangeId: expect.any(String),
      caseId,
      customerId,
      serviceName,
      changeType: 'delivery_date_update',
      previousDeliveryDate: deliveryDateBefore.toISOString(),
      newDeliveryDate: thirtyDaysLater.toISOString(),
      detectedAt: today.toISOString(),
      changedByUserId: 'USER-REP-001',
      changedByUserName: '営業代行企業 代表者',
    });

    // 契約変更管理システムへの自動登録が完了
    expect(changeResult.registrationStatus).toBe('registered');

    // タイムスタンプが正確に記録されていることを確認
    const registeredTimestamp = new Date(changeResult.registeredChange.detectedAt);
    expect(registeredTimestamp.getTime()).toBe(today.getTime());

    // 変更前後の納期が正確に反映されていることを確認
    const prevDate = new Date(changeResult.registeredChange.previousDeliveryDate);
    const newDate = new Date(changeResult.registeredChange.newDeliveryDate);
    const daysDelay = (newDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24);
    expect(daysDelay).toBe(-60); // 元々2024-06-15だったものを2024-04-16に前倒したため -60日

    // 変更内容が契約変更管理システムで検索可能な状態を確認
    expect(changeResult.searchableInSystem).toBe(true);

    // エラーケース: 必須情報の欠落時
    expect(() =>
      detectAndRegisterContractChange({
        caseId: '',
        customerId,
        serviceName,
        changeType: 'delivery_date_update',
        previousValue: deliveryDateBefore.toISOString(),
        newValue: thirtyDaysLater.toISOString(),
        changedAt: today,
        changedByUserId: 'USER-REP-001',
        changedByUserName: '営業代行企業 代表者',
      })
    ).toThrow(/案件ID/);

    expect(() =>
      detectAndRegisterContractChange({
        caseId,
        customerId: '',
        serviceName,
        changeType: 'delivery_date_update',
        previousValue: deliveryDateBefore.toISOString(),
        newValue: thirtyDaysLater.toISOString(),
        changedAt: today,
        changedByUserId: 'USER-REP-001',
        changedByUserName: '営業代行企業 代表者',
      })
    ).toThrow(/顧客ID/);

    expect(() =>
      detectAndRegisterContractChange({
        caseId,
        customerId,
        serviceName,
        changeType: 'delivery_date_update',
        previousValue: deliveryDateBefore.toISOString(),
        newValue: '',
        changedAt: today,
        changedByUserId: 'USER-REP-001',
        changedByUserName: '営業代行企業 代表者',
      })
    ).toThrow(/新納期/);

    expect(() =>
      detectAndRegisterContractChange({
        caseId,
        customerId,
        serviceName,
        changeType: 'delivery_date_update',
        previousValue: deliveryDateBefore.toISOString(),
        newValue: thirtyDaysLater.toISOString(),
        changedAt: today,
        changedByUserId: '',
        changedByUserName: '営業代行企業 代表者',
      })
    ).toThrow(/変更者/);

    // 日付形式が無効な場合
    expect(() =>
      detectAndRegisterContractChange({
        caseId,
        customerId,
        serviceName,
        changeType: 'delivery_date_update',
        previousValue: 'invalid-date',
        newValue: thirtyDaysLater.toISOString(),
        changedAt: today,
        changedByUserId: 'USER-REP-001',
        changedByUserName: '営業代行企業 代表者',
      })
    ).toThrow(/日付形式/);
  });
});