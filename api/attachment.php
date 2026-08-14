<?php
/**
 * Chatbot API proxy
 * Keep this file at: floating-chatbot/api/attachment.php
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, X-Session-Id');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

define('CHAT_API_URL', 'https://demo-api.technologymindz.net/api/chatbot/chat/');
define('FEEDBACK_API_URL', 'https://demo-api.technologymindz.net/api/chatbot/chat/feedback');
define('ESCALATION_API_URL', 'https://demo-api.technologymindz.net/api/chatbot/escalations/send');
define('VOICE_AGENT_ID', 'vc_agent_fcf07ddb25054de0');
define('DEFAULT_EMAIL', 'visitor@example.com');
define('DEFAULT_NAME', 'Visitor');

$rawInput = file_get_contents('php://input');
$data     = json_decode($rawInput, true);

if (!is_array($data)) {
    echo json_encode(['answer' => 'Invalid request.', 'transfer' => false]);
    exit;
}

if (isset($data['feedback_type']) && isset($data['message_id'])) {
    $fbCurl = curl_init();
    curl_setopt_array($fbCurl, array(
        CURLOPT_URL            => FEEDBACK_API_URL,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_CUSTOMREQUEST  => 'POST',
        CURLOPT_HTTPHEADER     => ['Content-Type: application/json'],
        CURLOPT_POSTFIELDS     => json_encode([
            'feedback_type' => $data['feedback_type'],
            'message_id'    => $data['message_id'],
        ]),
    ));
    $fbResp = curl_exec($fbCurl);
    $fbCode = curl_errno($fbCurl) ? 502 : curl_getinfo($fbCurl, CURLINFO_HTTP_CODE);
    curl_close($fbCurl);
    http_response_code($fbCode);
    echo $fbResp ?: json_encode(['ok' => true]);
    exit;
}

$history   = isset($data['history'])    ? $data['history']          : null;
$email     = isset($data['email'])      ? trim($data['email'])      : '';
$name      = isset($data['name'])       ? trim($data['name'])       : '';
$sessionId = isset($data['session_id']) ? trim($data['session_id']) : '';

if ($sessionId === '') {
    $sessionId = isset($_SERVER['HTTP_X_SESSION_ID']) ? trim($_SERVER['HTTP_X_SESSION_ID']) : '';
}

if (!$history) {
    echo json_encode(['answer' => 'No valid input provided.', 'transfer' => false]);
    exit;
}

$mode = isset($data['mode']) ? trim($data['mode']) : 'text';

$postData = [
    'history'  => $history,
    'email'    => $email !== '' ? $email : DEFAULT_EMAIL,
    'name'     => $name !== '' ? $name : DEFAULT_NAME,
    'mode'     => $mode,
    'agent_id' => VOICE_AGENT_ID,
];

$curlHeaders = ['Content-Type: application/json'];
if ($sessionId !== '') {
    $curlHeaders[] = 'X-Session-Id: ' . $sessionId;
}
$curlHeaders[] = 'X-Agent-Id: ' . VOICE_AGENT_ID;

$curl = curl_init();
curl_setopt_array($curl, array(
    CURLOPT_URL            => CHAT_API_URL,
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_CUSTOMREQUEST  => 'POST',
    CURLOPT_HTTPHEADER     => $curlHeaders,
    CURLOPT_POSTFIELDS     => json_encode($postData),
));

$response = curl_exec($curl);

if (curl_errno($curl)) {
    echo json_encode(['answer' => 'Curl error: ' . curl_error($curl), 'transfer' => false]);
    curl_close($curl);
    exit;
}
curl_close($curl);

$decodedResponse = json_decode($response, true);

if (json_last_error() === JSON_ERROR_NONE) {
    if (isset($decodedResponse['transfer']) && $decodedResponse['transfer'] === true) {
        $curl2 = curl_init();
        curl_setopt_array($curl2, array(
            CURLOPT_URL            => ESCALATION_API_URL,
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_CUSTOMREQUEST  => 'POST',
            CURLOPT_HTTPHEADER     => ['Content-Type: application/json'],
            CURLOPT_POSTFIELDS     => json_encode([
                'session_id' => $decodedResponse['session_id'] ?? '',
                'email'      => $decodedResponse['email'] ?? '',
            ]),
        ));
        curl_exec($curl2);
        curl_close($curl2);
    }
}

echo $response;
