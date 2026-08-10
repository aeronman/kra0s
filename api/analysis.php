<?php
require_once 'db_connect.php';

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (!$input || empty($input['patient_id'])) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'patient_id is required']);
        exit;
    }
    
    // Create analysis run
    $stmt = $pdo->prepare('INSERT INTO analysis_runs (patient_id, image_id, triggered_by, analysis_type, model_version, status, started_at, completed_at)
                           VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())');
    $stmt->execute([
        $input['patient_id'],
        $input['image_id'] ?? null,
        $input['triggered_by'] ?? null,
        $input['analysis_type'] ?? 'Pancreatic Tumor',
        $input['model_version'] ?? 'NeuroScan v3.2',
        'completed'
    ]);
    
    $runId = $pdo->lastInsertId();
    
    // Insert results
    $stmt = $pdo->prepare('INSERT INTO analysis_results (
        run_id, param_f, param_d, param_d_star, param_k, parametric_maps_json,
        betti1_count, topological_complexity, persistence_signatures,
        tumor_diameter_cm, tumor_volume_cm3, tumor_volume_percent,
        kras_classification, kras_confidence, kras_alternatives,
        r0_resectability_pct, is_resectable, smv_proximity_mm, smv_proximity_risk, surgical_finding,
        confidence_level, confidence_reason
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
    
    $stmt->execute([
        $runId,
        $input['param_f'] ?? null,
        $input['param_d'] ?? null,
        $input['param_d_star'] ?? null,
        $input['param_k'] ?? null,
        isset($input['parametric_maps_json']) ? json_encode($input['parametric_maps_json']) : null,
        $input['betti1_count'] ?? null,
        $input['topological_complexity'] ?? null,
        isset($input['persistence_signatures']) ? json_encode($input['persistence_signatures']) : null,
        $input['tumor_diameter_cm'] ?? null,
        $input['tumor_volume_cm3'] ?? null,
        $input['tumor_volume_percent'] ?? null,
        $input['kras_classification'] ?? null,
        $input['kras_confidence'] ?? null,
        isset($input['kras_alternatives']) ? json_encode($input['kras_alternatives']) : null,
        $input['r0_resectability_pct'] ?? null,
        $input['is_resectable'] ?? null,
        $input['smv_proximity_mm'] ?? null,
        $input['smv_proximity_risk'] ?? null,
        $input['surgical_finding'] ?? null,
        $input['confidence_level'] ?? null,
        $input['confidence_reason'] ?? null
    ]);
    
    echo json_encode([
        'success' => true,
        'message' => 'Analysis saved successfully',
        'data' => ['run_id' => $runId, 'result_id' => $pdo->lastInsertId()]
    ]);
    exit;
}

if ($method === 'GET') {
    $patientId = $_GET['patient_id'] ?? null;
    $runId = $_GET['run_id'] ?? null;
    
    if ($runId) {
        $stmt = $pdo->prepare('SELECT ar.*, p.patient_code, p.full_name, p.age, p.gender
                               FROM analysis_results ar
                               JOIN analysis_runs arun ON ar.run_id = arun.run_id
                               JOIN patients p ON arun.patient_id = p.patient_id
                               WHERE ar.run_id = ?');
        $stmt->execute([$runId]);
        $result = $stmt->fetch();
        
        if ($result) {
            $result['kras_alternatives'] = json_decode($result['kras_alternatives'], true);
            $result['persistence_signatures'] = json_decode($result['persistence_signatures'], true);
            $result['parametric_maps_json'] = json_decode($result['parametric_maps_json'], true);
            echo json_encode(['success' => true, 'data' => $result]);
        } else {
            echo json_encode(['success' => false, 'message' => 'Result not found']);
        }
        exit;
    }
    
    if ($patientId) {
        $stmt = $pdo->prepare('SELECT ar.run_id, ar.analysis_type, ar.model_version, ar.completed_at, ar.confidence_level,
                                      p.patient_code, p.full_name, p.age, p.gender
                               FROM analysis_runs ar
                               JOIN patients p ON ar.patient_id = p.patient_id
                               WHERE ar.patient_id = ? AND ar.status = "completed"
                               ORDER BY ar.completed_at DESC');
        $stmt->execute([$patientId]);
        $results = $stmt->fetchAll();
        echo json_encode(['success' => true, 'data' => $results]);
        exit;
    }
    
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'patient_id or run_id is required']);
    exit;
}

http_response_code(405);
echo json_encode(['success' => false, 'message' => 'Method not allowed']);
