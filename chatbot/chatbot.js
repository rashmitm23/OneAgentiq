/**
 * Floating Chatbot (#chat-circle)
 * Text chat → api/attachment.php (voice API)
 * Mic → VoiceChatClient (remote voice WebSocket)
 */
(function ($) {
  'use strict';

  var CONFIG = window.CHATBOT_CONFIG || {};
  var API_URL = CONFIG.apiUrl || 'api/attachment.php';
  var BOOTSTRAP_URL = CONFIG.voiceBootstrapUrl || 'api/voice_bootstrap.php';
  var BOT_IMG = CONFIG.botImg || 'https://cdn-icons-png.flaticon.com/512/10479/10479785.png';
  var PERSON_IMG = CONFIG.personImg || 'https://cdn-icons-png.flaticon.com/512/15735/15735374.png';
  var BOT_NAME = CONFIG.botName || 'OneAgentiq';
  var PERSON_NAME = CONFIG.personName || 'ME';

  var voiceSettings = {
    voiceApiBase: CONFIG.voiceApiBase || 'https://voice.oneagentiq.com',
    agentId: CONFIG.agentId || 'vc_agent_fcf07ddb25054de0',
    echoCancellation: CONFIG.echoCancellation !== false,
    clientJsUrl: CONFIG.clientJsUrl || 'https://voice.oneagentiq.com/voice-chat/client.js'
  };

  var chathistory = [];
  var chatUserName = '';
  var chatUserEmail = '';
  // Mic OFF → textSessionId; Mic ON → voiceSessionId (shared with voice bot)
  var textSessionId = '';
  var voiceSessionId = '';
  var voiceAgentId = voiceSettings.agentId;
  var feedbackDebounce = {};
  var recognition;
  var isListening = false;
  var voiceClient = null;
  var voiceActive = false;
  // Skip WS user transcript echo after we already showed a typed message
  var skipNextUserTranscript = '';

  function loadScript(src) {
    return new Promise(function (resolve, reject) {
      if (!src) {
        reject(new Error('No script URL'));
        return;
      }
      var existing = document.querySelector('script[data-voice-client="1"]');
      if (existing && typeof window.VoiceChatClient === 'function') {
        resolve();
        return;
      }
      var s = document.createElement('script');
      s.src = src;
      s.async = true;
      s.setAttribute('data-voice-client', '1');
      s.onload = function () { resolve(); };
      s.onerror = function () { reject(new Error('Failed to load ' + src)); };
      document.head.appendChild(s);
    });
  }

  function ensureVoiceClientScript() {
    if (typeof window.VoiceChatClient === 'function') {
      return Promise.resolve();
    }
    return loadScript(voiceSettings.clientJsUrl);
  }

  function applyBootstrap(data) {
    if (!data || typeof data !== 'object') return;
    if (data.voiceApiBase) voiceSettings.voiceApiBase = String(data.voiceApiBase).replace(/\/$/, '');
    if (data.agentId) {
      voiceSettings.agentId = data.agentId;
      if (!voiceAgentId) voiceAgentId = data.agentId;
    }
    if (typeof data.echoCancellation === 'boolean') {
      voiceSettings.echoCancellation = data.echoCancellation;
    }
    if (data.clientJsUrl) voiceSettings.clientJsUrl = data.clientJsUrl;
  }

  $(function () {
    var msgerInput = document.querySelector('.msger-input');
    var mic = document.querySelector('.mic');

    $('section.msger').show();
    localStorage.removeItem('chatUserName');
    localStorage.removeItem('chatUserEmail');
    localStorage.removeItem('chatSessionId');

    var randId = Math.floor(Math.random() * (9999 - 1000 + 1) + 1000);
    $('.guid').val(randId);

    var dt = new Date();
    var time = dt.getHours() + ':' + String(dt.getMinutes()).padStart(2, '0');
    $('#time').text(time);

    fetch(BOOTSTRAP_URL)
      .then(function (res) { return res.json(); })
      .then(applyBootstrap)
      .catch(function () { /* keep CHATBOT_CONFIG defaults */ });

    $('#chat-circle').on('click', function () {
      $('#chat-circle').toggle();
      $('.chat-box').toggle();
    });

    $('.chat-box-toggle').on('click', function () {
      $('#chat-circle').toggle();
      $('.chat-box').toggle();
      window.speechSynthesis.cancel();
      stopVoiceClient();
    });

    $(window).on('beforeunload', function () {
      window.speechSynthesis.cancel();
      stopVoiceClient();
    });

    $(document).on('mousedown', function (e) {
      var $chatBox = $('.chat-box');
      var $chatCircle = $('#chat-circle');
      if (
        $chatBox.is(':visible') &&
        !$chatBox.is(e.target) &&
        $chatBox.has(e.target).length === 0 &&
        !$chatCircle.is(e.target) &&
        $chatCircle.has(e.target).length === 0
      ) {
        $chatCircle.toggle();
        $chatBox.toggle();
        window.speechSynthesis.cancel();
        stopVoiceClient();
      }
    });

    $('form.msger-inputarea').on('submit', function (e) {
      e.preventDefault();
      var chatUserInput = ($('.msger-input').val() || '').trim();
      if (!chatUserInput) return;

      chathistory.push({ user: chatUserInput });
      appendMessage(PERSON_NAME, PERSON_IMG, 'right', chatUserInput, true);
      msgerInput.value = '';

      // Mic ON → one path only: send typed text over voice WebSocket
      if (voiceActive && voiceClient && typeof voiceClient.sendText === 'function') {
        skipNextUserTranscript = chatUserInput;
        try {
          voiceClient.sendText(chatUserInput, { source: 'chat' });
        } catch (err) {
          skipNextUserTranscript = '';
          botResponse('Voice session not ready. Please try again or turn the mic off to type.');
        }
        return;
      }

      $('#typing-indicator, #loaderDots').show();
      $('.msger-chat').scrollTop($('.msger-chat')[0].scrollHeight);

      // Mic OFF → separate text session via HTTP
      var activeSessionId = textSessionId;

      fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Session-Id': activeSessionId
        },
        body: JSON.stringify({
          email: chatUserEmail,
          name: chatUserName,
          history: chathistory,
          message: chatUserInput,
          session_id: activeSessionId,
          agent_id: voiceAgentId
        })
      })
        .then(function (res) { return res.json(); })
        .then(function (data) {
          if (data.session_id) textSessionId = data.session_id;
          if (data.agent_id) voiceAgentId = data.agent_id;
          var answer = formatBotHtml(data.answer || 'No response.');
          chathistory.push({ bot: answer });
          $('#typing-indicator, #loaderDots').hide();
          botResponse(answer, data.message_id || null);
        })
        .catch(function () {
          $('#typing-indicator, #loaderDots').hide();
          botResponse('Sorry, something went wrong. Please try again.');
        });
    });

    $(document).on('click', '.speak', function () {
      var synth = window.speechSynthesis;
      var img = $(this).find('img');
      if (synth.speaking) {
        synth.cancel();
        img.attr('src', 'https://cdn-icons-png.flaticon.com/512/727/727240.png');
      } else {
        var text = $(this).siblings('.msg-text').text();
        if (text.trim() !== '') {
          var utterance = new SpeechSynthesisUtterance(text);
          utterance.onend = function () {
            img.attr('src', 'https://cdn-icons-png.flaticon.com/512/727/727240.png');
          };
          synth.speak(utterance);
          img.attr('src', 'https://cdn-icons-png.flaticon.com/512/6996/6996058.png');
        }
      }
    });

    if (mic) {
      mic.addEventListener('click', function () {
        toggleVoiceOrRecognition(mic);
      });
    }

    function stopVoiceClient() {
      if (voiceClient && voiceActive) {
        try { voiceClient.stop(); } catch (e) { /* ignore */ }
      }
      voiceActive = false;
      voiceClient = null;
      isListening = false;
      skipNextUserTranscript = '';
      if (mic) mic.classList.remove('listening');
    }

    function toggleVoiceOrRecognition(micEl) {
      if (voiceActive) {
        stopVoiceClient();
        return;
      }
      if (isListening && recognition) {
        recognition.stop();
        isListening = false;
        micEl.classList.remove('listening');
        return;
      }

      ensureVoiceClientScript()
        .then(function () {
          if (typeof window.VoiceChatClient !== 'function') {
            throw new Error('VoiceChatClient missing');
          }
          startVoiceClient(micEl);
        })
        .catch(function () {
          micEl.classList.add('listening');
          startRecognition(micEl);
        });
    }

    function startVoiceClient(micEl) {
      // New mic session → new shared voice session (do not reuse prior voice id)
      voiceSessionId = '';

      // Link voice to website text session as external id only;
      // conversation session while mic is on is voiceSessionId.
      voiceClient = new window.VoiceChatClient({
        agentId: voiceAgentId || voiceSettings.agentId,
        baseUrl: voiceSettings.voiceApiBase,
        externalSessionId: textSessionId || '',
        echoCancellation: voiceSettings.echoCancellation
      });

      voiceClient.onTranscript = function (role, text) {
        if (!text || !String(text).trim()) return;
        var clean = String(text).trim();
        if (role === 'user') {
          // Already shown from typed send — skip WS echo
          if (
            skipNextUserTranscript &&
            clean.toLowerCase() === skipNextUserTranscript.toLowerCase()
          ) {
            skipNextUserTranscript = '';
            return;
          }
          chathistory.push({ user: clean });
          appendMessage(PERSON_NAME, PERSON_IMG, 'right', clean, true);
        } else {
          var answer = formatBotHtml(clean);
          chathistory.push({ bot: answer });
          botResponse(answer, null);
        }
      };

      voiceClient.onEvent = function (msg) {
        if (!msg) return;
        if (msg.session_id) voiceSessionId = msg.session_id;
        if (msg.type === 'session_started' && msg.session_id) {
          voiceSessionId = msg.session_id;
        }
        if (voiceClient && voiceClient.voiceSessionId) {
          voiceSessionId = voiceClient.voiceSessionId;
        }
        if (msg.agent_id) voiceAgentId = msg.agent_id;
      };

      voiceClient.onStatus = function (status) {
        if (status === 'connected' || status === 'listening' || status === 'started') {
          voiceActive = true;
          isListening = true;
          micEl.classList.add('listening');
          if (voiceClient && voiceClient.voiceSessionId) {
            voiceSessionId = voiceClient.voiceSessionId;
          }
        }
        if (status === 'stopped' || status === 'disconnected' || status === 'ended') {
          // Mic off → typed chat returns to separate textSessionId
          voiceActive = false;
          isListening = false;
          micEl.classList.remove('listening');
        }
      };

      voiceClient.onError = function () {
        stopVoiceClient();
        botResponse('Voice connection failed. You can still type your message.');
      };

      Promise.resolve(voiceClient.start())
        .then(function () {
          voiceActive = true;
          isListening = true;
          micEl.classList.add('listening');
          if (voiceClient && voiceClient.voiceSessionId) {
            voiceSessionId = voiceClient.voiceSessionId;
          }
        })
        .catch(function () {
          stopVoiceClient();
          micEl.classList.add('listening');
          startRecognition(micEl);
        });
    }

    function startRecognition(micEl) {
      var SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (!SpeechRecognition) {
        alert('Speech recognition is not supported in this browser.');
        isListening = false;
        if (micEl) micEl.classList.remove('listening');
        return;
      }

      recognition = new SpeechRecognition();
      recognition.lang = 'en-US';
      recognition.interimResults = true;
      recognition.continuous = false;
      recognition.maxAlternatives = 1;

      var finalTranscript = '';
      isListening = true;

      recognition.onresult = function (event) {
        var interimTranscript = '';
        for (var i = event.resultIndex; i < event.results.length; i++) {
          var transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript + ' ';
          } else {
            interimTranscript += transcript;
          }
        }
        document.querySelector('.msger-input').value = (finalTranscript + interimTranscript).trim();
      };

      recognition.onend = function () {
        var message = document.querySelector('.msger-input').value.trim();
        if (message !== '') {
          $('form.msger-inputarea').trigger('submit');
        }
        finalTranscript = '';
        isListening = false;
        if (micEl) micEl.classList.remove('listening');
      };

      recognition.onerror = function (event) {
        console.error('Speech error:', event.error);
        isListening = false;
        if (micEl) micEl.classList.remove('listening');
      };

      recognition.start();
    }
  });

  function convertMarkdownToHtml(markdown) {
    if (!markdown) return '';
    return String(markdown)
      .replace(/^### (.*$)/gm, '<h3>$1</h3>')
      .replace(/^## (.*$)/gm, '<h2>$1</h2>')
      .replace(/^# (.*$)/gm, '<h1>$1</h1>')
      .replace(/(\*\*|__)(.*?)\1/g, '<strong>$2</strong>')
      .replace(/(\*|_)(.*?)\1/g, '<em>$2</em>')
      .replace(/`(.*?)`/g, '<code>$1</code>')
      .replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>')
      .replace(/(?:^|\n)[*-] (.*)/g, '<ul><li>$1</li></ul>')
      .replace(/<\/ul>\n<ul>/g, '')
      .replace(/^> (.*$)/gm, '<blockquote>$1</blockquote>')
      .replace(/\n/g, '<br>');
  }

  function linkifyUrl(url) {
    var trailingPunct = '';
    var trailingMatch = url.match(/[.,!?;:)]+$/);
    if (trailingMatch) {
      trailingPunct = trailingMatch[0];
      url = url.slice(0, -trailingPunct.length);
    }
    if (!url) return trailingPunct;
    var href = url.indexOf('www.') === 0 ? 'https://' + url : url;
    return '<a href="' + href + '" target="_blank" rel="noopener noreferrer">' + url + '</a>' + trailingPunct;
  }

  function convertUrlsToLinks(text) {
    if (!text) return text;
    text = String(text);
    // Keep existing <a> tags; only linkify plain URLs outside them
    return text.replace(/(<a\b[^>]*>[\s\S]*?<\/a>)|(https?:\/\/[^\s<>"']+|www\.[^\s<>"']+)/gi, function (match, anchor, url) {
      if (anchor) return anchor;
      return linkifyUrl(url);
    });
  }

  function formatBotHtml(text) {
    return convertUrlsToLinks(convertMarkdownToHtml(text));
  }

  function formatDate(date) {
    var h = '0' + date.getHours();
    var m = '0' + date.getMinutes();
    return h.slice(-2) + ':' + m.slice(-2);
  }

  function saveChatToHistory(name, img, side, text) {
    var savedChats = sessionStorage.getItem('chatHistory');
    var chats = savedChats ? JSON.parse(savedChats) : [];
    chats.push({ name: name, img: img, side: side, text: text });
    sessionStorage.setItem('chatHistory', JSON.stringify(chats));
  }

  function appendMessage(name, img, side, text, saveToHistory) {
    var processedText = convertUrlsToLinks(text);
    var msgHTML =
      '<div class="msg ' + side + '-msg">' +
        '<div class="msg-img" style="background-image: url(' + img + ')"></div>' +
        '<div class="msg-bubble">' +
          '<div class="msg-info">' +
            '<div class="msg-info-name">' + name + '</div>' +
            '<div class="msg-info-time">' + formatDate(new Date()) + '</div>' +
          '</div>' +
          '<div class="msg-text">' + processedText + '</div>' +
          '<div class="speak speack">' +
            '<img src="https://cdn-icons-png.flaticon.com/512/727/727240.png">' +
          '</div>' +
        '</div>' +
      '</div>';

    document.querySelector('#loaderDots').insertAdjacentHTML('beforebegin', msgHTML);
    $('.msger-chat').scrollTop($('.msger-chat')[0].scrollHeight);
    if (saveToHistory) saveChatToHistory(name, img, side, text);
  }

  function generateMsgUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
      var r = (Math.random() * 16) | 0;
      var v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }

  function botResponse(msgText, messageId) {
    if (!messageId) messageId = generateMsgUUID();
    var fid = 'fb-' + messageId.replace(/-/g, '');
    var msgHTML =
      '<div class="msg left-msg">' +
        '<div class="msg-img" style="background-image: url(' + BOT_IMG + ')"></div>' +
        '<div class="msg-bubble">' +
          '<div class="msg-info">' +
            '<div class="msg-info-name">' + BOT_NAME + '</div>' +
            '<div class="msg-info-time">' + formatDate(new Date()) + '</div>' +
          '</div>' +
          '<div class="msg-text">' + msgText + '</div>' +
          '<div class="speak speack">' +
            '<img src="https://cdn-icons-png.flaticon.com/512/727/727240.png">' +
          '</div>' +
          '<div class="msg-feedback" id="' + fid + '" data-message-id="' + messageId + '">' +
            '<button class="feedback-btn thumbs-up" title="Helpful" onclick="window.submitFeedback(\'' + fid + '\', \'up\')">' +
              '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="14" height="14" fill="currentColor"><path d="M1 21h4V9H1v12zm22-11c0-1.1-.9-2-2-2h-6.31l.95-4.57.03-.32c0-.41-.17-.79-.44-1.06L14.17 1 7.59 7.59C7.22 7.95 7 8.45 7 9v10c0 1.1.9 2 2 2h9c.83 0 1.54-.5 1.84-1.22l3.02-7.05c.09-.23.14-.47.14-.73v-2z"/></svg>' +
            '</button>' +
            '<button class="feedback-btn thumbs-down" title="Not helpful" onclick="window.submitFeedback(\'' + fid + '\', \'down\')">' +
              '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="14" height="14" fill="currentColor"><path d="M15 3H6c-.83 0-1.54.5-1.84 1.22l-3.02 7.05c-.09.23-.14.47-.14.73v2c0 1.1.9 2 2 2h6.31l-.95 4.57-.03.32c0 .41.17.79.44 1.06L10.83 23l6.59-6.59c.36-.36.58-.86.58-1.41V5c0-1.1-.9-2-2-2zm4 0v12h4V3h-4z"/></svg>' +
            '</button>' +
          '</div>' +
        '</div>' +
      '</div>';

    document.querySelector('#loaderDots').insertAdjacentHTML('beforebegin', msgHTML);
    $('.msger-chat').scrollTop($('.msger-chat')[0].scrollHeight);
    saveChatToHistory(BOT_NAME, BOT_IMG, 'left', msgText);
  }

  window.submitFeedback = function (fid, type) {
    if (feedbackDebounce[fid]) return;
    feedbackDebounce[fid] = true;
    setTimeout(function () { feedbackDebounce[fid] = false; }, 500);

    var container = document.getElementById(fid);
    var messageId = container.getAttribute('data-message-id');
    var thumbsUp = container.querySelector('.thumbs-up');
    var thumbsDown = container.querySelector('.thumbs-down');
    var prevType = container.getAttribute('data-feedback') || '';

    thumbsUp.classList.toggle('active-up', type === 'up');
    thumbsDown.classList.toggle('active-down', type === 'down');
    container.setAttribute('data-feedback', type);
    thumbsUp.disabled = true;
    thumbsDown.disabled = true;

    fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        feedback_type: type === 'up' ? 'positive' : 'negative',
        message_id: messageId
      })
    })
      .then(function (res) {
        if (!res.ok) throw new Error('HTTP ' + res.status);
        return res.json().catch(function () { return {}; });
      })
      .then(function () {
        thumbsUp.disabled = false;
        thumbsDown.disabled = false;
      })
      .catch(function () {
        thumbsUp.classList.toggle('active-up', prevType === 'up');
        thumbsDown.classList.toggle('active-down', prevType === 'down');
        container.setAttribute('data-feedback', prevType);
        thumbsUp.disabled = false;
        thumbsDown.disabled = false;
        window.showFeedbackToast('Could not submit feedback.', fid, type);
      });
  };

  window.showFeedbackToast = function (message, fid, retryType) {
    var old = document.getElementById('feedback-toast');
    if (old) old.remove();
    var toast = document.createElement('div');
    toast.id = 'feedback-toast';
    toast.className = 'feedback-toast';
    toast.innerHTML =
      '<span class="toast-msg">' + message + '</span>' +
      '<button class="toast-retry" onclick="window.retryFeedback(\'' + fid + '\', \'' + retryType + '\')">Retry</button>' +
      '<button class="toast-close" onclick="this.parentElement.remove()">&#x2715;</button>';
    document.querySelector('.msger').appendChild(toast);
    setTimeout(function () { if (toast.parentElement) toast.remove(); }, 5000);
  };

  window.retryFeedback = function (fid, type) {
    var old = document.getElementById('feedback-toast');
    if (old) old.remove();
    window.submitFeedback(fid, type);
  };
})(jQuery);
