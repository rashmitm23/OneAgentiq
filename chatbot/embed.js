/**
 * Injects floating chatbot markup (CSS stays in chatbot/chatbot.css),
 * then loads chatbot.js. Include after jQuery + CHATBOT_CONFIG.
 */
(function () {
  'use strict';

  if (document.querySelector('.chatbot-footer')) {
    loadChatbotJs();
    return;
  }

  var html =
    '<div class="chatbot-footer">' +
      '<div id="chat-circle" class="btn btn-raised">' +
        '<div id="chat-overlay"></div>' +
        '<i style="color:#fff;">' +
          '<svg fill="#FFFFFF" height="24" viewBox="0 0 24 24" width="24" xmlns="http://www.w3.org/2000/svg">' +
            '<path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"></path>' +
            '<path d="M0 0h24v24H0z" fill="none"></path>' +
          '</svg>' +
        '</i>' +
      '</div>' +
      '<div class="chat-box">' +
        '<section class="msger" style="display:none;">' +
          '<header class="msger-header">' +
            '<div class="msger-header-title">' +
              '<img src="https://cdn-icons-png.flaticon.com/512/10479/10479785.png" alt="Bot" style="width:40px;border-radius:50%;">' +
            '</div>' +
            '<div class="msger-header-options">' +
              '<span class="chat-box-toggle"><i class="fa-solid fa-xmark"></i></span>' +
            '</div>' +
          '</header>' +
          '<main class="msger-chat">' +
            '<div class="msg left-msg">' +
              '<div class="msg-img" style="background-image:url(https://cdn-icons-png.flaticon.com/512/10479/10479785.png)"></div>' +
              '<div class="msg-bubble">' +
                '<div class="msg-info">' +
                  '<div class="msg-info-name">OneAgentiq</div>' +
                  '<div class="msg-info-time" id="time"></div>' +
                '</div>' +
                '<div class="msg-text">Welcome! How can I help you today?</div>' +
                '<div class="speack speak">' +
                  '<img src="https://cdn-icons-png.flaticon.com/512/727/727240.png" alt="Speak">' +
                '</div>' +
              '</div>' +
            '</div>' +
            '<div class="msg left-msg" id="loaderDots" style="display:none;">' +
              '<div class="msg-img" style="background-image:url(https://cdn-icons-png.flaticon.com/512/10479/10479785.png)"></div>' +
              '<div class="msg-bubble">' +
                '<div class="msg-info">' +
                  '<div class="msg-info-name">OneAgentiq</div>' +
                  '<div class="msg-info-time"></div>' +
                '</div>' +
                '<div class="msg-text">' +
                  '<div class="typing-indicator" id="typing-indicator">' +
                    '<span></span><span></span><span></span>' +
                  '</div>' +
                '</div>' +
              '</div>' +
            '</div>' +
          '</main>' +
          '<form class="msger-inputarea">' +
            '<input type="text" name="text" class="msger-input" placeholder="Type your message" style="padding:0;">' +
            '<label class="filelabel">' +
              '<i class="fa fa-paperclip"></i>' +
              '<input class="FileUpload1" id="FileInput" name="attachment" type="file">' +
            '</label>' +
            '<input type="hidden" name="guid" class="guid" value="">' +
            '<button type="button" class="mic"><i class="fa fa-microphone"></i></button>' +
            '<button type="submit" class="msger-send-btn" style="padding:0;margin-left:0;" aria-label="Send">' +
              '<i class="fa-solid fa-paper-plane"></i>' +
            '</button>' +
          '</form>' +
        '</section>' +
      '</div>' +
    '</div>';

  function inject() {
    document.body.insertAdjacentHTML('beforeend', html);
    loadChatbotJs();
  }

  function loadChatbotJs() {
    if (document.querySelector('script[data-chatbot-js="1"]')) return;
    var scriptEl = document.currentScript;
    var base = 'chatbot/chatbot.js';
    if (scriptEl && scriptEl.src) {
      base = scriptEl.src.replace(/embed\.js(?:\?.*)?$/i, 'chatbot.js');
    }
    var s = document.createElement('script');
    s.src = base;
    s.setAttribute('data-chatbot-js', '1');
    document.body.appendChild(s);
  }

  if (document.body) {
    inject();
  } else {
    document.addEventListener('DOMContentLoaded', inject);
  }
})();
