/**
 * 전역 WebView 참조 관리
 * 로그인 후 운동 추천 API 호출을 위해 WebView를 전역으로 관리
 * 
 * 클래스 기반으로 리팩토링하여 더 안전하게 관리합니다.
 */

import { API_CONFIG } from '../config/api';

type ApiPayload = {
  method: string;
  path: string;
  headers?: Record<string, string>;
  query?: Record<string, any>;
  body?: any;
  id?: string | number;
  timeoutMs?: number;
};

class WebViewManagerClass {
  private webViewRef: any | null = null;
  private pending: Map<string | number, (v: any) => void> = new Map();
  private timeouts: Map<string | number, any> = new Map();
  private timeoutMsById: Map<string | number, number> = new Map();
  private rejectById: Map<string | number, (e: any) => void> = new Map();
  private workoutResponseHandler: ((data: any) => void) | null = null;
  private bridgeReady = false;
  private queuedRequests: Array<{
    payload: ApiPayload;
    resolve: (v: any) => void;
    reject: (e: any) => void;
  }> = [];

  /**
   * WebView 참조 설정
   */
  setWebViewRef(ref: any) {
    this.webViewRef = ref;
    // 새 WebView가 연결되면 브리지 준비 상태는 초기화
    this.bridgeReady = false;
  }

  /**
   * WebView 참조 가져오기
   */
  getWebViewRef(): any | null {
    return this.webViewRef;
  }

  /**
   * WebView가 사용 가능한지 확인
   */
  isAvailable(): boolean {
    return !!this.webViewRef;
  }

  /**
   * 운동 추천 응답 핸들러 설정
   */
  setWorkoutResponseHandler(handler: ((data: any) => void) | null) {
    this.workoutResponseHandler = handler;
  }

  /**
   * 운동 추천 응답 처리
   */
  handleWorkoutResponse(data: any) {
    if (this.workoutResponseHandler) {
      this.workoutResponseHandler(data);
    }
  }

  /**
   * 운동 추천 요청을 WebView에 전달
   */
  requestWorkout(level: string, userInput: string): Promise<any> {
    return new Promise((resolve, reject) => {
      if (!this.webViewRef) {
        reject(new Error('WebView is not available'));
        return;
      }

      const workoutPayload = {
        level,
        userInput,
      };

      // 응답을 받기 위한 일회용 핸들러 설정
      const responseHandler = (responseData: any) => {
        this.setWorkoutResponseHandler(null); // 핸들러 제거
        if (responseData.type === 'workout:success') {
          resolve(responseData.data);
        } else {
          reject(new Error(responseData.message || '운동 추천 실패'));
        }
      };

      this.setWorkoutResponseHandler(responseHandler);

      // WebView에 함수 호출 주입
      // 한 번 더 stringify 하는 이유: requestWorkoutFromApp이 JSON 문자열을 받기 때문
      try {
        this.webViewRef.injectJavaScript(`
          if (window.requestWorkoutFromApp) {
            window.requestWorkoutFromApp(${JSON.stringify(JSON.stringify(workoutPayload))});
          } else {
            window.ReactNativeWebView.postMessage(JSON.stringify({
              type: 'workout:error',
              message: 'requestWorkoutFromApp not ready'
            }));
          }
          true;
        `);
      } catch (e) {
        reject(e);
      }
    });
  }

