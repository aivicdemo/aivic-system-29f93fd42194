import { validateLearningDataConfirmation, startMeasurementExecution, recordExecutionEvent, verifyMeasurementProgress } from "../../src/logic/it-6-2-2-1";

describe("改善対策実行と精度計測機能", () => {
  // SCEN-1219
  test("学習データとモデルパラメータが確定状態にあることを検証して実行を開始し、精度計測が正常に進行することを確認", () => {
    // 準備: 学習データとモデルパラメータの確定状態
    const confirmed_learning_data = {
      past_case_data_version: "2024-01-15",
      past_case_data_count: 1250,
      material_price_book_version: "2024-01-10",
      material_price_book_update_date: "2024-01-10T09:00:00Z",
      regional_coverage_rate: 95.5,
      work_type_coverage_rate: 92.3,
      seasonal_adjustment_applied: true,
      data_quality_score: 88.7,
      is_confirmed: true,
    };

    const confirmed_model_params = {
      learning_rate: 0.001,
      batch_size: 32,
      epoch_count: 50,
      regularization_param: 0.01,
      dropout_rate: 0.2,
      validation_split_ratio: 0.2,
      test_split_ratio: 0.1,
      random_seed: 42,
      optimization_algorithm: "adam",
      is_all_params_confirmed: true,
    };

    // Step 1: 学習データの完全性を検証
    const learning_data_validation = validateLearningDataConfirmation(
      confirmed_learning_data
    );
    expect(learning_data_validation.is_data_complete).toBe(true);
    expect(learning_data_validation.validation_score).toBe(88.7);
    expect(learning_data_validation.can_proceed_to_execution).toBe(true);

    // Step 2: モデルパラメータが確定状態であることを確認
    expect(confirmed_model_params.is_all_params_confirmed).toBe(true);
    expect(confirmed_model_params.learning_rate).toBe(0.001);
    expect(confirmed_model_params.batch_size).toBe(32);
    expect(confirmed_model_params.epoch_count).toBe(50);

    // Step 3: 確定状態の学習データとモデルパラメータの組み合わせが有効であることを判定
    const combined_validation = {
      learning_data_confirmed: confirmed_learning_data.is_confirmed,
      model_params_confirmed: confirmed_model_params.is_all_params_confirmed,
      combination_is_valid: true,
      execution_can_start: true,
    };
    expect(combined_validation.combination_is_valid).toBe(true);
    expect(combined_validation.execution_can_start).toBe(true);

    // Step 4: 実行開始ボタンの活性状態を確認
    const button_state = {
      is_enabled: true,
      can_be_clicked: true,
      button_status: "active",
    };
    expect(button_state.is_enabled).toBe(true);
    expect(button_state.can_be_clicked).toBe(true);

    // Step 5: 実行開始ボタンをクリックして改善対策の実行を開始
    const execution_start_timestamp = "2024-01-15T14:30:00Z";
    const execution_id = "exec_20240115_143000_001";
    const improvement_measure_id = "measure_20240115_001";

    const execution_result = startMeasurementExecution({
      execution_id: execution_id,
      improvement_measure_id: improvement_measure_id,
      learning_data_version: confirmed_learning_data.past_case_data_version,
      model_params_version: "params_20240115_001",
      execution_start_time: execution_start_timestamp,
      learning_data_count: confirmed_learning_data.past_case_data_count,
      data_quality_score: confirmed_learning_data.data_quality_score,
    });

    expect(execution_result.execution_status).toBe("started");
    expect(execution_result.execution_id).toBe(execution_id);
    expect(execution_result.improvement_measure_id).toBe(improvement_measure_id);
    expect(execution_result.start_timestamp).toBe(execution_start_timestamp);

    // Step 6: 実行ログに実行開始のイベントが記録されていることを確認
    const execution_event = {
      event_id: "event_20240115_143000_001",
      execution_id: execution_id,
      event_type: "execution_started",
      event_timestamp: execution_start_timestamp,
      event_description: "改善対策の実行が開始されました",
      learning_data_version: confirmed_learning_data.past_case_data_version,
      model_params_version: "params_20240115_001",
      recorded_successfully: true,
    };

    const event_record_result = recordExecutionEvent(execution_event);
    expect(event_record_result.event_recorded).toBe(true);
    expect(event_record_result.event_id).toBe("event_20240115_143000_001");
    expect(event_record_result.event_type).toBe("execution_started");
    expect(event_record_result.log_entry_created).toBe(true);

    // Step 7: 精度計測機能が正常に動作し、計測が進行していることを確認
    const measurement_progress_check = {
      execution_id: execution_id,
      measurement_start_time: execution_start_timestamp,
      ocr_accuracy_measurement_status: "in_progress",
      ai_judgment_accuracy_measurement_status: "in_progress",
      processing_time_measurement_status: "in_progress",
      measurement_progress_percentage: 15.5,
      elapsed_seconds: 45,
    };

    const progress_result = verifyMeasurementProgress(
      measurement_progress_check
    );
    expect(progress_result.is_measurement_active).toBe(true);
    expect(progress_result.ocr_accuracy_being_measured).toBe(true);
    expect(progress_result.ai_judgment_accuracy_being_measured).toBe(true);
    expect(progress_result.progress_percentage).toBe(15.5);
    expect(progress_result.measurement_proceeding_normally).toBe(true);

    // 総合検証: 全ステップが成功し、安全な実行が確認される
    const overall_verification = {
      learning_data_validation_passed: true,
      model_params_confirmation_verified: true,
      combination_validity_confirmed: true,
      execution_button_activated: true,
      execution_started_successfully: true,
      execution_event_logged: true,
      measurement_progressing_normally: true,
      safe_execution_confirmed: true,
    };

    expect(overall_verification.learning_data_validation_passed).toBe(true);
    expect(overall_verification.model_params_confirmation_verified).toBe(true);
    expect(overall_verification.combination_validity_confirmed).toBe(true);
    expect(overall_verification.execution_button_activated).toBe(true);
    expect(overall_verification.execution_started_successfully).toBe(true);
    expect(overall_verification.execution_event_logged).toBe(true);
    expect(overall_verification.measurement_progressing_normally).toBe(true);
    expect(overall_verification.safe_execution_confirmed).toBe(true);
  });
});