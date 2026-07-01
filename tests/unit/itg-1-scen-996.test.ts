import { calculateInvoiceAmountForEducation } from "../../src/logic/it-1781935279444-1-1-1";

describe("営業データ項目メタデータ管理機能 - 請求額算出・検証教育プロセス", () => {
  // SCEN-996: [normal] 請求額算出・検証教育プロセス - 新入スタッフが手順書とチェックリストに従い、複数顧客の請求額を正確に算出・検証できる
  test("新入スタッフが手順書とチェックリストに従い、複数顧客の請求額を正確に算出・検証できる", () => {
    // 手順1-2: 手順書とチェックリストを取得・確認
    const procedure_manual = {
      manual_id: "MAN-2024-001",
      manual_name: "請求額算出・検証手順書",
      procedure_steps: [
        {
          step_id: 1,
          step_name: "営業データ抽出",
          description: "顧客別・サービス別の営業データを営業システムから抽出する",
        },
        {
          step_id: 2,
          step_name: "契約内容確認",
          description: "顧客の契約書から基本料金、成果報酬ルール、割引基準を確認",
        },
        {
          step_id: 3,
          step_name: "請求対象項目判定",
          description: "営業データから請求ルールに基づいて請求対象項目を抽出",
        },
        {
          step_id: 4,
          step_name: "請求額計算",
          description:
            "基本料金 + 成果報酬 - 割引 + 税金の計算式で請求額を算出",
        },
        {
          step_id: 5,
          step_name: "検証チェック",
          description: "チェックリスト項目に基づき算出結果を検証",
        },
      ],
      version: "1.0",
      created_at: "2024-01-01T00:00:00Z",
      updated_at: "2024-01-01T00:00:00Z",
    };

    const checklist = {
      checklist_id: "CHK-2024-001",
      checklist_name: "請求額算出・検証チェックリスト",
      items: [
        {
          item_id: 1,
          item_name: "数量確認",
          description: "営業データの数量（アポ数、成約数）が正確であること",
          required: true,
        },
        {
          item_id: 2,
          item_name: "単価確認",
          description: "契約書記載の単価が正確に適用されていること",
          required: true,
        },
        {
          item_id: 3,
          item_name: "割引確認",
          description: "契約条件に基づく割引が正確に適用されていること",
          required: true,
        },
        {
          item_id: 4,
          item_name: "税金確認",
          description: "消費税が正確に計算されていること",
          required: true,
        },
        {
          item_id: 5,
          item_name: "金額確認",
          description: "合計請求額が正確に計算されていること",
          required: true,
        },
      ],
      version: "1.0",
      created_at: "2024-01-01T00:00:00Z",
    };

    // 手順3: テスト用複数顧客データを準備（最小3顧客）
    const customer_data_a = {
      customer_id: "CUST-A-001",
      customer_name: "顧客A",
      contract_id: "CTR-A-001",
      service_type: "基本サービス",
      base_fee: 100000,
      performance_rate: 0.1,
      performance_value: 500000,
      discount_rate: 0.05,
      tax_rate: 0.1,
      data_points: {
        appointment_count: 50,
        contract_count: 10,
        customer_response_score: 85,
      },
    };

    const customer_data_b = {
      customer_id: "CUST-B-001",
      customer_name: "顧客B",
      contract_id: "CTR-B-001",
      service_type: "プレミアムサービス",
      base_fee: 150000,
      performance_rate: 0.15,
      performance_value: 600000,
      discount_rate: 0.1,
      tax_rate: 0.1,
      data_points: {
        appointment_count: 60,
        contract_count: 15,
        customer_response_score: 90,
      },
    };

    const customer_data_c = {
      customer_id: "CUST-C-001",
      customer_name: "顧客C",
      contract_id: "CTR-C-001",
      service_type: "スタンダードサービス",
      base_fee: 120000,
      performance_rate: 0.12,
      performance_value: 550000,
      discount_rate: 0.08,
      tax_rate: 0.1,
      data_points: {
        appointment_count: 55,
        contract_count: 12,
        customer_response_score: 88,
      },
    };

    // 手順4-5: 顧客A の請求額算出・検証
    // 計算ロジック: (基本料金 + 成果報酬) × (1 - 割引率) × (1 + 税率)
    // 成果報酬 = パフォーマンス値 × パフォーマンスレート
    const customer_a_performance_fee = 500000 * 0.1; // 50,000
    const customer_a_subtotal =
      (100000 + customer_a_performance_fee) * (1 - 0.05); // 142,500
    const customer_a_invoice_amount = customer_a_subtotal * (1 + 0.1); // 156,750

    // 手順6: 顧客B の請求額算出・検証
    const customer_b_performance_fee = 600000 * 0.15; // 90,000
    const customer_b_subtotal =
      (150000 + customer_b_performance_fee) * (1 - 0.1); // 216,000
    const customer_b_invoice_amount = customer_b_subtotal * (1 + 0.1); // 237,600

    // 手順7: 顧客C の請求額算出・検証
    const customer_c_performance_fee = 550000 * 0.12; // 66,000
    const customer_c_subtotal =
      (120000 + customer_c_performance_fee) * (1 - 0.08); // 171,520
    const customer_c_invoice_amount = customer_c_subtotal * (1 + 0.1); // 188,672

    // 手順8: 複数顧客データをシステムに入力
    const education_session = {
      session_id: "EDU-2024-001",
      trainee_id: "TRAINEE-001",
      trainee_name: "新入スタッフA",
      manual_id: procedure_manual.manual_id,
      checklist_id: checklist.checklist_id,
      training_start_date: "2024-01-15T09:00:00Z",
      customer_invoices: [
        {
          customer_id: customer_data_a.customer_id,
          customer_name: customer_data_a.customer_name,
          trainee_calculated_amount: customer_a_invoice_amount,
          contract_id: customer_data_a.contract_id,
        },
        {
          customer_id: customer_data_b.customer_id,
          customer_name: customer_data_b.customer_name,
          trainee_calculated_amount: customer_b_invoice_amount,
          contract_id: customer_data_b.contract_id,
        },
        {
          customer_id: customer_data_c.customer_id,
          customer_name: customer_data_c.customer_name,
          trainee_calculated_amount: customer_c_invoice_amount,
          contract_id: customer_data_c.contract_id,
        },
      ],
    };

    // 手順9: システムが算出した請求額と新入スタッフが算出した請求額を比較検証
    // システムの算出ロジックを呼び出し
    const system_validation_result = calculateInvoiceAmountForEducation({
      session_id: education_session.session_id,
      trainee_id: education_session.trainee_id,
      procedure_manual: procedure_manual,
      checklist: checklist,
      customer_data_list: [customer_data_a, customer_data_b, customer_data_c],
      trainee_calculated_invoices: [
        {
          customer_id: customer_data_a.customer_id,
          calculated_amount: customer_a_invoice_amount,
        },
        {
          customer_id: customer_data_b.customer_id,
          calculated_amount: customer_b_invoice_amount,
        },
        {
          customer_id: customer_data_c.customer_id,
          calculated_amount: customer_c_invoice_amount,
        },
      ],
    });

    // 手順10: チェックリストの全確認項目に対して検証完了の記録
    // 期待結果検証
    expect(system_validation_result).toEqual({
      session_id: "EDU-2024-001",
      trainee_id: "TRAINEE-001",
      validation_status: "完全合格",
      total_customers_validated: 3,
      all_invoices_correct: true,
      invoice_validation_results: [
        {
          customer_id: "CUST-A-001",
          customer_name: "顧客A",
          system_calculated_amount: 156750,
          trainee_calculated_amount: 156750,
          match_status: "一致",
          variance_percentage: 0,
          checklist_items_validated: [
            {
              item_id: 1,
              item_name: "数量確認",
              status: "完了",
              note: "アポ数50件、成約数10件が正確に確認された",
            },
            {
              item_id: 2,
              item_name: "単価確認",
              status: "完了",
              note: "基本料金100,000円が正確に適用されている",
            },
            {
              item_id: 3,
              item_name: "割引確認",
              status: "完了",
              note: "5%割引が正確に適用されている",
            },
            {
              item_id: 4,
              item_name: "税金確認",
              status: "完了",
              note: "10%消費税が正確に計算されている",
            },
            {
              item_id: 5,
              item_name: "金額確認",
              status: "完了",
              note: "合計請求額156,750円が正確に計算されている",
            },
          ],
        },
        {
          customer_id: "CUST-B-001",
          customer_name: "顧客B",
          system_calculated_amount: 237600,
          trainee_calculated_amount: 237600,
          match_status: "一致",
          variance_percentage: 0,
          checklist_items_validated: [
            {
              item_id: 1,
              item_name: "数量確認",
              status: "完了",
              note: "アポ数60件、成約数15件が正確に確認された",
            },
            {
              item_id: 2,
              item_name: "単価確認",
              status: "完了",
              note: "基本料金150,000円が正確に適用されている",
            },
            {
              item_id: 3,
              item_name: "割引確認",
              status: "完了",
              note: "10%割引が正確に適用されている",
            },
            {
              item_id: 4,
              item_name: "税金確認",
              status: "完了",
              note: "10%消費税が正確に計算されている",
            },
            {
              item_id: 5,
              item_name: "金額確認",
              status: "完了",
              note: "合計請求額237,600円が正確に計算されている",
            },
          ],
        },
        {
          customer_id: "CUST-C-001",
          customer_name: "顧客C",
          system_calculated_amount: 188672,
          trainee_calculated_amount: 188672,
          match_status: "一致",
          variance_percentage: 0,
          checklist_items_validated: [
            {
              item_id: 1,
              item_name: "数量確認",
              status: "完了",
              note: "アポ数55件、成約数12件が正確に確認された",
            },
            {
              item_id: 2,
              item_name: "単価確認",
              status: "完了",
              note: "基本料金120,000円が正確に適用されている",
            },
            {
              item_id: 3,
              item_name: "割引確認",
              status: "完了",
              note: "8%割引が正確に適用されている",
            },
            {
              item_id: 4,
              item_name: "税金確認",
              status: "完了",
              note: "10%消費税が正確に計算されている",
            },
            {
              item_id: 5,
              item_name: "金額確認",
              status: "完了",
              note: "合計請求額188,672円が正確に計算されている",
            },
          ],
        },
      ],
      checklist_completion_status: {
        total_checklist_items: 5,
        completed_items: 5,
        completion_percentage: 100,
        all_items_completed: true,
      },
      education_result_summary: {
        trainee_id: "TRAINEE-001",
        training_date: "2024-01-15T09:00:00Z",
        validation_passed: true,
        all_customers_passed: true,
        certification_status: "合格認定",
        next_step: "即戦力として配置可能",
      },
    });

    // 追加検証: 請求額計算の正確性を100%確認
    expect(
      system_validation_result.all_invoices_correct
    ).toBe(true);
    expect(
      system_validation_result.checklist_completion_status.completion_percentage
    ).toBe(100);
    expect(
      system_validation_result.education_result_summary.validation_passed
    ).toBe(true);

    // 各顧客の金額が完全に一致していることを確認
    system_validation_result.invoice_validation_results.forEach(
      (result: any) => {
        expect(result.match_status).toBe("一致");
        expect(result.variance_percentage).toBe(0);
      }
    );
  });
});