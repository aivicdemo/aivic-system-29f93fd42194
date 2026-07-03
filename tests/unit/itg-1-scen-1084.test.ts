import { describe, test, expect, beforeEach } from '@jest/globals';
import {
  generateCorrectionInstructions,
  validateBusinessTaskData,
  evaluateNewStaffPerformance,
} from '../../src/logic/it-1781935279444-1-1-1';

describe('営業データ項目のメタデータ管理機能 - 修正指示生成と検証', () => {
  // SCEN-1084: [normal] 新入スタッフ3業務統合評価機能 - 修正指示には具体的な修正対象業務と理由が含まれる
  test('新入スタッフ3業務統合評価で複数業務の修正指示が具体的な業務名と理由を含むこと', () => {
    // 初期化
    beforeEach(() => {
      jest.clearAllMocks();
    });

    // テストデータ: 営業データ入力、請求データ確認、品質チェック の3業務
    const salesDataInputTask = {
      task_id: 'task_001',
      task_name: '営業データ入力',
      task_type: 'data_entry',
      staff_id: 'staff_new_001',
      submission_data: {
        customer_name: '',
        contact_date: '2024-01-15',
        sales_outcome: 'appointment_confirmed',
        appointment_status: 'confirmed',
      },
      submission_timestamp: '2024-01-15T10:00:00Z',
      quality_criteria: {
        required_fields: ['customer_name', 'contact_date', 'sales_outcome'],
        data_types: { contact_date: 'date', appointment_status: 'enum' },
        allowed_values: { appointment_status: ['confirmed', 'pending', 'rejected'] },
      },
    };

    const invoiceDataTask = {
      task_id: 'task_002',
      task_name: '請求データ確認',
      task_type: 'invoice_check',
      staff_id: 'staff_new_001',
      submission_data: {
        customer_id: 'cust_123',
        billing_amount: -5000,
        service_type: 'premium_service',
        billing_period: '2024-01',
      },
      submission_timestamp: '2024-01-15T11:00:00Z',
      quality_criteria: {
        required_fields: ['customer_id', 'billing_amount', 'service_type'],
        constraints: {
          billing_amount: { min: 0, max: 1000000 },
        },
      },
    };

    const qualityCheckTask = {
      task_id: 'task_003',
      task_name: '品質チェック',
      task_type: 'quality_check',
      staff_id: 'staff_new_001',
      submission_data: {
        check_items_count: 5,
        passed_items_count: 3,
        validation_errors: [
          {
            field: 'data_type_mismatch',
            value_found: 'text_format',
            expected_type: 'numeric',
          },
        ],
      },
      submission_timestamp: '2024-01-15T12:00:00Z',
      quality_criteria: {
        min_pass_rate: 0.95,
      },
    };

    const evaluation_tasks = [salesDataInputTask, invoiceDataTask, qualityCheckTask];

    // 各業務データの検証
    const validation_results = evaluation_tasks.map((task) =>
      validateBusinessTaskData({
        task_id: task.task_id,
        task_name: task.task_name,
        submission_data: task.submission_data,
        quality_criteria: task.quality_criteria,
      })
    );

    // 検証結果の確認: 意図的に不備を含むデータが検出される
    expect(validation_results[0].is_valid).toBe(false); // 営業データ入力: customer_name が空
    expect(validation_results[0].errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          field: 'customer_name',
          error_type: 'required_field_missing',
          reason: '必須項目が空白です',
        }),
      ])
    );

    expect(validation_results[1].is_valid).toBe(false); // 請求データ確認: billing_amount が負数
    expect(validation_results[1].errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          field: 'billing_amount',
          error_type: 'value_out_of_range',
          reason: '金額は0以上である必要があります',
        }),
      ])
    );

    expect(validation_results[2].is_valid).toBe(false); // 品質チェック: 合格率が基準未満
    expect(validation_results[2].errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          field: 'pass_rate',
          error_type: 'threshold_not_met',
          reason: '合格率（60%）が最小基準（95%）を下回っています',
        }),
      ])
    );

    // 修正指示生成: generateCorrectionInstructions を呼び出し
    const correction_instructions = generateCorrectionInstructions({
      staff_id: 'staff_new_001',
      evaluation_date: '2024-01-15T12:30:00Z',
      validation_results: validation_results,
      tasks: evaluation_tasks,
    });

    // 修正指示の個数確認: 3業務それぞれから修正指示が生成される
    expect(correction_instructions.instruction_list).toHaveLength(3);

    // 修正指示1: 営業データ入力業務
    const instruction_1 = correction_instructions.instruction_list[0];
    expect(instruction_1).toEqual(
      expect.objectContaining({
        instruction_id: expect.stringMatching(/^instr_/),
        task_id: 'task_001',
        business_task_name: '営業データ入力',
        correction_target_field: 'customer_name',
        correction_reason:
          '必須項目「顧客名」が未入力です。営業活動データ入力時には、顧客名の記入は必須です。',
        correction_action: '顧客名フィールドに有効な顧客名を入力してください',
        priority: 'high',
        created_at: expect.stringMatching(/^\d{4}-\d{2}-\d{2}T/),
      })
    );

    // 修正指示2: 請求データ確認業務
    const instruction_2 = correction_instructions.instruction_list[1];
    expect(instruction_2).toEqual(
      expect.objectContaining({
        instruction_id: expect.stringMatching(/^instr_/),
        task_id: 'task_002',
        business_task_name: '請求データ確認',
        correction_target_field: 'billing_amount',
        correction_reason:
          '請求金額が負数（-5000円）になっています。請求金額は0円以上の正数である必要があります。',
        correction_action: '請求金額を0以上の正数に修正してください',
        priority: 'high',
        created_at: expect.stringMatching(/^\d{4}-\d{2}-\d{2}T/),
      })
    );

    // 修正指示3: 品質チェック業務
    const instruction_3 = correction_instructions.instruction_list[2];
    expect(instruction_3).toEqual(
      expect.objectContaining({
        instruction_id: expect.stringMatching(/^instr_/),
        task_id: 'task_003',
        business_task_name: '品質チェック',
        correction_target_field: 'pass_rate',
        correction_reason:
          '検証項目の合格率が60%ですが、品質基準では最小95%以上が必須です。現状では品質基準を満たしていません。',
        correction_action: 'チェック対象項目を再検査し、不合格項目の原因を特定して修正してください',
        priority: 'critical',
        created_at: expect.stringMatching(/^\d{4}-\d{2}-\d{2}T/),
      })
    );

    // 各修正指示が一意の業務と理由を持つことを確認
    const task_names = correction_instructions.instruction_list.map(
      (instr) => instr.business_task_name
    );
    expect(new Set(task_names).size).toBe(3); // 3つの異なる業務名

    const reasons = correction_instructions.instruction_list.map(
      (instr) => instr.correction_reason
    );
    expect(new Set(reasons).size).toBe(3); // 3つの異なる理由

    // 修正指示がシステムに正しく保存されたことを確認
    const save_result = evaluateNewStaffPerformance({
      staff_id: 'staff_new_001',
      evaluation_date: '2024-01-15T12:30:00Z',
      correction_instructions: correction_instructions.instruction_list,
      evaluation_status: 'pending_correction',
    });

    expect(save_result.success).toBe(true);
    expect(save_result.saved_instruction_count).toBe(3);
    expect(save_result.evaluation_id).toMatch(/^eval_/);

    // 修正指示が完全で、新入スタッフが理解できる形式であることを確認
    correction_instructions.instruction_list.forEach((instruction) => {
      // 各指示には business_task_name（業務名）が含まれる
      expect(instruction.business_task_name).toBeTruthy();
      expect(['営業データ入力', '請求データ確認', '品質チェック']).toContain(
        instruction.business_task_name
      );

      // 各指示には correction_reason（理由）が含まれ、空でない
      expect(instruction.correction_reason).toBeTruthy();
      expect(instruction.correction_reason.length).toBeGreaterThan(10);

      // 各指示には correction_action（修正内容）が含まれ、具体的
      expect(instruction.correction_action).toBeTruthy();
      expect(instruction.correction_action.length).toBeGreaterThan(10);

      // 各指示には priority レベルが設定されている
      expect(['low', 'medium', 'high', 'critical']).toContain(instruction.priority);
    });

    // 修正指示の内容が明確かつ具体的であることを最終確認
    expect(correction_instructions.summary).toEqual(
      expect.objectContaining({
        total_instructions: 3,
        high_priority_count: 2,
        critical_priority_count: 1,
        staff_id: 'staff_new_001',
        generation_timestamp: expect.stringMatching(/^\d{4}-\d{2}-\d{2}T/),
      })
    );
  });
});