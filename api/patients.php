<?php
require_once 'db_connect.php';

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    $search = $_GET['search'] ?? '';
    
    $sql = 'SELECT p.patient_id, p.patient_code, p.full_name, p.age, p.gender, p.diagnosis, p.status, p.created_at,
                   (SELECT COUNT(*) FROM analysis_runs ar WHERE ar.patient_id = p.patient_id) as analysis_count
            FROM patients p';
    
    $params = [];
    if ($search) {
        $sql .= ' WHERE p.full_name LIKE ? OR p.patient_code LIKE ? OR p.diagnosis LIKE ?';
        $params = ["%$search%", "%$search%", "%$search%"];
    }
    $sql .= ' ORDER BY p.created_at DESC';
    
    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    $patients = $stmt->fetchAll();
    
    echo json_encode(['success' => true, 'data' => $patients]);
    exit;
}

if ($method === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (!$input || empty($input['full_name']) || empty($input['gender'])) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Full name and gender are required']);
        exit;
    }
    
    $patientCode = 'PT-' . date('Y') . '-' . str_pad($pdo->query('SELECT COUNT(*) FROM patients')->fetchColumn() + 1, 3, '0', STR_PAD_LEFT);
    
    $stmt = $pdo->prepare('INSERT INTO patients (patient_code, full_name, date_of_birth, age, gender, diagnosis, status, notes, created_by)
                           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)');
    $stmt->execute([
        $patientCode,
        $input['full_name'],
        $input['date_of_birth'] ?? null,
        $input['age'] ?? null,
        $input['gender'],
        $input['diagnosis'] ?? null,
        $input['status'] ?? 'Normal',
        $input['notes'] ?? null,
        $input['created_by'] ?? null
    ]);
    
    $patientId = $pdo->lastInsertId();
    
    echo json_encode([
        'success' => true,
        'message' => 'Patient added successfully',
        'data' => ['patient_id' => $patientId, 'patient_code' => $patientCode]
    ]);
    exit;
}

http_response_code(405);
echo json_encode(['success' => false, 'message' => 'Method not allowed']);