  /**
   * RN -> WebView로 API 프록시 요청
   */
  async requestApi(payload: ApiPayload): Promise<any> {
    if (!this.webViewRef) {
      throw new Error('WebView is not available');
    }

    const id = payload.id ?? Date.now();
    payload.id = id;

    console.log('🔵 [WebViewManager] API 요청 시작:', { id, method: payload.method, path: payload.path });

    return new Promise((resolve, reject) => {
      // 브리지가 아직 준비되지 않았다면 큐에 쌓고, 준비 신호를 기다린다
      if (!this.bridgeReady) {
        this.queuedRequests.push({ payload, resolve, reject });
        // 경미한 ping으로 브리지 상태 점검
        try {
          this.webViewRef?.injectJavaScript(`
            try {
              window.ReactNativeWebView && window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'api:ping' }));
            } catch (e) {}
            true;
          `);
        } catch {}
        return;
      }

      // 브리지가 준비된 경우 즉시 전송
      try {
        // 스크립트가 없으면 재주입하고, 있으면 바로 호출
        // 스크립트 재주입용 코드 (injectedGenericApiScript와 동일)
        const ensureScriptAndCall = `
          (function() {
            // 디버그: 현재 URL 확인
            console.log('🔵 [WebView Script] 현재 URL:', window.location.href);
            console.log('🔵 [WebView Script] origin:', window.location.origin);
            var BACKEND_BASE = ${JSON.stringify(API_CONFIG.BASE_URL)};
            
            // requestApiFromApp 함수가 없으면 재정의
            if (!window.requestApiFromApp) {
              console.log('🔵 [WebView Script] requestApiFromApp 함수 정의 중...');
              window.requestApiFromApp = async function(payloadJson) {
                try {
                  console.log('🔵 [WebView Script] requestApiFromApp 호출됨');
                  const payload = JSON.parse(payloadJson);
                  const method = (payload.method || 'GET').toUpperCase();
                  const path = payload.path || '/';
                  const headers = payload.headers || {};
                  const query = payload.query || {};
                  const hasBody = typeof payload.body !== 'undefined' && payload.body !== null;
                  const body = hasBody ? payload.body : null;
                  const id = payload.id || Date.now();

                  // 시작/하트비트 신호 전송으로 네이티브 타임아웃 연장
                  try {
                    if (window.ReactNativeWebView && window.ReactNativeWebView.postMessage) {
                      window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'api:start', id: id }));
                    }
                  } catch (e) {}
                  var __wv_hb = setInterval(function(){
                    try {
                      if (window.ReactNativeWebView && window.ReactNativeWebView.postMessage) {
                        window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'api:heartbeat', id: id }));
                      }
                    } catch (e) {}
                  }, 5000);

                  // 쿼리스트링 구성
                  const qs = Object.keys(query).length
                    ? '?' + Object.entries(query)
                        .map(([k, v]) => encodeURIComponent(k) + '=' + encodeURIComponent(v))
                        .join('&')
                    : '';

                  // 백엔드 전체 URL 구성 (상대 경로면 백엔드 BASE를 사용)
                  const fullUrl = path.startsWith('http') ? path + qs : (BACKEND_BASE + path + qs);
                  console.log('🔵 [WebView Script] 요청 URL:', fullUrl);
                  const useXhrForGetBody = method === 'GET' && hasBody;
                  let status = 0;
                  let data;
                  
                  if (useXhrForGetBody) {
                    console.log('🔵 [WebView Script] GET + body 조합 → XMLHttpRequest 사용');
                    data = await (function() {
                      return new Promise(function(resolve, reject) {
                        try {
                          const xhr = new XMLHttpRequest();
                          xhr.open('GET', fullUrl, true);
                          xhr.withCredentials = true;
                          Object.keys(headers).forEach(function(key) {
                            try { xhr.setRequestHeader(key, headers[key]); } catch (e) {}
                          });
                          if (!headers['Content-Type'] && !headers['content-type']) {
                            try { xhr.setRequestHeader('Content-Type', 'application/json'); } catch (e) {}
                          }
                          xhr.onreadystatechange = function() {
                            if (xhr.readyState === 4) {
                              status = xhr.status;
                              const respText = xhr.responseText || '';
                              const respCt = (xhr.getResponseHeader && xhr.getResponseHeader('content-type')) || '';
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
                    const reqInit = {
                      method,
                      headers: headers,
                      credentials: 'include',
                    };
                    if (hasBody) {
                      reqInit.headers = { 'Content-Type': 'application/json', ...headers };
                      reqInit.body = JSON.stringify(body);
                    }
                    console.log('🔵 [WebView Script] 요청 옵션:', JSON.stringify(reqInit).substring(0, 200));
                    
                    const res = await fetch(fullUrl, reqInit);
                    status = res.status;
                    console.log('🔵 [WebView Script] 응답 상태:', status);
                    
                    const contentType = res.headers.get('content-type') || '';
                    if (contentType.includes('application/json')) {
                      data = await res.json();
                    } else {
                      data = await res.text();
                    }
                  }
                  
                  console.log('🔵 [WebView Script] 응답 데이터 타입:', typeof data);
                  console.log('🔵 [WebView Script] 응답 데이터 샘플:', String(data).substring(0, 200));
                  
                  const responseMsg = {
                    type: 'api:success',
                    id,
                    status: status || 200,
                    data
                  };
                  console.log('🔵 [WebView Script] postMessage 전송:', JSON.stringify(responseMsg).substring(0, 200));
                  
                  if (window.ReactNativeWebView && window.ReactNativeWebView.postMessage) {
                    window.ReactNativeWebView.postMessage(JSON.stringify(responseMsg));
                    console.log('🔵 [WebView Script] postMessage 전송 완료');
                  } else {
                    console.error('🔵 [WebView Script] ReactNativeWebView.postMessage 없음!');
                  }
                  try { clearInterval(__wv_hb); } catch (e) {}
                } catch (err) {
                  console.error('🔵 [WebView Script] 에러 발생:', err);
                  const errorMsg = {
                    type: 'api:error',
                    id: payload.id || id,
                    message: (err && err.message) ? err.message : String(err)
                  };
                  if (window.ReactNativeWebView && window.ReactNativeWebView.postMessage) {
                    window.ReactNativeWebView.postMessage(JSON.stringify(errorMsg));
                  }
                  try { clearInterval(__wv_hb); } catch (e) {}
                }
              };
              console.log('🔵 [WebView Script] requestApiFromApp 함수 정의 완료');
            } else {
              console.log('🔵 [WebView Script] requestApiFromApp 함수 이미 존재');
            }
            
            // 함수 호출 시도 + 인라인 폴백 (함수가 없어도 동작하도록 보장)
            try {
              if (window.requestApiFromApp) {
                console.log('🔵 [WebView Script] requestApiFromApp 호출 시작');
                window.requestApiFromApp(${JSON.stringify(JSON.stringify(payload))});
              } else {
                console.warn('🔵 [WebView Script] 함수 없음 → 인라인 폴백 수행');
                (async function(){
                  try {
                    const p = ${JSON.stringify(payload)};
                    const method = (p.method || 'GET').toUpperCase();
                    const path = p.path || '/';
                    const headers = p.headers || {};
                    const query = p.query || {};
                    const hasBody = typeof p.body !== 'undefined' && p.body !== null;
                    const body = hasBody ? p.body : null;
                    const reqId = p.id || ${JSON.stringify(id)};
                    try {
                      if (window.ReactNativeWebView && window.ReactNativeWebView.postMessage) {
                        window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'api:start', id: reqId }));
                      }
                    } catch (e) {}
                    var __wv_hb2 = setInterval(function(){
                      try {
                        if (window.ReactNativeWebView && window.ReactNativeWebView.postMessage) {
                          window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'api:heartbeat', id: reqId }));
                        }
                      } catch (e) {}
                    }, 5000);
                    const qs = Object.keys(query).length
                      ? '?' + Object.entries(query).map(function(kv){return encodeURIComponent(kv[0])+'='+encodeURIComponent(kv[1]);}).join('&')
                      : '';
                    var BACKEND_BASE = ${JSON.stringify(API_CONFIG.BASE_URL)};
                    const fullUrl = path.indexOf('http') === 0 ? path + qs : (BACKEND_BASE + path + qs);
                    console.log('🔵 [WebView Script Fallback] 요청 URL:', fullUrl);
                    const useXhrForGetBody = method === 'GET' && hasBody;
                    var statusCode = 0;
                    var d;
                    if (useXhrForGetBody) {
                      console.log('🔵 [WebView Script Fallback] GET + body → XMLHttpRequest 사용');
                      d = await (function() {
                        return new Promise(function(resolve, reject) {
                          try {
                            var xhr = new XMLHttpRequest();
                            xhr.open('GET', fullUrl, true);
                            xhr.withCredentials = true;
                            Object.keys(headers).forEach(function(key) {
                              try { xhr.setRequestHeader(key, headers[key]); } catch (e) {}
                            });
                            if (!headers['Content-Type'] && !headers['content-type']) {
                              try { xhr.setRequestHeader('Content-Type', 'application/json'); } catch (e) {}
                            }
                            xhr.onreadystatechange = function() {
                              if (xhr.readyState === 4) {
                                statusCode = xhr.status;
                                var respText = xhr.responseText || '';
                                var respCt = (xhr.getResponseHeader && xhr.getResponseHeader('content-type')) || '';
                                if (respCt.indexOf('application/json') > -1) {
                                  try { resolve(JSON.parse(respText)); }
                                  catch (parseErr) { resolve(respText); }
                                } else {
                                  resolve(respText);
                                }
                              }
                            };
                            xhr.onerror = function() { reject(new Error('XMLHttpRequest failed')); };
                            xhr.send(JSON.stringify(body));
                          } catch (xhrError) {
                            reject(xhrError);
                          }
                        });
                      })();
                    } else {
                      const init = { method: method, headers: headers, credentials: 'include' };
                      if (hasBody) { init.headers = Object.assign({ 'Content-Type': 'application/json' }, headers); init.body = JSON.stringify(body); }
                      console.log('🔵 [WebView Script Fallback] 요청 옵션:', JSON.stringify(init).substring(0, 200));
                      const r = await fetch(fullUrl, init);
                      statusCode = r.status;
                      const ct = r.headers.get('content-type') || '';
                      if (ct.indexOf('application/json') > -1) { d = await r.json(); } else { d = await r.text(); }
                    }
                    if (window.ReactNativeWebView && window.ReactNativeWebView.postMessage) {
                      window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'api:success', id: reqId, status: statusCode || 200, data: d }));
                    }
                    try { clearInterval(__wv_hb2); } catch (e) {}
                  } catch (e) {
                    if (window.ReactNativeWebView && window.ReactNativeWebView.postMessage) {
                      window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'api:error', id: ${JSON.stringify(id)}, message: (e && e.message) || String(e) }));
                    }
                    try { clearInterval(__wv_hb2); } catch (e2) {}
                  }
                })();
              }
            } catch (e) {
              console.error('🔵 [WebView Script] 호출 단계 예외:', e);
              if (window.ReactNativeWebView && window.ReactNativeWebView.postMessage) {
                window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'api:error', id: ${JSON.stringify(id)}, message: (e && e.message) || String(e) }));
              }
            }
          })();
          true;
        `;
        
        console.log('🔵 [WebViewManager] 스크립트 주입 시작');
        console.log('🔵 [WebViewManager] WebView ref 존재:', !!this.webViewRef);
        console.log('🔵 [WebViewManager] injectJavaScript 호출 가능:', typeof this.webViewRef?.injectJavaScript === 'function');
        
        // WebView의 현재 URL을 확인하는 스크립트 먼저 실행
        const checkUrlScript = `
          (function() {
            if (window.ReactNativeWebView && window.ReactNativeWebView.postMessage) {
              window.ReactNativeWebView.postMessage(JSON.stringify({
                type: 'debug',
                step: 'webview-url-check',
                url: window.location.href,
                origin: window.location.origin
              }));
            }
          })();
          true;
        `;
        
        // 약간의 지연 후 주입 시도
        setTimeout(() => {
          try {
            if (this.webViewRef && typeof this.webViewRef.injectJavaScript === 'function') {
              // 먼저 URL 확인
              this.webViewRef.injectJavaScript(checkUrlScript);
              
              // 그 다음 실제 API 스크립트 주입
              setTimeout(() => {
                if (this.webViewRef && typeof this.webViewRef.injectJavaScript === 'function') {
                  this.webViewRef.injectJavaScript(ensureScriptAndCall);
                  console.log('🔵 [WebViewManager] 스크립트 주입 완료');
                } else {
                  console.error('🔵 [WebViewManager] WebView ref가 유효하지 않음 (2차 시도)');
                  reject(new Error('WebView is not ready'));
                }
              }, 50);
            } else {
              console.error('🔵 [WebViewManager] WebView ref가 유효하지 않음');
              reject(new Error('WebView is not ready'));
            }
          } catch (e) {
            console.error('🔵 [WebViewManager] 스크립트 주입 실패:', e);
            reject(e);
          }
        }, 100);
      } catch (e) {
        console.error('🔵 [WebViewManager] 스크립트 주입 실패:', e);
        reject(e);
      }

      // 타임아웃 등록 (추천/LLM 계열은 더 길게)
      const isHeavy = typeof payload.path === 'string' && (
        payload.path.indexOf('/api/recommend/') === 0 ||
        payload.path.indexOf('/api/food/recommend') === 0 ||
        payload.path.indexOf('/api/food/recipe/recommend') === 0
      );
      // 타임아웃 단축: 무거운 요청 8초, 일반 5초
      const timeoutMs = payload.timeoutMs ?? (isHeavy ? 8000 : 5000);
      this.timeoutMsById.set(id, timeoutMs);

      // pending 등록과 타이머는 전송 직전에 설정
      this.pending.set(id, resolve);
      this.rejectById.set(id, reject);
      const prev = this.timeouts.get(id);
      if (prev) { try { clearTimeout(prev); } catch (e) {} }
      const timer = setTimeout(() => {
        if (this.pending.has(id)) {
          console.error('🔵 [WebViewManager] 타임아웃 발생:', { id, method: payload.method, path: payload.path, timeoutMs });
          this.pending.delete(id);
          const rej = this.rejectById.get(id);
          if (rej) {
            try { rej(new Error('WebView API request timeout')); } catch (e) {}
          }
          this.rejectById.delete(id);
          this.timeoutMsById.delete(id);
        }
      }, timeoutMs);
      this.timeouts.set(id, timer);
    });
  }

