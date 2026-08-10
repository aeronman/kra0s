<?php
require_once 'db_connect.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method not allowed']);
    exit;
}

if (!isset($_FILES['image']) || !isset($_POST['patient_id'])) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Image file and patient_id are required']);
    exit;
}

$patientId = (int)$_POST['patient_id'];
$uploadedBy = !empty($_POST['user_id']) ? (int)$_POST['user_id'] : null;
$description = $_POST['description'] ?? null;
$scanDate = $_POST['scan_date'] ?? date('Y-m-d');

// Verify patient exists
$stmt = $pdo->prepare('SELECT patient_id FROM patients WHERE patient_id = ?');
$stmt->execute([$patientId]);
if (!$stmt->fetch()) {
    http_response_code(404);
    echo json_encode(['success' => false, 'message' => 'Patient not found']);
    exit;
}

$file = $_FILES['image'];
$uploadDir = __DIR__ . '/../uploads/';
if (!is_dir($uploadDir)) {
    mkdir($uploadDir, 0755, true);
}

$originalFilename = basename($file['name']);
$filename = uniqid() . '_' . preg_replace('/[^A-Za-z0-9_\-\.]/', '_', $originalFilename);
$filePath = $uploadDir . $filename;

if (!move_uploaded_file($file['tmp_name'], $filePath)) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Failed to upload file']);
    exit;
}

// Determine modality from extension
$ext = strtolower(pathinfo($originalFilename, PATHINFO_EXTENSION));
$modalityMap = ['dcm' => 'DICOM', 'nii' => 'NIfTI', 'nii.gz' => 'NIfTI', 'jpg' => 'MRI', 'jpeg' => 'MRI', 'png' => 'MRI'];
$modality = $modalityMap[$ext] ?? 'MRI';

$stmt = $pdo->prepare('INSERT INTO patient_images (patient_id, uploaded_by, filename, original_filename, file_path, file_size, mime_type, modality, scan_date, description)
                       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
$stmt->execute([
    $patientId,
    $uploadedBy,
    $filename,
    $originalFilename,
    'uploads/' . $filename,
    $file['size'],
    $file['type'],
    $modality,
    $scanDate,
    $description
]);

echo json_encode([
    'success' => true,
    'message' => 'Image uploaded successfully',
    'data' => [
        'image_id' => $pdo->lastInsertId(),
        'filename' => $filename,
        'modality' => $modality
    ]
]);
