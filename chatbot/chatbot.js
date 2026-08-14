/**
 * Floating Chatbot (#chat-circle)
 * One conversation session. Text and voice are modes on the same session.
 */
(function ($) {
  'use strict';

  var CONFIG = window.CHATBOT_CONFIG || {};
  var API_URL = CONFIG.apiUrl || 'api/attachment.php';
  var BOT_IMG = CONFIG.botImg || 'https://cdn-icons-png.flaticon.com/512/10479/10479785.png';
  var PERSON_IMG = CONFIG.personImg || 'https://cdn-icons-png.flaticon.com/512/15735/15735374.png';
  var BOT_NAME = CONFIG.botName || 'Technology Mindz';
  var PERSON_NAME = CONFIG.personName || 'ME';
  var VOICE_AGENT_ID = CONFIG.voiceAgentId || 'vc_agent_fcf07ddb25054de0';
  var SESSION_KEY = 'oneagentiqChatSessionId';

  var chathistory = [];
  var chatUserName = '';
  var chatUserEmail = '';
  var chatSessionId = '';
  var chatMode = 'text';
  var isSending = false;
  var isListening = false;
  var ignoreRecognitionEnd = false;
  var sendQueue = [];
  var feedbackDebounce = {};
  var recognition;

  $(function () {
    var msgerInput = document.querySelector('.msger-input');
    var mic = document.querySelector('.mic');
    var voiceBar = document.getElementById('voiceModeBar');
    var voiceStop = document.getElementById('voiceModeStop');
    var voiceLive = document.getElementById('voiceLiveText');
    var footer = document.querySelector('.chatbot-footer');

    $('section.msger').show();
    localStorage.removeItem('chatUserName');
    localStorage.removeItem('chatUserEmail');

    chatSessionId = sessionStorage.getItem(SESSION_KEY) || '';
    if (!chatSessionId) {
      chatSessionId = generateMsgUUID();
      sessionStorage.setItem(SESSION_KEY, chatSessionId);
    }

    var randId = Math.floor(Math.random() * (9999 - 1000 + 1) + 1000);
    $('.guid').val(randId);

    var dt = new Date();
    var time = dt.getHours() + ':' + String(dt.getMinutes()).padStart(2, '0');
    $('#time').text(time);

    function closeChat() {
      exitVoiceMode();
      $('#chat-circle').show();
      $('.chat-box').hide();
      window.speechSynthesis.cancel();
    }

    $('#chat-circle').on('click', function () {
      $('#chat-circle').hide();
      $('.chat-box').show();
    });

    $('.chat-box-toggle').on('click', function () {
      closeChat();
    });

    $(window).on('beforeunload', function () {
      window.speechSynthesis.cancel();
      stopRecognition(true);
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
        closeChat();
      }
    });

    $('form.msger-inputarea').on('submit', function (e) {
      e.preventDefault();
      var chatUserInput = (msgerInput.value || '').trim();
      if (!chatUserInput) return;
      msgerInput.value = '';
      sendToBot(chatUserInput, false);
    });

    if (mic) {
      mic.addEventListener('click', function () {
        if (chatMode === 'voice') {
          exitVoiceMode();
        } else {
          enterVoiceMode();
        }
      });
    }

    if (voiceStop) {
      voiceStop.addEventListener('click', function () {
        exitVoiceMode();
      });
    }

    $(document).on('click', '.speak', function () {
      var synth = window.speechSynthesis;
      var img = $(this).find('img');
      if (synth.speaking) {
        synth.cancel();
        img.attr('src', 'https://cdn-icons-png.flaticon.com/512/727/727240.png');
      } else {
        var text = $(this).siblings('.msg-text').text();
        if (text.trim() !== '') {
          speakText(text, function () {
            img.attr('src', 'https://cdn-icons-png.flaticon.com/512/727/727240.png');
          });
          img.attr('src', 'https://cdn-icons-png.flaticon.com/512/6996/6996058.png');
        }
      }
    });

    function enterVoiceMode() {
      var SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (!SpeechRecognition) {
        alert('Speech recognition is not supported in this browser.');
        return;
      }

      chatMode = 'voice';
      if (footer) footer.classList.add('voice-active');
      if (voiceBar) voiceBar.hidden = false;
      if (voiceLive) voiceLive.textContent = 'Listening…';
      if (mic) {
        mic.classList.add('listening');
        mic.setAttribute('aria-pressed', 'true');
        mic.title = 'Stop voice';
      }
      if (msgerInput) {
        msgerInput.disabled = false;
        msgerInput.placeholder = 'Type or speak — both stay on';
      }
      startRecognition();
    }

    function exitVoiceMode() {
      chatMode = 'text';
      stopRecognition(true);
      window.speechSynthesis.cancel();
      if (footer) footer.classList.remove('voice-active');
      if (voiceBar) voiceBar.hidden = true;
      if (voiceLive) voiceLive.textContent = '';
      if (mic) {
        mic.classList.remove('listening');
        mic.setAttribute('aria-pressed', 'false');
        mic.title = 'Talk with voice';
      }
      if (msgerInput) {
        msgerInput.disabled = false;
        msgerInput.placeholder = 'Type your message';
      }
    }

    function stopRecognition(force) {
      ignoreRecognitionEnd = !!force;
      isListening = false;
      if (recognition) {
        try { recognition.stop(); } catch (err) {}
        recognition = null;
      }
    }

    function startRecognition() {
      var SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (!SpeechRecognition || chatMode !== 'voice') return;

      stopRecognition(true);
      ignoreRecognitionEnd = false;
      isListening = true;

      recognition = new SpeechRecognition();
      recognition.lang = 'en-US';
      recognition.interimResults = true;
      recognition.continuous = false;
      recognition.maxAlternatives = 1;

      var finalTranscript = '';

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
        if (voiceLive) {
          voiceLive.textContent = (finalTranscript + interimTranscript).trim() || 'Listening…';
        }
      };

      recognition.onend = function () {
        var shouldIgnore = ignoreRecognitionEnd;
        ignoreRecognitionEnd = false;
        isListening = false;
        recognition = null;

        if (shouldIgnore || chatMode !== 'voice') return;

        var message = (finalTranscript || '').trim();
        finalTranscript = '';
        if (voiceLive) voiceLive.textContent = message ? '' : 'Listening…';

        if (message) {
          sendToBot(message, true);
        }
        if (chatMode === 'voice') startRecognition();
      };

      recognition.onerror = function (event) {
        console.error('Speech error:', event.error);
        isListening = false;
        if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
          exitVoiceMode();
        }
      };

      try {
        recognition.start();
      } catch (err) {
        console.error('Speech start error:', err);
      }
    }

    function sendToBot(text, fromVoice) {
      if (!text) return;
      sendQueue.push({ text: text, fromVoice: !!fromVoice });
      flushSendQueue();
    }

    function flushSendQueue() {
      if (isSending || !sendQueue.length) return;
      var item = sendQueue.shift();
      isSending = true;

      chathistory.push({ user: item.text });
      appendMessage(PERSON_NAME, PERSON_IMG, 'right', item.text, true);

      $('#typing-indicator, #loaderDots').show();
      $('.msger-chat').scrollTop($('.msger-chat')[0].scrollHeight);

      fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Session-Id': chatSessionId
        },
        body: JSON.stringify({
          email: chatUserEmail,
          name: chatUserName,
          history: chathistory,
          session_id: chatSessionId,
          mode: item.fromVoice ? 'voice' : 'text',
          agent_id: VOICE_AGENT_ID
        })
      })
        .then(function (res) { return res.json(); })
        .then(function (data) {
          if (data && data.session_id) {
            chatSessionId = data.session_id;
            sessionStorage.setItem(SESSION_KEY, chatSessionId);
          }

          var answer = convertMarkdownToHtml(data.answer || 'No response.');
          chathistory.push({ bot: answer });
          $('#typing-indicator, #loaderDots').hide();
          botResponse(answer, data.message_id || null);

          isSending = false;

          if (item.fromVoice || chatMode === 'voice') {
            stopRecognition(true);
            speakText(htmlToPlain(answer), function () {
              if (chatMode === 'voice') startRecognition();
              flushSendQueue();
            });
          } else {
            flushSendQueue();
          }
        })
        .catch(function () {
          $('#typing-indicator, #loaderDots').hide();
          botResponse('Sorry, something went wrong. Please try again.');
          isSending = false;
          flushSendQueue();
        });
    }

    function speakText(text, onEnd) {
      var synth = window.speechSynthesis;
      if (!synth || !text) {
        if (onEnd) onEnd();
        return;
      }
      synth.cancel();
      var utterance = new SpeechSynthesisUtterance(text);
      utterance.onend = function () { if (onEnd) onEnd(); };
      utterance.onerror = function () { if (onEnd) onEnd(); };
      synth.speak(utterance);
    }
  });

  function htmlToPlain(html) {
    var el = document.createElement('div');
    el.innerHTML = html || '';
    return (el.textContent || el.innerText || '').trim();
  }

  function convertMarkdownToHtml(markdown) {
    if (!markdown) return '';
    return String(markdown)
      .replace(/^### (.*$)/gm, '<h3>$1</h3>')
      .replace(/^## (.*$)/gm, '<h2>$1</h2>')
      .replace(/^# (.*$)/gm, '<h1>$1</h1>')
      .replace(/(\*\*|__)(.*?)\1/g, '<strong>$2</strong>')
      .replace(/(\*|_)(.*?)\1/g, '<em>$2</em>')
      .replace(/`(.*?)`/g, '<code>$1</code>')
      .replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2">$1</a>')
      .replace(/(?:^|\n)[*-] (.*)/g, '<ul><li>$1</li></ul>')
      .replace(/<\/ul>\n<ul>/g, '')
      .replace(/^> (.*$)/gm, '<blockquote>$1</blockquote>')
      .replace(/\n/g, '<br>');
  }

  function convertUrlsToLinks(text) {
    if (!text) return text;
    text = String(text);
    var urlPattern = /(https?:\/\/[^\s<>"']+|www\.[^\s<>"']+)/gi;
    return text.replace(urlPattern, function (url) {
      var trailingPunct = '';
      var trailingMatch = url.match(/[.,!?;:)]+$/);
      if (trailingMatch) {
        trailingPunct = trailingMatch[0];
        url = url.slice(0, -trailingPunct.length);
      }
      var href = url.startsWith('www.') ? 'https://' + url : url;
      return '<a href="' + href + '" target="_blank" rel="noopener noreferrer" style="color:#1665c4;text-decoration:underline;">' + url + '</a>' + trailingPunct;
    });
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
