import React, { useRef, useEffect } from 'react';
import { View } from 'react-native';
import { WebView } from 'react-native-webview';
import { API_CONFIG } from '../../config/api';
import { WebViewManager } from '../../utils/webViewManager';

const injectedGenericApiScript = `
  (function() {
    try {
      var BACKEND_BASE = ${JSON.stringify(API_CONFIG.BASE_URL)};
      // 범용 API 프록시: RN → WebView
      window.requestApiFromApp = async function(payloadJson) {
        var hbTimer = null;
        try {
          var payload = JSON.parse(payloadJson);
          var method = (payload.method || 'GET').toUpperCase();
          var path = payload.path || '/';
          var headers = payload.headers || {};
          var query = payload.query || {};
          var body = payload.body || null;
          var id = payload.id || Date.now();

          // 시작 알림 + 하트비트
          try {
            window.ReactNativeWebView && window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'api:start', id: id }));
          } catch(e) {}
          hbTimer = setInterval(function(){
            try {
              window.ReactNativeWebView && window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'api:heartbeat', id: id }));
            } catch(e) {}
          }, 4000);

          // 쿼리스트링
          var qs = Object.keys(query).length
            ? '?' + Object.keys(query).map(function(k){ return encodeURIComponent(k) + '=' + encodeURIComponent(query[k]); }).join('&')
            : '';

          // 동일 백엔드 절대 URL
          var fullUrl = path.indexOf('http') === 0 ? (path + qs) : (BACKEND_BASE + path + qs);

          var hasBody = typeof body !== 'undefined' && body !== null;
          var useXhrForGetBody = method === 'GET' && hasBody;
          var status = 0;
          var data;

          if (useXhrForGetBody) {
            data = await (function() {
              return new Promise(function(resolve, reject) {
                try {
                  var xhr = new XMLHttpRequest();
                  xhr.open('GET', fullUrl, true);
                  xhr.withCredentials = true;
                  Object.keys(headers).forEach(function(key) {
                    try { xhr.setRequestHeader(key, headers[key]); } catch(e) {}
                  });
                  if (!headers['Content-Type'] && !headers['content-type']) {
                    try { xhr.setRequestHeader('Content-Type', 'application/json'); } catch(e) {}
                  }
                  xhr.onreadystatechange = function() {
                    if (xhr.readyState === 4) {
                      status = xhr.status;
                      var respText = xhr.responseText || '';
                      var respCt = xhr.getResponseHeader && xhr.getResponseHeader('content-type') || '';
                      if (respCt.indexOf('application/json') !== -1) {
                        try { resolve(JSON.parse(respText)); }
                        catch (parseErr) { resolve(respText); }
                      } else {
                        resolve(respText);
                      }
                    }
                  };
                  xhr.onerror = function() {
                    reject(new Error('XMLHttpRequest failed'));
                  };
                  xhr.send(JSON.stringify(body));
                } catch (xhrError) {
                  reject(xhrError);
                }
              });
            })();
          } else {
            var init = { method: method, headers: headers, credentials: 'include' };
            if (hasBody) {
              init.headers = Object.assign({ 'Content-Type': 'application/json' }, headers);
              init.body = JSON.stringify(body);
            }

            var res = await fetch(fullUrl, init);
            status = res.status;
            var ct = res.headers.get('content-type') || '';
            if (ct.indexOf('application/json') !== -1) {
              data = await res.json();
            } else {
              data = await res.text();
            }
          }

          window.ReactNativeWebView && window.ReactNativeWebView.postMessage(JSON.stringify({
            type: 'api:success',
            id: id,
            status: status || 200,
            data: data
          }));
        } catch (err) {
          window.ReactNativeWebView && window.ReactNativeWebView.postMessage(JSON.stringify({
            type: 'api:error',
            id: (payload && payload.id) || Date.now(),
            message: (err && err.message) ? err.message : String(err)
          }));
        } finally {
          try { hbTimer && clearInterval(hbTimer); } catch(e) {}
        }
      };
    } catch(e) {}
    true;
  })();
`;

/**
 * 로그인 이후 항상 유지되는 백그라운드 WebView
 * - WebViewManager가 항상 유효한 ref를 가지도록 보장
 * - RN에서 HTML 로그인 페이지가 떨어지는 경우, 이 WebView를 통해 API를 프록시
 */
export function BackgroundWebView() {
  const ref = useRef<WebView>(null);

  useEffect(() => {
    if (ref.current) {
      try {
        WebViewManager.setWebViewRef(ref.current as any);
      } catch {}
    }
  }, []);

  const handleMessage = (event: any) => {
    const raw = event.nativeEvent?.data;
    if (!raw) return;
    try {
      const data = JSON.parse(raw);
      const t = data?.type;
      if (typeof t === 'string' && t.startsWith('api:')) {
        WebViewManager.handleGenericApiResponse(data);
        return;
      }
      if (t === 'workout:success' || t === 'workout:error') {
        WebViewManager.handleWorkoutResponse?.(data);
        return;
      }
    } catch {
      // ignore non-JSON
    }
  };

  return (
    <View style={{ width: 1, height: 1, position: 'absolute', top: -1000, left: -1000, opacity: 0 }}>
      <WebView
        ref={ref}
        source={{ uri: API_CONFIG.BASE_URL + '/' }}
        injectedJavaScript={injectedGenericApiScript}
        onMessage={handleMessage}
        javaScriptEnabled
        sharedCookiesEnabled
        thirdPartyCookiesEnabled
      />
    </View>
  );
}


