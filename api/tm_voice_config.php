<?php
/**
 * TM Chatbot — Voice integration config (copy this file to your PHP chat folder).
 *
 * Edit per environment / company. Frontend can override agent_id via chat API response.
 */

// Voice API (tm-own FastAPI) — no trailing slash
// e.g. http://127.0.0.1:8000 or https://voice-api.technologymindz.com
define('TM_VOICE_API_BASE', 'https://voice.oneagentiq.com');

// Fallback when demo-api does not return agent_id yet (per-company embed)
define('TM_VOICE_AGENT_ID_DEFAULT', 'vc_agent_fcf07ddb25054de0');

// Disable echo cancellation if the bot cannot hear you over speakers (try false)
define('TM_VOICE_ECHO_CANCELLATION', true);

// Load VoiceChatClient from voice server (recommended)
define('TM_VOICE_USE_REMOTE_CLIENT', true);

// If false, set path to local copy of voice_chat_client.js (same folder as chat)
// define('TM_VOICE_CLIENT_JS_LOCAL', 'tm_voice_client.js');

// --- Text chat (typed messages via attachment.php) ---
// POST {TM_VOICE_API_BASE}{TM_VOICE_TEXT_CHAT_PATH} — replaces demo-api /chatbot/chat/
define('TM_VOICE_TEXT_CHAT_PATH', '/voice-chat/chat');

// Set false to roll back typed chat to demo-api (Phase 2 reads this in attachment.php)
define('TM_USE_VOICE_TEXT_CHAT', true);

// Feedback + message_id registration stay on demo-api (voice chat has no message_id)
define('TM_DEMO_API_CHAT', 'https://demo-api.technologymindz.net/api/chatbot/chat/');
define('TM_CHAT_FEEDBACK_API', 'https://demo-api.technologymindz.net/api/chatbot/chat/feedback');