  /**
   * WebView -> RN 응답을 여기서 받아서 resolve 해주는 용도
   */
  handleGenericApiResponse(data: any) {
    const { id, type } = data;

    // 브리지 준비 신호 처리 (id 없음)
    if (type === 'api:bridge-ready') {
      this.bridgeReady = true;
      // 큐 비우기: 대기 중이던 요청들을 순차 전송
      const queued = this.queuedRequests.slice();
      this.queuedRequests = [];
      queued.forEach((q) => {
        this.requestApi(q.payload).then(q.resolve).catch(q.reject);
      });
      return;
    }

    // api:log 같은 로그 메시지는 무시
    if (type === 'api:log' || type === 'api:ping') {
      return;
    }

    if (!id) return;

    // 하트비트/시작 신호는 타임아웃만 연장
    if (type === 'api:heartbeat' || type === 'api:start') {
      const t = this.timeoutMsById.get(id);
      if (t && this.timeouts.has(id)) {
        const prev = this.timeouts.get(id);
        try { clearTimeout(prev); } catch (e) {}
        const timer = setTimeout(() => {
          if (this.pending.has(id)) {
            console.error('🔵 [WebViewManager] 타임아웃 발생:', { id });
            this.pending.delete(id);
            const rej = this.rejectById.get(id);
            if (rej) {
              try { rej(new Error('WebView API request timeout')); } catch (e2) {}
            }
            this.rejectById.delete(id);
            this.timeoutMsById.delete(id);
          }
        }, t);
        this.timeouts.set(id, timer);
      }
      return;
    }

    const resolver = this.pending.get(id);
    if (!resolver) return;

    // 성공/실패 시 타이머 정리
    const prev = this.timeouts.get(id);
    if (prev) { try { clearTimeout(prev); } catch (e) {} }
    this.timeouts.delete(id);
    this.timeoutMsById.delete(id);
    this.rejectById.delete(id);

    this.pending.delete(id);
    if (type === 'api:success') {
      // data.data가 없으면 전체 payload를 반환 (문자열/텍스트 응답 지원)
      resolver(Object.prototype.hasOwnProperty.call(data, 'data') ? data.data : data);
    } else {
      resolver({
        error: true,
        ...data,
      });
    }
  }
}

export const WebViewManager = new WebViewManagerClass();
