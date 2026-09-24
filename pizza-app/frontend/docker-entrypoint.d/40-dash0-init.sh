#!/bin/sh
# Generates /usr/share/nginx/html/dash0-init.js at container start.
#
# index.html loads that file unconditionally. When DASH0_WEB_ENDPOINT and
# DASH0_WEB_AUTH_TOKEN are both set, it initialises the Dash0 Web SDK and loads
# the SDK bundle; otherwise it is a no-op, so the page works without it.
set -eu

TARGET=/usr/share/nginx/html/dash0-init.js

if [ -z "${DASH0_WEB_ENDPOINT:-}" ] || [ -z "${DASH0_WEB_AUTH_TOKEN:-}" ]; then
  cat > "$TARGET" <<'DISABLED'
console.info(
  'Browser monitoring is off. Set DASH0_WEB_ENDPOINT and DASH0_WEB_AUTH_TOKEN in pizza-app/.env to turn it on.'
);
DISABLED
  echo "40-dash0-init.sh: browser monitoring disabled (DASH0_WEB_* not set)"
  exit 0
fi

cat > "$TARGET" <<ENABLED
(function (d, a, s, h, z) {
  d[a] ||
    ((z = d[a] = function () {
      h.push(arguments);
    }),
    (z._t = new Date()),
    (z._v = 1),
    (h = z._q = []));
})(window, 'dash0');

window.dash0('init', {
  serviceName: '${DASH0_WEB_SERVICE_NAME:-pizza-frontend}',
  endpoint: {
    url: '${DASH0_WEB_ENDPOINT}',
    authToken: '${DASH0_WEB_AUTH_TOKEN}',
    dataset: '${DASH0_DATASET:-default}',
  },
  additionalSignalAttributes: {
    'service.namespace': 'pizza-app',
    'deployment.environment.name': '${DASH0_ENVIRONMENT:-workshop}',
  },
  sessionInactivityTimeoutMillis: 30 * 60 * 1000,
  sessionTerminationTimeoutMillis: 4 * 60 * 60 * 1000,
  propagators: [
    {
      type: 'traceparent',
      match: [/^https?:\/\/[^\/]+:3000\//, /\/order(\/|\?|\$)/],
    },
  ],
});

(function () {
  var script = document.createElement('script');
  script.src =
    'https://unpkg.com/@dash0/sdk-web@${DASH0_WEB_SDK_VERSION:-0.27.0}/dist/dash0.iife.js';
  script.defer = true;
  script.crossOrigin = 'anonymous';
  document.head.appendChild(script);
})();
ENABLED

echo "40-dash0-init.sh: browser monitoring enabled for ${DASH0_WEB_SERVICE_NAME:-pizza-frontend}"
