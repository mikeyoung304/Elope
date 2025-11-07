/**
 * MAIS Embeddable Widget SDK
 *
 * Usage:
 * <script src="https://widget.mais.com/sdk/mais-sdk.js"
 *         data-tenant="bellaweddings"
 *         data-api-key="pk_live_bellaweddings_a3f8c9d2e1b4f7g8">
 * </script>
 * <div id="mais-widget"></div>
 *
 * Lightweight loader (<3KB gzipped) that:
 * 1. Creates iframe with widget application
 * 2. Handles postMessage communication
 * 3. Auto-resizes iframe based on content
 * 4. Applies tenant branding
 */

(function() {
  'use strict';

  // Get current script tag for configuration
  var currentScript = document.currentScript;
  if (!currentScript) {
    console.error('[MAIS SDK] document.currentScript not supported');
    return;
  }

  // Extract configuration
  var config = {
    tenant: currentScript.getAttribute('data-tenant'),
    apiKey: currentScript.getAttribute('data-api-key'),
    containerId: currentScript.getAttribute('data-container') || 'mais-widget',
    mode: currentScript.getAttribute('data-mode') || 'embedded', // or 'modal'
  };

  // Validate configuration
  if (!config.tenant || !config.apiKey) {
    console.error('[MAIS SDK] Missing required attributes: data-tenant, data-api-key');
    return;
  }

  // API key format validation
  if (!config.apiKey.match(/^pk_live_[a-z0-9-]+_[a-f0-9]{16}$/)) {
    console.error('[MAIS SDK] Invalid API key format');
    return;
  }

  // Widget environment
  var widgetBaseUrl = currentScript.src.indexOf('localhost') !== -1
    ? 'http://localhost:5173'
    : 'https://widget.mais.com';

  /**
   * MAIS Widget Client
   */
  function MAISWidget(config) {
    this.config = config;
    this.iframe = null;
    this.container = null;
    this.loaded = false;
    this.messageHandlers = {};
    this._handleMessage = this._createMessageHandler();
  }

  /**
   * Create message handler with proper context binding
   */
  MAISWidget.prototype._createMessageHandler = function() {
    var self = this;
    return function(event) {
      self.handleMessage(event);
    };
  };

  /**
   * Initialize widget
   */
  MAISWidget.prototype.init = function() {
    // Find container
    this.container = document.getElementById(this.config.containerId);
    if (!this.container) {
      console.error('[MAIS SDK] Container not found: #' + this.config.containerId);
      return;
    }

    // Create iframe
    this.iframe = document.createElement('iframe');
    this.iframe.src = this.buildWidgetUrl();
    this.iframe.style.cssText =
      'width: 100%;' +
      'border: none;' +
      'display: block;' +
      'min-height: 600px;' +
      'background: transparent;';
    this.iframe.setAttribute('scrolling', 'no');
    this.iframe.setAttribute('title', 'MAIS Wedding Booking Widget');

    // Setup message listener BEFORE appending iframe
    window.addEventListener('message', this._handleMessage);

    // Append iframe
    this.container.appendChild(this.iframe);

    console.log('[MAIS SDK] Widget initialized:', this.config.tenant);
  };

  /**
   * Build widget iframe URL
   */
  MAISWidget.prototype.buildWidgetUrl = function() {
    var params = [
      'tenant=' + encodeURIComponent(this.config.tenant),
      'apiKey=' + encodeURIComponent(this.config.apiKey),
      'mode=' + encodeURIComponent(this.config.mode),
      'parentOrigin=' + encodeURIComponent(window.location.origin)
    ];
    return widgetBaseUrl + '?' + params.join('&');
  };

  /**
   * Handle postMessage from iframe
   */
  MAISWidget.prototype.handleMessage = function(event) {
    // SECURITY: Validate origin
    if (event.origin !== widgetBaseUrl) {
      return;
    }

    var message = event.data;

    // Validate message format
    if (!message || message.source !== 'mais-widget') {
      return;
    }

    // Handle message types
    switch (message.type) {
      case 'READY':
        this.loaded = true;
        console.log('[MAIS SDK] Widget loaded');
        this.emit('ready');
        break;

      case 'RESIZE':
        // Auto-resize iframe based on content height
        if (this.iframe && message.height) {
          this.iframe.style.height = message.height + 'px';
        }
        break;

      case 'BOOKING_CREATED':
        console.log('[MAIS SDK] Booking created:', message.bookingId);
        this.emit('bookingCreated', message);
        break;

      case 'BOOKING_COMPLETED':
        console.log('[MAIS SDK] Booking completed:', message.bookingId);
        this.emit('bookingCompleted', message);

        // Optional: Redirect to success page
        if (message.returnUrl) {
          window.location.href = message.returnUrl;
        }
        break;

      case 'ERROR':
        console.error('[MAIS SDK] Widget error:', message.error);
        this.emit('error', message);
        break;

      default:
        console.warn('[MAIS SDK] Unknown message type:', message.type);
    }
  };

  /**
   * Send message to iframe
   */
  MAISWidget.prototype.sendMessage = function(type, data) {
    if (!this.iframe || !this.iframe.contentWindow) {
      console.warn('[MAIS SDK] Widget not ready');
      return;
    }

    var messageData = {
      source: 'mais-parent',
      type: type
    };

    // Merge data object into messageData
    if (data) {
      for (var key in data) {
        if (data.hasOwnProperty(key)) {
          messageData[key] = data[key];
        }
      }
    }

    this.iframe.contentWindow.postMessage(messageData, widgetBaseUrl);
  };

  /**
   * Event emitter
   */
  MAISWidget.prototype.on = function(event, handler) {
    if (!this.messageHandlers[event]) {
      this.messageHandlers[event] = [];
    }
    this.messageHandlers[event].push(handler);
  };

  MAISWidget.prototype.emit = function(event, data) {
    var handlers = this.messageHandlers[event] || [];
    for (var i = 0; i < handlers.length; i++) {
      handlers[i](data);
    }
  };

  /**
   * Public API: Open booking modal
   */
  MAISWidget.prototype.openBooking = function(packageSlug) {
    this.sendMessage('OPEN_BOOKING', { packageSlug: packageSlug });
  };

  /**
   * Public API: Close modal
   */
  MAISWidget.prototype.close = function() {
    this.sendMessage('CLOSE');
  };

  /**
   * Public API: Destroy widget
   */
  MAISWidget.prototype.destroy = function() {
    window.removeEventListener('message', this._handleMessage);
    if (this.container && this.iframe) {
      this.container.removeChild(this.iframe);
    }
    this.iframe = null;
    this.loaded = false;
  };

  // Create widget instance
  var widget = new MAISWidget(config);

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
      widget.init();
    });
  } else {
    widget.init();
  }

  // Expose global API
  window.MAISWidget = widget;

})();
