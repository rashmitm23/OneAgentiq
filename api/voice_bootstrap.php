<?php
/**
 * Expose voice chatbot settings to the frontend (JSON).
 */
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

require_once __DIR__ . '/tm_voice_config.php';

$base = rtrim(TM_VOICE_API_BASE, '/');
$clientJs = defined('TM_VOICE_USE_REMOTE_CLIENT') && TM_VOICE_USE_REMOTE_CLIENT
    ? $base . '/voice-chat/client.js'
    : (defined('TM_VOICE_CLIENT_JS_LOCAL') ? TM_VOICE_CLIENT_JS_LOCAL : '');

echo json_encode([
    'voiceApiBase'      => $base,
    'agentId'           => TM_VOICE_AGENT_ID_DEFAULT,
    'echoCancellation'  => (bool) TM_VOICE_ECHO_CANCELLATION,
    'useRemoteClient'   => (bool) TM_VOICE_USE_REMOTE_CLIENT,
    'clientJsUrl'       => $clientJs,
    'useVoiceTextChat'  => (bool) TM_USE_VOICE_TEXT_CHAT,
]);
