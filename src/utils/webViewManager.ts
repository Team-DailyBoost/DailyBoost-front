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
  useFormData?: boolean; // FormData 사용 여부
  formDataFields?: Record<string, any>; // FormData 필드 (useFormData가 true일 때)
};

class WebViewManagerClass {
  private webViewRef: any | null = null;
  private pending: Map<string | number, (v: any) => void> = new Map();
  private timeouts: Map<string | number, any> = new Map();
  private timeoutMsById: Map<string | number, number> = new Map();
  private rejectById: Map<string | number, (e: any) => void> = new Map();
  private workoutResponseHandler: ((data: any) => void) | null = null;
  private bridgeReady = false;
  private webViewLoaded = false;
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
    this.webViewLoaded = false;
  }

  /**
   * WebView 로드 완료 상태 설정
   */
  setWebViewLoaded(loaded: boolean) {
    this.webViewLoaded = loaded;
    if (loaded && !this.bridgeReady) {
      // WebView가 로드되면 브리지 준비 신호 전송 시도
      this.checkBridgeReady();
    }
  }

  /**
   * 브리지 준비 상태 확인
   */
  private checkBridgeReady(): void {
    if (!this.webViewRef || !this.webViewLoaded) {
      return;
    }
    
    // 브리지 준비 확인 스크립트 주입
    try {
      this.webViewRef.injectJavaScript(`
        (function() {
          try {
            if (window.requestApiFromApp) {
              window.ReactNativeWebView && window.ReactNativeWebView.postMessage(JSON.stringify({
                type: 'api:bridge-ready'
              }));
            }
          } catch(e) {}
        })();
        true;
      `);
    } catch (e) {
      console.error('❌ [WebViewManager] 브리지 확인 스크립트 주입 실패:', e);
    }
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
      // 타임아웃 설정
      const timeoutId = setTimeout(() => {
        if (this.pending.has(id)) {
          this.pending.delete(id);
          this.rejectById.delete(id);
          reject(new Error('WebView API 요청 타임아웃 (30초)'));
        }
      }, payload.timeoutMs || 30000);

      this.pending.set(id, (value: any) => {
        clearTimeout(timeoutId);
        resolve(value);
      });
      this.rejectById.set(id, (error: any) => {
        clearTimeout(timeoutId);
        reject(error);
      });

      // WebView가 로드되지 않았으면 대기
      if (!this.webViewLoaded) {
        console.log('⚠️ [WebViewManager] WebView가 아직 로드되지 않음, 대기 중...');
        // WebView 로드 대기 (최대 5초)
        const loadCheckInterval = setInterval(() => {
          if (this.webViewLoaded) {
            clearInterval(loadCheckInterval);
            // 로드 완료 후 요청 재시도
            this.requestApi(payload).then(resolve).catch(reject);
          }
        }, 100);
        
        setTimeout(() => {
          clearInterval(loadCheckInterval);
          if (!this.webViewLoaded) {
            reject(new Error('WebView가 로드되지 않았습니다. 잠시 후 다시 시도해주세요.'));
          }
        }, 5000);
        return;
      }

      // 브리지가 아직 준비되지 않았다면 큐에 쌓고, 스크립트를 주입하여 실행 시도
      if (!this.bridgeReady) {
        console.log('⚠️ [WebViewManager] 브리지가 준비되지 않음, 스크립트 강제 주입 시도');
        this.queuedRequests.push({ payload, resolve, reject });
        // 브리지 준비 확인
        this.checkBridgeReady();
        // 스크립트를 강제로 주입하고 실행 시도
        try {
          this.injectAndExecuteScript(payload, id);
        } catch (error) {
          console.error('❌ [WebViewManager] 스크립트 주입 실패:', error);
        }
        return;
      }

      // 브리지가 준비된 경우 즉시 전송
      try {
        this.injectAndExecuteScript(payload, id);
      } catch (error) {
        console.error('❌ [WebViewManager] 스크립트 실행 실패:', error);
        this.rejectById.get(id)?.(error);
      }
    });
  }

  /**
   * 스크립트를 주입하고 실행하는 헬퍼 메서드
   */
  private injectAndExecuteScript(payload: ApiPayload, id: string | number): void {
    const reject = this.rejectById.get(id);
    if (!reject) {
      console.error('❌ [WebViewManager] reject 함수를 찾을 수 없음:', id);
      return;
    }
    
    try {
        // 먼저 스크립트 실행 확인을 위한 테스트 메시지 전송
        const testScript = `
          (function() {
            try {
              console.log('🔵 [WebView Test Script] 실행됨');
              if (window.ReactNativeWebView && window.ReactNativeWebView.postMessage) {
                window.ReactNativeWebView.postMessage(JSON.stringify({
                  type: 'api:log',
                  message: '테스트 스크립트 실행 확인: ' + window.location.href
                }));
                console.log('🔵 [WebView Test Script] 메시지 전송 완료');
              } else {
                console.error('🔵 [WebView Test Script] ReactNativeWebView 없음');
              }
            } catch(e) {
              console.error('🔵 [WebView Test Script] 에러:', e);
            }
          })();
          true;
        `;
        
        // 스크립트가 없으면 재주입하고, 있으면 바로 호출
        // 스크립트 재주입용 코드 (injectedGenericApiScript와 동일)
        const ensureScriptAndCall = `
          (function() {
            try {
              console.log('🔵 [WebView Script] IIFE 시작');
              // 디버그: 현재 URL 확인
              console.log('🔵 [WebView Script] 현재 URL:', window.location.href);
              console.log('🔵 [WebView Script] origin:', window.location.origin);
              console.log('🔵 [WebView Script] 스크립트 주입됨, payload 확인 중...');
              
              // 즉시 실행 확인 메시지 전송
              try {
                if (window.ReactNativeWebView && window.ReactNativeWebView.postMessage) {
                  window.ReactNativeWebView.postMessage(JSON.stringify({
                    type: 'api:log',
                    message: 'API 스크립트 실행 시작: ' + window.location.href
                  }));
                  console.log('🔵 [WebView Script] 실행 시작 메시지 전송 완료');
                } else {
                  console.error('🔵 [WebView Script] ReactNativeWebView.postMessage 없음!');
                }
              } catch(msgErr) {
                console.error('🔵 [WebView Script] 메시지 전송 실패:', msgErr);
              }
              
              var BACKEND_BASE = ${JSON.stringify(API_CONFIG.BASE_URL)};
              var payload = ${JSON.stringify(payload)};
              console.log('🔵 [WebView Script] payload:', JSON.stringify(payload).substring(0, 200));
            
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
                  const useFormData = payload.useFormData === true;
                  const formDataFields = payload.formDataFields || {};

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
                  } else if (useFormData && formDataFields) {
                    // FormData 사용 (multipart/form-data)
                    console.log('🔵 [WebView Script] FormData 사용하여 전송');
                    data = await (function() {
                      return new Promise(function(resolve, reject) {
                        try {
                          const xhr = new XMLHttpRequest();
                          xhr.open(method, fullUrl, true);
                          xhr.withCredentials = true;
                          
                          const formData = new FormData();
                          
                          // formDataFields에서 필드 추가
                          Object.entries(formDataFields).forEach(function([key, value]) {
                            if (key === 'postCreateRequest' || key === 'commentRequest' || key === 'postUpdateRequest' || key === 'commentUpdateRequest') {
                              // JSON 객체를 문자열로 변환하여 전송
                              // Spring의 @RequestPart는 JSON 문자열을 직접 받을 수 있음
                              const jsonString = JSON.stringify(value);
                              console.log('🔵 [WebView Script] JSON part 추가:', key, jsonString.substring(0, 100));
                              // Blob으로 변환하여 Content-Type: application/json 설정
                              // Spring은 Blob의 Content-Type을 인식함
                              const jsonBlob = new Blob([jsonString], { type: 'application/json' });
                              // 파일명 추가 (Spring @RequestPart 호환성)
                              formData.append(key, jsonBlob, key + '.json');
                            } else if (key === 'files' && Array.isArray(value)) {
                              // 파일 배열 처리 (base64 데이터를 Blob으로 변환)
                              if (value.length === 0) {
                                console.log('🔵 [WebView Script] 파일이 없음, files part 생략');
                                return;
                              }
                              value.forEach(function(file, index) {
                                if (file && file.data && file.name && file.type) {
                                  console.log('🔵 [WebView Script] 파일 추가:', file.name, file.type);
                                  // base64를 Blob으로 변환
                                  const byteCharacters = atob(file.data);
                                  const byteNumbers = new Array(byteCharacters.length);
                                  for (let i = 0; i < byteCharacters.length; i++) {
                                    byteNumbers[i] = byteCharacters.charCodeAt(i);
                                  }
                                  const byteArray = new Uint8Array(byteNumbers);
                                  const blob = new Blob([byteArray], { type: file.type });
                                  formData.append('files', blob, file.name);
                                } else {
                                  console.warn('🔵 [WebView Script] 잘못된 파일 데이터:', file);
                                }
                              });
                            } else {
                              formData.append(key, value);
                            }
                          });
                          
                          // FormData 내용 확인 (디버깅용)
                          console.log('🔵 [WebView Script] FormData 생성 완료, 전송 시작');
                          
                          xhr.onreadystatechange = function() {
                            if (xhr.readyState === 4) {
                              status = xhr.status;
                              const respText = xhr.responseText || '';
                              console.log('🔵 [WebView Script] 응답 상태:', status);
                              console.log('🔵 [WebView Script] 응답 텍스트:', respText.substring(0, 200));
                              
                              // 에러 상태 코드 처리
                              if (status >= 400) {
                                try {
                                  const errorData = respText ? JSON.parse(respText) : { status, error: 'Request failed' };
                                  resolve({ status, ...errorData });
                                } catch (e) {
                                  resolve({ status, error: respText || 'Request failed', message: respText });
                                }
                                return;
                              }
                              
                              const respCt = (xhr.getResponseHeader && xhr.getResponseHeader('content-type')) || '';
                              if (respCt.indexOf('application/json') !== -1) {
                                try { 
                                  const parsed = JSON.parse(respText);
                                  resolve(parsed);
                                }
                                catch (parseErr) { 
                                  console.error('🔵 [WebView Script] JSON 파싱 실패:', parseErr);
                                  resolve(respText); 
                                }
                              } else {
                                resolve(respText);
                              }
                            }
                          };
                          xhr.onerror = function() {
                            console.error('🔵 [WebView Script] XMLHttpRequest 에러');
                            reject(new Error('XMLHttpRequest failed'));
                          };
                          console.log('🔵 [WebView Script] FormData 전송 시작');
                          xhr.send(formData);
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
            // FormData 사용 시에는 인라인 폴백을 강제로 사용 (더 안정적)
            try {
              console.log('🔵 [WebView Script] 함수 호출 시도 시작, payload:', JSON.stringify(payload).substring(0, 200));
              const useFormData = payload.useFormData === true;
              
              // FormData 사용 시에는 인라인 폴백을 직접 실행 (더 안정적)
              if (useFormData) {
                console.log('🔵 [WebView Script] FormData 사용 → 인라인 폴백 직접 실행');
                // 인라인 폴백을 즉시 실행 (아래 코드로 계속 진행)
              } else if (window.requestApiFromApp) {
                console.log('🔵 [WebView Script] requestApiFromApp 호출 시작');
                window.requestApiFromApp(${JSON.stringify(JSON.stringify(payload))});
                return; // 함수 호출 성공 시 종료
              }
              
              // 인라인 폴백 실행 (FormData 사용 시 또는 함수가 없을 때)
              console.log('🔵 [WebView Script] 인라인 폴백 수행 시작');
              
              // 즉시 실행 확인 메시지
              try {
                if (window.ReactNativeWebView && window.ReactNativeWebView.postMessage) {
                  window.ReactNativeWebView.postMessage(JSON.stringify({
                    type: 'api:log',
                    message: '인라인 폴백 실행 시작'
                  }));
                }
              } catch(e) {
                console.error('인라인 폴백 시작 메시지 전송 실패:', e);
              }
              
              // 즉시 실행되는 IIFE로 변경 (await 없이 실행)
              void (async function(){
                  try {
                    const p = ${JSON.stringify(payload)};
                    const method = (p.method || 'GET').toUpperCase();
                    const path = p.path || '/';
                    const headers = p.headers || {};
                    const query = p.query || {};
                    const hasBody = typeof p.body !== 'undefined' && p.body !== null;
                    const body = hasBody ? p.body : null;
                    const reqId = p.id || ${JSON.stringify(id)};
                    const useFormData = p.useFormData === true;
                    const formDataFields = p.formDataFields || {};
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
                    if (useFormData && formDataFields) {
                      // FormData 사용 (multipart/form-data)
                      console.log('🔵 [WebView Script Fallback] FormData 사용하여 전송');
                      d = await (function() {
                        return new Promise(function(resolve, reject) {
                          try {
                            var xhr = new XMLHttpRequest();
                            xhr.open(method, fullUrl, true);
                            xhr.withCredentials = true;
                            
                            var fd = new FormData();
                            
                            // formDataFields에서 필드 추가
                            Object.entries(formDataFields).forEach(function([key, value]) {
                              if (key === 'postCreateRequest' || key === 'commentRequest' || key === 'postUpdateRequest' || key === 'commentUpdateRequest') {
                                // JSON 객체를 문자열로 변환하여 전송
                                // Spring의 @RequestPart는 JSON part에 Content-Type: application/json이 필요
                                var jsonString = JSON.stringify(value);
                                console.log('🔵 [WebView Script Fallback] JSON part 추가:', key, jsonString.substring(0, 100));
                                // Blob으로 변환하여 Content-Type: application/json 설정
                                // Spring은 Blob의 Content-Type을 인식함
                                var jsonBlob = new Blob([jsonString], { type: 'application/json' });
                                // 파일명 없이 Blob 추가 (Spring이 Content-Type으로 인식)
                                fd.append(key, jsonBlob, key + '.json');
                              } else if (key === 'files' && Array.isArray(value)) {
                                // 파일 배열 처리 (base64 데이터를 Blob으로 변환)
                                if (value.length === 0) {
                                  console.log('🔵 [WebView Script Fallback] 파일이 없음, files part 생략');
                                  return;
                                }
                                value.forEach(function(file, index) {
                                  if (file && file.data && file.name && file.type) {
                                    console.log('🔵 [WebView Script Fallback] 파일 추가:', file.name, file.type);
                                    // base64를 Blob으로 변환
                                    var byteCharacters = atob(file.data);
                                    var byteNumbers = new Array(byteCharacters.length);
                                    for (var i = 0; i < byteCharacters.length; i++) {
                                      byteNumbers[i] = byteCharacters.charCodeAt(i);
                                    }
                                    var byteArray = new Uint8Array(byteNumbers);
                                    var blob = new Blob([byteArray], { type: file.type });
                                    fd.append('files', blob, file.name);
                                  } else {
                                    console.warn('🔵 [WebView Script Fallback] 잘못된 파일 데이터:', file);
                                  }
                                });
                              } else {
                                fd.append(key, value);
                              }
                            });
                            
                            // FormData 내용 확인 (디버깅용)
                            console.log('🔵 [WebView Script Fallback] FormData 생성 완료, 전송 시작');
                            
                            // 실행 확인 메시지
                            try {
                              if (window.ReactNativeWebView && window.ReactNativeWebView.postMessage) {
                                window.ReactNativeWebView.postMessage(JSON.stringify({
                                  type: 'api:log',
                                  message: 'FormData XMLHttpRequest 전송 시작'
                                }));
                              }
                            } catch(e) {}
                            
                            xhr.onreadystatechange = function() {
                              if (xhr.readyState === 4) {
                                statusCode = xhr.status;
                                var respText = xhr.responseText || '';
                                console.log('🔵 [WebView Script Fallback] 응답 상태:', statusCode);
                                console.log('🔵 [WebView Script Fallback] 응답 텍스트:', respText.substring(0, 200));
                                
                                // 실행 확인 메시지
                                try {
                                  if (window.ReactNativeWebView && window.ReactNativeWebView.postMessage) {
                                    window.ReactNativeWebView.postMessage(JSON.stringify({
                                      type: 'api:log',
                                      message: 'FormData 응답 수신: ' + statusCode
                                    }));
                                  }
                                } catch(e) {}
                                
                                // 에러 상태 코드 처리
                                if (statusCode >= 400) {
                                  try {
                                    var errorData = respText ? JSON.parse(respText) : { status: statusCode, error: 'Request failed' };
                                    resolve({ status: statusCode, ...errorData });
                                  } catch (e) {
                                    resolve({ status: statusCode, error: respText || 'Request failed', message: respText });
                                  }
                                  return;
                                }
                                
                                var respCt = (xhr.getResponseHeader && xhr.getResponseHeader('content-type')) || '';
                                if (respCt.indexOf('application/json') !== -1) {
                                  try { 
                                    var parsed = JSON.parse(respText);
                                    resolve(parsed);
                                  }
                                  catch (parseErr) { 
                                    console.error('🔵 [WebView Script Fallback] JSON 파싱 실패:', parseErr);
                                    resolve(respText); 
                                  }
                                } else {
                                  resolve(respText);
                                }
                              }
                            };
                            xhr.onerror = function() {
                              console.error('🔵 [WebView Script Fallback] XMLHttpRequest 에러');
                              reject(new Error('XMLHttpRequest failed'));
                            };
                            console.log('🔵 [WebView Script Fallback] FormData 전송 시작');
                            xhr.send(fd);
                          } catch (xhrError) {
                            reject(xhrError);
                          }
                        });
                      })();
                    } else if (useXhrForGetBody) {
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
                    console.log('🔵 [WebView Script Fallback] 응답 준비 완료, postMessage 전송');
                    if (window.ReactNativeWebView && window.ReactNativeWebView.postMessage) {
                      const responseMsg = { type: 'api:success', id: reqId, status: statusCode || 200, data: d };
                      console.log('🔵 [WebView Script Fallback] postMessage:', JSON.stringify(responseMsg).substring(0, 200));
                      window.ReactNativeWebView.postMessage(JSON.stringify(responseMsg));
                      console.log('🔵 [WebView Script Fallback] postMessage 전송 완료');
                    } else {
                      console.error('🔵 [WebView Script Fallback] ReactNativeWebView.postMessage 없음!');
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
                window.ReactNativeWebView.postMessage(JSON.stringify({ 
                  type: 'api:error', 
                  id: ${JSON.stringify(id)}, 
                  message: (e && e.message) || String(e) 
                }));
              }
            }
          })();
          
          // 실행 확인
          console.log('🔵 [WebView Script] 스크립트 실행 완료');
          true;
        `;
        
        console.log('🔵 [WebViewManager] 스크립트 주입 시작');
        console.log('🔵 [WebViewManager] WebView ref 존재:', !!this.webViewRef);
        console.log('🔵 [WebViewManager] injectJavaScript 호출 가능:', typeof this.webViewRef?.injectJavaScript === 'function');
        console.log('🔵 [WebViewManager] payload 요약:', {
          method: payload.method,
          path: payload.path,
          useFormData: payload.useFormData,
          hasFiles: payload.formDataFields?.files?.length > 0,
        });
        
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
              // 먼저 테스트 스크립트 실행
              this.webViewRef.injectJavaScript(testScript);
              console.log('🔵 [WebViewManager] 테스트 스크립트 주입 완료');
              
              // 그 다음 URL 확인
              setTimeout(() => {
                if (this.webViewRef && typeof this.webViewRef.injectJavaScript === 'function') {
                  this.webViewRef.injectJavaScript(checkUrlScript);
                  console.log('🔵 [WebViewManager] URL 확인 스크립트 주입 완료');
                  
                  // 그 다음 실제 API 스크립트 주입
                  setTimeout(() => {
                    if (this.webViewRef && typeof this.webViewRef.injectJavaScript === 'function') {
                      console.log('🔵 [WebViewManager] API 스크립트 주입 시작...');
                      this.webViewRef.injectJavaScript(ensureScriptAndCall);
                      console.log('🔵 [WebViewManager] API 스크립트 주입 완료');
                      
                      // 스크립트 실행 확인을 위한 추가 확인 (2초 후)
                      setTimeout(() => {
                        if (this.pending.has(id)) {
                          console.warn('⚠️ [WebViewManager] 스크립트 실행 후 응답 없음, 재시도...');
                          // 재시도
                          if (this.webViewRef && typeof this.webViewRef.injectJavaScript === 'function') {
                            this.webViewRef.injectJavaScript(ensureScriptAndCall);
                          }
                        }
                      }, 2000);
                    } else {
                      console.error('🔵 [WebViewManager] WebView ref가 유효하지 않음 (3차 시도)');
                      const rejectFn = this.rejectById.get(id);
                      if (rejectFn) rejectFn(new Error('WebView is not ready'));
                    }
                  }, 300);
                } else {
                  console.error('🔵 [WebViewManager] WebView ref가 유효하지 않음 (2차 시도)');
                  const rejectFn = this.rejectById.get(id);
                  if (rejectFn) rejectFn(new Error('WebView is not ready'));
                }
              }, 200);
            } else {
              console.error('🔵 [WebViewManager] WebView ref가 유효하지 않음');
              const rejectFn = this.rejectById.get(id);
              if (rejectFn) rejectFn(new Error('WebView is not ready'));
            }
          } catch (e) {
            console.error('🔵 [WebViewManager] 스크립트 주입 실패:', e);
            const rejectFn = this.rejectById.get(id);
            if (rejectFn) rejectFn(e);
          }
        }, 100);
    } catch (e) {
      console.error('🔵 [WebViewManager] 스크립트 주입 실패:', e);
      const rejectFn = this.rejectById.get(id);
      if (rejectFn) rejectFn(e);
    }
  }

  /**
   * WebView -> RN 응답을 여기서 받아서 resolve 해주는 용도
   */
  handleGenericApiResponse(data: any) {
    const { id, type } = data;

    // 브리지 준비 신호 처리 (id 없음)
    if (type === 'api:bridge-ready') {
      console.log('✅ [WebViewManager] 브리지 준비 완료');
      this.bridgeReady = true;
      // 큐 비우기: 대기 중이던 요청들을 순차 전송
      const queued = this.queuedRequests.slice();
      this.queuedRequests = [];
      queued.forEach((q) => {
        this.requestApi(q.payload).then(q.resolve).catch(q.reject);
      });
      return;
    }

    // api:log 같은 로그 메시지는 로깅만 하고 무시
    if (type === 'api:log') {
      const message = (data as Record<string, unknown>).message;
      if (typeof message === 'string') {
        console.log('📝 [WebViewManager] WebView 로그:', message);
      }
      return;
    }
    
    if (type === 'api:ping') {
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
      // 백엔드 응답 형식: Api<T> = { errorCode, description, value }
      // 또는 Spring 에러 응답: { timestamp, status, error, path }
      const responseData = Object.prototype.hasOwnProperty.call(data, 'data') ? data.data : data;
      
      // Spring 에러 응답 확인 (400, 500 등)
      if (data.status && data.status >= 400) {
        const errorMessage = data.error || data.message || '요청에 실패했습니다.';
        resolver({
          error: true,
          status: data.status,
          message: errorMessage,
          ...data,
        });
        return;
      }
      
      // 백엔드 Api<T> 형식 확인
      if (responseData && typeof responseData === 'object' && responseData !== null) {
        const responseObj = responseData as Record<string, unknown>;
        
        // Api<T> 형식: { errorCode, description, value }
        if ('value' in responseObj) {
          resolver(responseObj.value);
          return;
        }
        
        // 에러 응답: { errorCode, description, value: null }
        if ('errorCode' in responseObj) {
          const errorCode = responseObj.errorCode;
          if (typeof errorCode === 'number' && errorCode !== 200) {
            resolver({
              error: true,
              errorCode,
              description: typeof responseObj.description === 'string' ? responseObj.description : undefined,
              ...responseObj,
            });
            return;
          }
        }
      }
      
      // 일반 응답
      resolver(responseData);
    } else if (type === 'api:error') {
      // 에러 응답
      resolver({
        error: true,
        message: data.message || '요청에 실패했습니다.',
        ...data,
      });
    } else {
      resolver({
        error: true,
        ...data,
      });
    }
  }
}

export const WebViewManager = new WebViewManagerClass();
