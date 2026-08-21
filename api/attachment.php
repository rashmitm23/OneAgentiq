<?php
/**
 * Chatbot API proxy
 * Typed chat → voice API when TM_USE_VOICE_TEXT_CHAT is true
 * Feedback → demo-api (voice chat has no message_id)
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, X-Session-Id');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

require_once __DIR__ . '/tm_voice_config.php';

define('CHAT_API_URL', TM_DEMO_API_CHAT);
define('FEEDBACK_API_URL', TM_CHAT_FEEDBACK_API);
define('ESCALATION_API_URL', 'https://demo-api.technologymindz.net/api/chatbot/escalations/send');
define('DEFAULT_EMAIL', 'visitor@example.com');
define('DEFAULT_NAME', 'Visitor');

$voiceApiBase = rtrim(TM_VOICE_API_BASE, '/');
$voiceTextChatUrl = $voiceApiBase . TM_VOICE_TEXT_CHAT_PATH;

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
$agentId   = isset($data['agent_id'])   ? trim($data['agent_id'])   : '';
$message   = isset($data['message'])    ? trim($data['message'])    : '';

if ($sessionId === '') {
    $sessionId = isset($_SERVER['HTTP_X_SESSION_ID']) ? trim($_SERVER['HTTP_X_SESSION_ID']) : '';
}

if ($agentId === '') {
    $agentId = TM_VOICE_AGENT_ID_DEFAULT;
}

if ($message === '' && is_array($history)) {
    for ($i = count($history) - 1; $i >= 0; $i--) {
        if (!empty($history[$i]['user'])) {
            $message = trim($history[$i]['user']);
            break;
        }
    }
}

if ($message === '' && !$history) {
    echo json_encode(['answer' => 'No valid input provided.', 'transfer' => false]);
    exit;
}

$emailOut = $email !== '' ? $email : DEFAULT_EMAIL;
$nameOut  = $name !== '' ? $name : DEFAULT_NAME;

// --- Voice text chat (OneAgentiq knowledge / voice API) ---
if (TM_USE_VOICE_TEXT_CHAT) {
    if ($message === '') {
        echo json_encode(['answer' => 'No valid input provided.', 'transfer' => false]);
        exit;
    }

    $postData = [
        'message'  => $message,
        'agent_id' => $agentId,
        'email'    => $emailOut,
        'name'     => $nameOut,
    ];
    if ($sessionId !== '') {
        $postData['session_id'] = $sessionId;
        $postData['external_session_id'] = $sessionId;
    }

    $curl = curl_init();
    curl_setopt_array($curl, array(
        CURLOPT_URL            => $voiceTextChatUrl,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_CUSTOMREQUEST  => 'POST',
        CURLOPT_HTTPHEADER     => ['Content-Type: application/json'],
        CURLOPT_POSTFIELDS     => json_encode($postData),
        CURLOPT_TIMEOUT        => 60,
    ));

    $response = curl_exec($curl);

    if (curl_errno($curl)) {
        echo json_encode(['answer' => 'Curl error: ' . curl_error($curl), 'transfer' => false]);
        curl_close($curl);
        exit;
    }
    curl_close($curl);

    $decodedResponse = json_decode($response, true);
    if (json_last_error() === JSON_ERROR_NONE && is_array($decodedResponse)) {
        if (empty($decodedResponse['agent_id'])) {
            $decodedResponse['agent_id'] = $agentId;
        }
        echo json_encode($decodedResponse);
        exit;
    }

    echo $response;
    exit;
}

// --- Legacy demo-api chat ---
if (!$history) {
    echo json_encode(['answer' => 'No valid input provided.', 'transfer' => false]);
    exit;
}

$postData = [
    'history' => $history,
    'email'   => $emailOut,
    'name'    => $nameOut,
];

$curlHeaders = ['Content-Type: application/json'];
if ($sessionId !== '') {
    $curlHeaders[] = 'X-Session-Id: ' . $sessionId;
}

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
