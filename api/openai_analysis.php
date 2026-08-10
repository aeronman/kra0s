<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

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
$openaiKey = $_POST['openai_key'] ?? '';
$model = $_POST['model'] ?? 'gpt-4o';

if (empty($openaiKey)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'OpenAI API key is required']);
    exit;
}

// Verify patient exists
$stmt = $pdo->prepare('SELECT patient_id, full_name, age, gender FROM patients WHERE patient_id = ?');
$stmt->execute([$patientId]);
$patient = $stmt->fetch();

if (!$patient) {
    http_response_code(404);
    echo json_encode(['success' => false, 'message' => 'Patient not found']);
    exit;
}

// Handle image upload
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

// Save image record
$ext = strtolower(pathinfo($originalFilename, PATHINFO_EXTENSION));
$modalityMap = ['dcm' => 'DICOM', 'nii' => 'NIfTI', 'nii.gz' => 'NIfTI', 'jpg' => 'MRI', 'jpeg' => 'MRI', 'png' => 'MRI'];
$modality = $modalityMap[$ext] ?? 'MRI';

$stmt = $pdo->prepare('INSERT INTO patient_images (patient_id, uploaded_by, filename, original_filename, file_path, file_size, mime_type, modality, scan_date)
                       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)');
$stmt->execute([
    $patientId,
    $_POST['user_id'] ?? null,
    $filename,
    $originalFilename,
    'uploads/' . $filename,
    $file['size'],
    $file['type'],
    $modality,
    date('Y-m-d')
]);
$imageId = $pdo->lastInsertId();

// Create analysis run
$stmt = $pdo->prepare('INSERT INTO analysis_runs (patient_id, image_id, triggered_by, analysis_type, model_version, status, started_at)
                       VALUES (?, ?, ?, ?, ?, ?, NOW())');
$stmt->execute([
    $patientId,
    $imageId,
    $_POST['user_id'] ?? null,
    'Pancreatic Tumor',
    'OpenAI-' . $model
]);
$runId = $pdo->lastInsertId();

// Prepare OpenAI request
$imageBase64 = base64_encode(file_get_contents($filePath));
$mimeType = $file['type'] ?: 'image/jpeg';

$prompt = <<<PROMPT
You are an expert medical imaging AI assistant specializing in pancreatic tumor analysis from MRI scans (DICOM/IVIM-DKI model).

Analyze the uploaded medical image and return a JSON object with the following structure. Be precise and medically reasoned. All values should be realistic estimates based on visual assessment.

Return ONLY valid JSON, no markdown, no explanation:

{
  "parametric_maps": {
    "f": {"value": 0.28, "description": "Perfusion fraction"},
    "D": {"value": 0.85, "description": "Diffusion coefficient"},
    "D_star": {"value": 0.12, "description": "Pseudodiffusion"},
    "K": {"value": 0.92, "description": "Kurtosis"}
  },
  "persistence_diagram": {
    "betti1_count": 42,
    "topological_complexity": "High",
    "description": "High topological complexity indicates irregular tumor morphology"
  },
  "tumor_morphology": {
    "diameter_cm": 2.8,
    "volume_cm3": 14.2,
    "volume_percent": "12% of Pancreatic Head"
  },
  "molecular_phenotype": {
    "kras_classification": "G12D",
    "confidence": 94,
    "alternatives": {"G12D": 94, "G12V": 8, "Wild-type": 3}
  },
  "surgical_metrics": {
    "r0_resectability_pct": 45,
    "is_resectable": true,
    "smv_proximity_mm": 2.0,
    "smv_proximity_risk": "High",
    "surgical_finding": "Presence of KRAS+ signals within 2mm of the Superior Mesenteric Vein Boundary"
  },
  "confidence": {
    "level": 90,
    "reason": "Images show HIGH Kurtosis Value"
  }
}

Ensure all numeric values are realistic for pancreatic tumor MRI analysis.
PROMPT;

// Call OpenAI API
$openaiPayload = [
    'model' => $model,
    'messages' => [
        [
            'role' => 'user',
            'content' => [
                ['type' => 'text', 'text' => $prompt],
                [
                    'type' => 'image_url',
                    'image_url' => [
                        'url' => 'data:' . $mimeType . ';base64,' . $imageBase64,
                        'detail' => 'high'
                    ]
                ]
            ]
        ]
    ],
    'max_tokens' => 1000,
    'temperature' => 0.3
];

$ch = curl_init('https://api.openai.com/v1/chat/completions');
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($openaiPayload));
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'Content-Type: application/json',
    'Authorization: Bearer ' . $openaiKey
]);

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

if ($httpCode !== 200 || !$response) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'OpenAI API request failed', 'details' => $response]);
    exit;
}

$openaiData = json_decode($response, true);
$content = $openaiData['choices'][0]['message']['content'] ?? '';

// Extract JSON from response (handle markdown code blocks)
$jsonMatch = [];
if (preg_match('/```json\s*(.*?)\s*```/s', $content, $jsonMatch)) {
    $content = $jsonMatch[1];
} elseif (preg_match('/```\s*(.*?)\s*```/s', $content, $jsonMatch)) {
    $content = $jsonMatch[1];
}

$analysis = json_decode($content, true);

if (!$analysis) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Failed to parse OpenAI response', 'raw' => $content]);
    exit;
}

// Save results to database
$stmt = $pdo->prepare('INSERT INTO analysis_results (
    run_id,
    param_f, param_d, param_d_star, param_k, parametric_maps_json,
    betti1_count, topological_complexity, persistence_signatures,
    tumor_diameter_cm, tumor_volume_cm3, tumor_volume_percent,
    kras_classification, kras_confidence, kras_alternatives,
    r0_resectability_pct, is_resectable, smv_proximity_mm, smv_proximity_risk, surgical_finding,
    confidence_level, confidence_reason
) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');

$pm = $analysis['parametric_maps'] ?? [];
$pd = $analysis['persistence_diagram'] ?? [];
$tm = $analysis['tumor_morphology'] ?? [];
$mp = $analysis['molecular_phenotype'] ?? [];
$sm = $analysis['surgical_metrics'] ?? [];
$cf = $analysis['confidence'] ?? [];

$stmt->execute([
    $runId,
    $pm['f']['value'] ?? null,
    $pm['D']['value'] ?? null,
    $pm['D_star']['value'] ?? null,
    $pm['K']['value'] ?? null,
    json_encode($pm),
    $pd['betti1_count'] ?? null,
    $pd['topological_complexity'] ?? null,
    json_encode($pd),
    $tm['diameter_cm'] ?? null,
    $tm['volume_cm3'] ?? null,
    $tm['volume_percent'] ?? null,
    $mp['kras_classification'] ?? null,
    $mp['confidence'] ?? null,
    json_encode($mp['alternatives'] ?? []),
    $sm['r0_resectability_pct'] ?? null,
    $sm['is_resectable'] ?? null,
    $sm['smv_proximity_mm'] ?? null,
    $sm['smv_proximity_risk'] ?? null,
    $sm['surgical_finding'] ?? null,
    $cf['level'] ?? null,
    $cf['reason'] ?? null
]);

// Update run status
$pdo->prepare('UPDATE analysis_runs SET status = "completed", completed_at = NOW() WHERE run_id = ?')->execute([$runId]);

echo json_encode([
    'success' => true,
    'message' => 'Analysis completed and saved',
    'data' => [
        'run_id' => $runId,
        'result_id' => $pdo->lastInsertId(),
        'analysis' => $analysis,
        'patient' => $patient
    ]
]);
