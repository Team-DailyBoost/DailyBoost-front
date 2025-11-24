import { API_CONFIG } from '../config/api';

type ApiPayload = {
  method: string;
  path: string;
  headers?: Record<string, string>;
  query?: Record<string, any>;
  body?: any;
  id?: string | number;
  useFormData?: boolean;
  formDataFields?: Record<string, any>;
};

class WebViewManagerClass {
  private webViewRef: any | null = null;
  private pending: Map<string | number, (v: any) => void> = new Map();
  private rejectById: Map<string | number, (e: any) => void> = new Map();
  private bridgeReady = false;
  private webViewLoaded = false;
  private queuedRequests: Array<{
    payload: ApiPayload;
    resolve: (v: any) => void;
    reject: (e: any) => void;
  }> = [];

  setWebViewRef(ref: any) {
    this.webViewRef = ref;
    this.bridgeReady = false;
    this.webViewLoaded = false;
  }

  setWebViewLoaded(loaded: boolean) {
    this.webViewLoaded = loaded;
    if (loaded && !this.bridgeReady) {
      this.checkBridgeReady();
    }
  }

  private checkBridgeReady(): void {
    if (!this.webViewRef || !this.webViewLoaded) {
      return;
    }
    
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
    } catch (e) {}
  }

  getWebViewRef(): any | null {
    return this.webViewRef;
  }

  isAvailable(): boolean {
    return !!this.webViewRef;
  }

  setWorkoutResponseHandler(handler: ((data: any) => void) | null) {
  }

  handleWorkoutResponse(data: any) {
  }

  async requestApi(payload: ApiPayload): Promise<any> {
    if (!this.webViewRef) {
      throw new Error('WebView is not available');
    }

    const id = payload.id ?? Date.now();
    payload.id = id;

    return new Promise((resolve, reject) => {
      this.pending.set(id, (value: any) => {
        resolve(value);
      });
      this.rejectById.set(id, (error: any) => {
        reject(error);
      });

      if (!this.webViewLoaded) {
        const loadCheckInterval = setInterval(() => {
          if (this.webViewLoaded) {
            clearInterval(loadCheckInterval);
            this.requestApi(payload).then(resolve).catch(reject);
          }
        }, 100);
        
        setTimeout(() => {
          clearInterval(loadCheckInterval);
          if (!this.webViewLoaded) {
            reject(new Error('WebView가 로드되지 않았습니다.'));
          }
        }, 10000);
        return;
      }

      if (!this.bridgeReady) {
        this.queuedRequests.push({ payload, resolve, reject });
        this.checkBridgeReady();
        try {
          this.injectAndExecuteScript(payload, id);
        } catch (error) {
          this.rejectById.get(id)?.(error);
        }
        return;
      }

      try {
        this.injectAndExecuteScript(payload, id);
      } catch (error) {
        this.rejectById.get(id)?.(error);
      }
    });
  }

  private injectAndExecuteScript(payload: ApiPayload, id: string | number): void {
    const reject = this.rejectById.get(id);
    if (!reject) {
      return;
    }
    
    // 디버깅: 스크립트 인젝션 전 로깅
    console.log('[WebViewManager] 스크립트 인젝션 시작:', {
      id,
      method: payload.method,
      path: payload.path,
      useFormData: payload.useFormData,
      hasFormDataFields: !!(payload.formDataFields && Object.keys(payload.formDataFields).length > 0),
      formDataKeys: payload.formDataFields ? Object.keys(payload.formDataFields) : [],
    });
    
    try {
      const script = `
        (function() {
          try {
            var BACKEND_BASE = ${JSON.stringify(API_CONFIG.BASE_URL)};
            var payload = ${JSON.stringify(payload)};
            
            // 디버깅: 스크립트 실행 시작 로깅
            if (window.ReactNativeWebView && window.ReactNativeWebView.postMessage) {
              window.ReactNativeWebView.postMessage(JSON.stringify({
                type: 'debug:log',
                message: '[WebView Script] 스크립트 실행 시작',
                data: {
                  id: payload.id,
                  method: payload.method,
                  path: payload.path,
                  useFormData: payload.useFormData,
                  hasFormDataFields: !!(payload.formDataFields && Object.keys(payload.formDataFields || {}).length > 0),
                  formDataKeys: payload.formDataFields ? Object.keys(payload.formDataFields) : []
                }
              }));
            }
            
            if (!window.requestApiFromApp) {
              window.requestApiFromApp = async function(payloadJson) {
                try {
                  var payload = JSON.parse(payloadJson);
                  var method = (payload.method || 'GET').toUpperCase();
                  var path = payload.path || '/';
                  var headers = payload.headers || {};
                  var query = payload.query || {};
                  var body = payload.body || null;
                  var id = payload.id || Date.now();
                  var useFormData = payload.useFormData === true;
                  var formDataFields = payload.formDataFields || {};

                  var qs = Object.keys(query).length
                    ? '?' + Object.entries(query)
                        .map(([k, v]) => encodeURIComponent(k) + '=' + encodeURIComponent(v))
                        .join('&')
                    : '';

                  var fullUrl = path.startsWith('http') ? path + qs : (BACKEND_BASE + path + qs);
                  var hasBody = typeof body !== 'undefined' && body !== null;
                  var status = 0;
                  var data;
                  
                  if (useFormData && formDataFields) {
                    data = await (function() {
                      return new Promise(function(resolve, reject) {
                        try {
                          var xhr = new XMLHttpRequest();
                          xhr.open(method, fullUrl, true);
                          xhr.withCredentials = true;
                          
                          // 헤더 설정 (Authorization 토큰 포함)
                          Object.keys(headers).forEach(function(key) {
                            try {
                              // FormData의 경우 Content-Type은 자동으로 설정되므로 제외
                              if (key.toLowerCase() !== 'content-type') {
                                xhr.setRequestHeader(key, headers[key]);
                              }
                            } catch (e) {
                              console.log('[WebView] 헤더 설정 실패:', key, e);
                            }
                          });
                          
                          var formData = new FormData();
                          
                          Object.entries(formDataFields).forEach(function([key, value]) {
                            if (key === 'postCreateRequest' || key === 'commentRequest' || key === 'postUpdateRequest' || key === 'commentUpdateRequest' || key === 'userUpdateRequest') {
                              // Spring Boot @RequestPart: JSON part는 Content-Type이 application/json이어야 함
                              var jsonString = JSON.stringify(value);
                              // WebView에서 File 객체가 지원되는지 확인 후 사용, 아니면 Blob 사용
                              if (typeof File !== 'undefined') {
                                try {
                                  var jsonFile = new File([jsonString], key + '.json', { type: 'application/json' });
                                  formData.append(key, jsonFile);
                                } catch (e) {
                                  // File 생성 실패 시 Blob 사용
                                  var jsonBlob = new Blob([jsonString], { type: 'application/json' });
                                  formData.append(key, jsonBlob, key + '.json');
                                }
                              } else {
                                // File 객체가 없으면 Blob 사용
                                var jsonBlob = new Blob([jsonString], { type: 'application/json' });
                                formData.append(key, jsonBlob, key + '.json');
                              }
                            } else if ((key === 'file' || key === 'files') && value && typeof value === 'object') {
                              // file (단수) 또는 files (복수 배열) 처리
                              if (key === 'file') {
                                // 단일 파일: base64 객체를 Blob으로 변환
                                if (value.data && value.name && value.type) {
                                  try {
                                    var byteCharacters = atob(value.data);
                                    var byteNumbers = new Array(byteCharacters.length);
                                    for (var i = 0; i < byteCharacters.length; i++) {
                                      byteNumbers[i] = byteCharacters.charCodeAt(i);
                                    }
                                    var byteArray = new Uint8Array(byteNumbers);
                                    
                                    // 파일 이름 정리 (특수 문자 제거)
                                    var fileName = value.name || 'image.jpg';
                                    // 파일 확장자 확인 및 보정
                                    if (!fileName.match(/\.(jpg|jpeg|png|webp)$/i)) {
                                      var ext = value.type.split('/')[1] || 'jpg';
                                      fileName = fileName.replace(/\.[^.]*$/, '') + '.' + ext;
                                    }
                                    
                                    var blob = new Blob([byteArray], { type: value.type });
                                    formData.append('file', blob, fileName);
                                    
                                    if (window.ReactNativeWebView && window.ReactNativeWebView.postMessage) {
                                      window.ReactNativeWebView.postMessage(JSON.stringify({
                                        type: 'debug:log',
                                        message: '[WebView Script] 파일 추가 완료 (단일)',
                                        data: {
                                          fileName: fileName,
                                          fileType: value.type,
                                          fileSize: byteArray.length
                                        }
                                      }));
                                    }
                                  } catch (fileError) {
                                    console.error('[WebView Script] 파일 처리 실패 (단일):', fileError);
                                  }
                                }
                              } else if (Array.isArray(value)) {
                                // files 배열: 각 파일을 Blob으로 변환
                                // Spring Boot의 List<MultipartFile>은 같은 이름 'files'로 여러 번 append해야 함
                                if (value.length > 0) {
                                  value.forEach(function(file, index) {
                                    if (file && file.data && file.name && file.type) {
                                      try {
                                        var byteCharacters = atob(file.data);
                                        var byteNumbers = new Array(byteCharacters.length);
                                        for (var i = 0; i < byteCharacters.length; i++) {
                                          byteNumbers[i] = byteCharacters.charCodeAt(i);
                                        }
                                        var byteArray = new Uint8Array(byteNumbers);
                                        
                                        // 파일 이름 정리 (특수 문자 제거)
                                        var fileName = file.name || 'image_' + index + '.jpg';
                                        // 파일 확장자 확인 및 보정
                                        if (!fileName.match(/\.(jpg|jpeg|png|webp)$/i)) {
                                          var ext = file.type.split('/')[1] || 'jpg';
                                          fileName = fileName.replace(/\.[^.]*$/, '') + '.' + ext;
                                        }
                                        
                                        var blob = new Blob([byteArray], { type: file.type });
                                        
                                        // Spring Boot에서 List<MultipartFile>을 받으려면 같은 이름 'files'로 append
                                        formData.append('files', blob, fileName);
                                        
                                        if (window.ReactNativeWebView && window.ReactNativeWebView.postMessage) {
                                          window.ReactNativeWebView.postMessage(JSON.stringify({
                                            type: 'debug:log',
                                            message: '[WebView Script] 파일 추가 완료 (배열)',
                                            data: {
                                              index: index,
                                              fileName: fileName,
                                              fileType: file.type,
                                              fileSize: byteArray.length,
                                              totalFiles: value.length
                                            }
                                          }));
                                        }
                                      } catch (fileError) {
                                        console.error('[WebView Script] 파일 처리 실패 (배열):', fileError);
                                      }
                                    }
                                  });
                                }
                              }
                            } else {
                              formData.append(key, value);
                            }
                          });
                          
                          xhr.onreadystatechange = function() {
                            if (xhr.readyState === 4) {
                              status = xhr.status;
                              var respText = xhr.responseText || '';
                              
                              if (status >= 400) {
                                try {
                                  var errorData = respText ? JSON.parse(respText) : {};
                                  // 에러 데이터에 status 포함
                                  var errorResponse = { 
                                    status: status, 
                                    error: errorData.error || 'Request failed',
                                    message: errorData.message || errorData.error || 'Request failed',
                                    description: errorData.description,
                                    errorCode: errorData.errorCode,
                                    timestamp: errorData.timestamp,
                                    path: errorData.path,
                                    ...errorData
                                  };
                                  
                                  if (window.ReactNativeWebView && window.ReactNativeWebView.postMessage) {
                                    window.ReactNativeWebView.postMessage(JSON.stringify({
                                      type: 'debug:error',
                                      message: '[WebView Script] FormData 요청 에러',
                                      data: {
                                        method: method,
                                        url: fullUrl,
                                        status: status,
                                        errorData: errorResponse,
                                        responseText: respText
                                      }
                                    }));
                                  }
                                  
                                  resolve(errorResponse);
                                } catch (e) {
                                  var errorResponse = { 
                                    status: status, 
                                    error: 'Request failed',
                                    message: respText || 'Request failed',
                                    responseText: respText
                                  };
                                  
                                  if (window.ReactNativeWebView && window.ReactNativeWebView.postMessage) {
                                    window.ReactNativeWebView.postMessage(JSON.stringify({
                                      type: 'debug:error',
                                      message: '[WebView Script] FormData 요청 에러 (JSON 파싱 실패)',
                                      data: {
                                        method: method,
                                        url: fullUrl,
                                        status: status,
                                        error: e.message,
                                        responseText: respText.substring(0, 500)
                                      }
                                    }));
                                  }
                                  
                                  resolve(errorResponse);
                                }
                                return;
                              }
                              
                              var respCt = (xhr.getResponseHeader && xhr.getResponseHeader('content-type')) || '';
                              if (respCt.indexOf('application/json') !== -1) {
                                try { 
                                  var parsed = JSON.parse(respText);
                                  
                                  // 성공 응답도 value 속성 체크
                                  if (parsed && typeof parsed === 'object' && 'value' in parsed) {
                                    resolve(parsed.value);
                                  } else {
                                    resolve(parsed);
                                  }
                                }
                                catch (parseErr) { 
                                  if (window.ReactNativeWebView && window.ReactNativeWebView.postMessage) {
                                    window.ReactNativeWebView.postMessage(JSON.stringify({
                                      type: 'debug:error',
                                      message: '[WebView Script] FormData 응답 JSON 파싱 실패',
                                      data: {
                                        method: method,
                                        url: fullUrl,
                                        status: status,
                                        error: parseErr.message,
                                        responseText: respText.substring(0, 500)
                                      }
                                    }));
                                  }
                                  resolve(respText); 
                                }
                              } else {
                                resolve(respText);
                              }
                            }
                          };
                          xhr.onerror = function() {
                            var errorResponse = {
                              status: 0,
                              error: 'Network Error',
                              message: 'XMLHttpRequest failed'
                            };
                            
                            if (window.ReactNativeWebView && window.ReactNativeWebView.postMessage) {
                              window.ReactNativeWebView.postMessage(JSON.stringify({
                                type: 'debug:error',
                                message: '[WebView Script] FormData 요청 네트워크 에러',
                                data: {
                                  method: method,
                                  url: fullUrl,
                                  error: 'XMLHttpRequest failed'
                                }
                              }));
                            }
                            
                            reject(new Error('XMLHttpRequest failed'));
                          };
                          xhr.send(formData);
                        } catch (xhrError) {
                          reject(xhrError);
                        }
                      });
                    })();
                  } else if (method === 'GET' && hasBody) {
                    data = await (function() {
                      return new Promise(function(resolve, reject) {
                        try {
                          var xhr = new XMLHttpRequest();
                          xhr.open('GET', fullUrl, true);
                          xhr.withCredentials = true;
                          
                          // Content-Type을 먼저 설정 (Spring Boot가 @RequestBody를 받으려면 필요)
                          try {
                            xhr.setRequestHeader('Content-Type', 'application/json;charset=utf-8');
                          } catch (e) {}
                          
                          // 나머지 헤더 설정 (Authorization 등)
                          Object.keys(headers).forEach(function(key) {
                            try {
                              // Content-Type은 이미 설정했으므로 제외
                              if (key.toLowerCase() !== 'content-type') {
                                xhr.setRequestHeader(key, headers[key]);
                              }
                            } catch (e) {}
                          });
                          
                          // body를 JSON 문자열로 변환 (백엔드가 요구하는 형식)
                          // ExerciseRequest: { userInput: string, level: string, part: string }
                          // RecipeRequest: { userInput: string }
                          var bodyJson = typeof body === 'string' ? body : JSON.stringify(body);
                          
                          xhr.onreadystatechange = function() {
                            if (xhr.readyState === 4) {
                              status = xhr.status;
                              var respText = xhr.responseText || '';
                              
                              // 에러 상태 코드 처리
                              if (status >= 400) {
                                try {
                                  var errorData = respText ? JSON.parse(respText) : { status: status, error: 'Request failed' };
                                  resolve({ status: status, ...errorData });
                                } catch (e) {
                                  resolve({ status: status, error: respText || 'Request failed', message: respText });
                                }
                                return;
                              }
                              
                              var respCt = xhr.getResponseHeader && xhr.getResponseHeader('content-type') || '';
                              if (respCt.indexOf('application/json') !== -1) {
                                try { 
                                  var parsed = JSON.parse(respText);
                                  resolve(parsed);
                                }
                                catch (parseErr) { 
                                  resolve(respText); 
                                }
                              } else {
                                resolve(respText);
                              }
                            }
                          };
                          xhr.onerror = function() {
                            reject(new Error('XMLHttpRequest failed: Network error'));
                          };
                          xhr.ontimeout = function() {
                            reject(new Error('XMLHttpRequest failed: Timeout'));
                          };
                          xhr.send(bodyJson);
                        } catch (xhrError) {
                          reject(xhrError);
                        }
                      });
                    })();
                  } else {
                    var reqInit = {
                      method: method,
                      headers: headers,
                      credentials: 'include',
                    };
                    if (hasBody) {
                      reqInit.headers = { 'Content-Type': 'application/json', ...headers };
                      reqInit.body = JSON.stringify(body);
                    }
                    
                    var res = await fetch(fullUrl, reqInit);
                    status = res.status;
                    
                    // 에러 상태 코드 처리
                    if (status >= 400) {
                      var errorText = await res.text();
                      try {
                        var errorData = errorText ? JSON.parse(errorText) : { status: status, error: 'Request failed' };
                        data = { status: status, ...errorData };
                      } catch (e) {
                        data = { status: status, error: errorText || 'Request failed', message: errorText };
                      }
                    } else {
                      var contentType = res.headers.get('content-type') || '';
                      if (contentType.includes('application/json')) {
                        data = await res.json();
                      } else {
                        data = await res.text();
                      }
                    }
                  }
                  
                  var responseMsg = {
                    type: 'api:success',
                    id: id,
                    status: status || 200,
                    data: data
                  };
                  
                  if (window.ReactNativeWebView && window.ReactNativeWebView.postMessage) {
                    window.ReactNativeWebView.postMessage(JSON.stringify(responseMsg));
                  }
                } catch (err) {
                  var errorMsg = {
                    type: 'api:error',
                    id: payload.id || id,
                    message: (err && err.message) ? err.message : String(err)
                  };
                  if (window.ReactNativeWebView && window.ReactNativeWebView.postMessage) {
                    window.ReactNativeWebView.postMessage(JSON.stringify(errorMsg));
                  }
                }
              };
            }
            
            // useFormData가 true이거나 window.requestApiFromApp이 없으면 인라인 실행
            // (기존 requestApiFromApp은 FormData를 처리하지 않음)
            if (window.requestApiFromApp && !payload.useFormData) {
              window.requestApiFromApp(${JSON.stringify(JSON.stringify(payload))});
            } else {
              void (async function(){
                try {
                  var p = ${JSON.stringify(payload)};
                  var method = (p.method || 'GET').toUpperCase();
                  var path = p.path || '/';
                  var headers = p.headers || {};
                  var query = p.query || {};
                  var hasBody = typeof p.body !== 'undefined' && p.body !== null;
                  var body = hasBody ? p.body : null;
                  var reqId = p.id || ${JSON.stringify(id)};
                  var useFormData = p.useFormData === true;
                  var formDataFields = p.formDataFields || {};
                  var qs = Object.keys(query).length
                    ? '?' + Object.entries(query).map(function(kv){return encodeURIComponent(kv[0])+'='+encodeURIComponent(kv[1]);}).join('&')
                    : '';
                  var BACKEND_BASE = ${JSON.stringify(API_CONFIG.BASE_URL)};
                  var fullUrl = path.indexOf('http') === 0 ? path + qs : (BACKEND_BASE + path + qs);
                  var statusCode = 0;
                  var d;
                  if (useFormData && formDataFields) {
                    d = await (function() {
                      return new Promise(function(resolve, reject) {
                        try {
                          var xhr = new XMLHttpRequest();
                          xhr.open(method, fullUrl, true);
                          xhr.withCredentials = true;
                          
                          // 헤더 설정 (Authorization 토큰 포함)
                          Object.keys(headers).forEach(function(key) {
                            try {
                              // FormData의 경우 Content-Type은 자동으로 설정되므로 제외
                              if (key.toLowerCase() !== 'content-type') {
                                xhr.setRequestHeader(key, headers[key]);
                              }
                            } catch (e) {}
                          });
                          
                          var fd = new FormData();
                          
                          // 디버깅: formDataFields 로깅
                          if (window.ReactNativeWebView && window.ReactNativeWebView.postMessage) {
                            window.ReactNativeWebView.postMessage(JSON.stringify({
                              type: 'debug:log',
                              message: '[WebView Script] FormData 준비 시작',
                              data: {
                                formDataKeys: Object.keys(formDataFields),
                                hasFiles: formDataFields.files ? formDataFields.files.length : 0
                              }
                            }));
                          }
                          
                          // Spring Boot가 기대하는 multipart/form-data 형식 정확히 생성
                          Object.entries(formDataFields).forEach(function([key, value]) {
                            if (key === 'postCreateRequest' || key === 'commentRequest' || key === 'postUpdateRequest' || key === 'commentUpdateRequest' || key === 'userUpdateRequest') {
                              // JSON part를 백엔드가 정확히 파싱할 수 있도록 구성
                              var jsonString = JSON.stringify(value);
                              
                              // 디버깅: JSON 문자열 로깅
                              if (window.ReactNativeWebView && window.ReactNativeWebView.postMessage) {
                                window.ReactNativeWebView.postMessage(JSON.stringify({
                                  type: 'debug:log',
                                  message: '[WebView Script] JSON part 준비',
                                  data: {
                                    key: key,
                                    jsonString: jsonString,
                                    jsonLength: jsonString.length
                                  }
                                }));
                              }
                              
                              // 백엔드가 기대하는 정확한 multipart/form-data 형식 생성
                              // Spring Boot @RequestPart: part 이름은 파라미터 이름 "postCreateRequest" 사용
                              // Content-Type: application/json이어야 JSON 파싱
                              // 
                              // Android WebView에서 FormData.append()를 사용할 때
                              // Blob/File의 type이 Content-Type으로 제대로 설정되지 않을 수 있음
                              // 따라서 File 객체를 명시적으로 사용하고 Content-Type을 확실히 설정
                              
                              // File 객체 생성 (filename 있음 - Spring Boot는 filename을 무시하고 JSON 파싱)
                              try {
                                if (typeof File !== 'undefined') {
                                  var jsonFile = new File([jsonString], 'postCreateRequest.json', { 
                                    type: 'application/json'
                                  });
                                  fd.append(key, jsonFile);
                                } else {
                                  // File이 없으면 Blob 사용
                                  var jsonBlob = new Blob([jsonString], { type: 'application/json' });
                                  fd.append(key, jsonBlob, 'postCreateRequest.json');
                                }
                              } catch (e) {
                                // File 생성 실패 시 Blob으로 fallback
                                var jsonBlob = new Blob([jsonString], { type: 'application/json' });
                                fd.append(key, jsonBlob);
                              }
                              
                            } else if ((key === 'file' || key === 'files') && value && typeof value === 'object') {
                              // file (단수) 또는 files (복수 배열) 처리
                              if (key === 'file') {
                                // 단일 파일: base64 객체를 Blob으로 변환
                                if (value.data && value.name && value.type) {
                                  try {
                                    var byteCharacters = atob(value.data);
                                    var byteNumbers = new Array(byteCharacters.length);
                                    for (var i = 0; i < byteCharacters.length; i++) {
                                      byteNumbers[i] = byteCharacters.charCodeAt(i);
                                    }
                                    var byteArray = new Uint8Array(byteNumbers);
                                    var blob = new Blob([byteArray], { type: value.type });
                                    fd.append('file', blob, value.name);
                                    
                                    // 디버깅: 파일 추가 로깅
                                    if (window.ReactNativeWebView && window.ReactNativeWebView.postMessage) {
                                      window.ReactNativeWebView.postMessage(JSON.stringify({
                                        type: 'debug:log',
                                        message: '[WebView Script] 파일 추가 완료 (단일)',
                                        data: {
                                          fileName: value.name,
                                          fileType: value.type,
                                          fileSize: byteArray.length
                                        }
                                      }));
                                    }
                                  } catch (e) {
                                    if (window.ReactNativeWebView && window.ReactNativeWebView.postMessage) {
                                      window.ReactNativeWebView.postMessage(JSON.stringify({
                                        type: 'debug:error',
                                        message: '[WebView Script] 파일 변환 실패 (단일)',
                                        data: { error: String(e), fileName: value.name }
                                      }));
                                    }
                                  }
                                }
                              } else if (Array.isArray(value)) {
                                // files 배열: 각 파일을 Blob으로 변환
                                if (value.length > 0) {
                                  value.forEach(function(file, index) {
                                    if (file && file.data && file.name && file.type) {
                                      try {
                                        var byteCharacters = atob(file.data);
                                        var byteNumbers = new Array(byteCharacters.length);
                                        for (var i = 0; i < byteCharacters.length; i++) {
                                          byteNumbers[i] = byteCharacters.charCodeAt(i);
                                        }
                                        var byteArray = new Uint8Array(byteNumbers);
                                        var blob = new Blob([byteArray], { type: file.type });
                                        fd.append('files', blob, file.name);
                                        
                                        // 디버깅: 파일 추가 로깅
                                        if (window.ReactNativeWebView && window.ReactNativeWebView.postMessage) {
                                          window.ReactNativeWebView.postMessage(JSON.stringify({
                                            type: 'debug:log',
                                            message: '[WebView Script] 파일 추가 완료 (배열)',
                                            data: {
                                              index: index,
                                              fileName: file.name,
                                              fileType: file.type,
                                              fileSize: byteArray.length,
                                              totalFiles: value.length
                                            }
                                          }));
                                        }
                                      } catch (e) {
                                        if (window.ReactNativeWebView && window.ReactNativeWebView.postMessage) {
                                          window.ReactNativeWebView.postMessage(JSON.stringify({
                                            type: 'debug:error',
                                            message: '[WebView Script] 파일 변환 실패 (배열)',
                                            data: { error: String(e), index: index, fileName: file.name }
                                          }));
                                        }
                                      }
                                    }
                                  });
                                }
                              }
                            } else {
                              fd.append(key, value);
                            }
                          });
                          
                          // 요청 전 디버깅 로그
                          if (window.ReactNativeWebView && window.ReactNativeWebView.postMessage) {
                            window.ReactNativeWebView.postMessage(JSON.stringify({
                              type: 'debug:log',
                              message: '[WebView Script] FormData 요청 전송 시작',
                              data: {
                                method: method,
                                url: fullUrl,
                                hasAuth: headers['Authorization'] || headers['authorization'] ? 'yes' : 'no',
                                formDataKeys: Array.from(fd.keys ? fd.keys() : [])
                              }
                            }));
                          }
                          
                          xhr.onreadystatechange = function() {
                            if (xhr.readyState === 4) {
                              statusCode = xhr.status;
                              var respText = xhr.responseText || '';
                              
                              // 에러 응답 디버깅 로그
                              if (statusCode >= 400 && window.ReactNativeWebView && window.ReactNativeWebView.postMessage) {
                                try {
                                  var errorData = respText ? JSON.parse(respText) : null;
                                  window.ReactNativeWebView.postMessage(JSON.stringify({
                                    type: 'debug:error',
                                    message: '[WebView Script] FormData 요청 에러',
                                    data: {
                                      status: statusCode,
                                      url: fullUrl,
                                      method: method,
                                      responseText: respText,
                                      errorData: errorData,
                                      errorCode: errorData && errorData.errorCode ? errorData.errorCode : null,
                                      description: errorData && errorData.description ? errorData.description : null,
                                      message: errorData && errorData.message ? errorData.message : null
                                    }
                                  }));
                                } catch (e) {
                                  window.ReactNativeWebView.postMessage(JSON.stringify({
                                    type: 'debug:error',
                                    message: '[WebView Script] FormData 요청 에러 (파싱 실패)',
                                    data: {
                                      status: statusCode,
                                      url: fullUrl,
                                      responseText: respText.substring(0, 1000)
                                    }
                                  }));
                                }
                              }
                              
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
                                  resolve(respText); 
                                }
                              } else {
                                resolve(respText);
                              }
                            }
                          };
                          xhr.onerror = function() {
                            reject(new Error('XMLHttpRequest failed'));
                          };
                          xhr.send(fd);
                        } catch (xhrError) {
                          reject(xhrError);
                        }
                      });
                    })();
                  } else if (method === 'GET' && hasBody) {
                    d = await (function() {
                      return new Promise(function(resolve, reject) {
                        try {
                          var xhr = new XMLHttpRequest();
                          xhr.open('GET', fullUrl, true);
                          xhr.withCredentials = true;
                          
                          // Content-Type을 먼저 설정 (Spring Boot가 @RequestBody를 받으려면 필수)
                          try {
                            xhr.setRequestHeader('Content-Type', 'application/json;charset=utf-8');
                          } catch (e) {}
                          
                          // 나머지 헤더 설정 (Authorization 등) - Content-Type 제외
                          Object.keys(headers).forEach(function(key) {
                            try {
                              if (key.toLowerCase() !== 'content-type') {
                                xhr.setRequestHeader(key, headers[key]);
                              }
                            } catch (e) {}
                          });
                          
                          // body를 JSON 문자열로 변환 (백엔드가 요구하는 형식: ExerciseRequest, RecipeRequest)
                          var bodyJson = typeof body === 'string' ? body : JSON.stringify(body);
                          
                          // 요청 시작 로깅 (React Native로 전달)
                          if (window.ReactNativeWebView && window.ReactNativeWebView.postMessage) {
                            window.ReactNativeWebView.postMessage(JSON.stringify({
                              type: 'debug:log',
                              message: '[WebView Script] GET + body 요청 시작',
                              data: {
                                method: 'GET',
                                url: fullUrl,
                                bodyLength: bodyJson.length,
                                bodyPreview: bodyJson.substring(0, 200),
                                headers: Object.keys(headers)
                              }
                            }));
                          }
                          
                          xhr.onreadystatechange = function() {
                            if (xhr.readyState === 4) {
                              statusCode = xhr.status;
                              var respText = xhr.responseText || '';
                              
                              // 에러 상태 코드 처리
                              if (statusCode >= 400) {
                                // 에러 응답 상세 로깅 (React Native로 전달)
                                if (window.ReactNativeWebView && window.ReactNativeWebView.postMessage) {
                                  window.ReactNativeWebView.postMessage(JSON.stringify({
                                    type: 'debug:error',
                                    message: '[WebView Script] GET + body 에러 응답',
                                    data: {
                                      status: statusCode,
                                      url: fullUrl,
                                      bodySent: bodyJson.substring(0, 200),
                                      responseText: respText.substring(0, 1000),
                                      allHeaders: Object.keys(headers).join(', ')
                                    }
                                  }));
                                }
                                try {
                                  var errorData = respText ? JSON.parse(respText) : { status: statusCode, error: 'Request failed' };
                                  resolve({ status: statusCode, ...errorData });
                                } catch (e) {
                                  resolve({ status: statusCode, error: respText || 'Request failed', message: respText });
                                }
                                return;
                              }
                              
                              var respCt = (xhr.getResponseHeader && xhr.getResponseHeader('content-type')) || '';
                              if (respCt.indexOf('application/json') > -1) {
                                try { 
                                  var parsed = JSON.parse(respText);
                                  resolve(parsed);
                                }
                                catch (parseErr) { 
                                  resolve(respText); 
                                }
                              } else {
                                resolve(respText);
                              }
                            }
                          };
                          xhr.onerror = function() {
                            reject(new Error('XMLHttpRequest failed: Network error'));
                          };
                          xhr.ontimeout = function() {
                            reject(new Error('XMLHttpRequest failed: Timeout'));
                          };
                          xhr.send(bodyJson);
                        } catch (xhrError) {
                          reject(xhrError);
                        }
                      });
                    })();
                  } else {
                    var init = { method: method, headers: headers, credentials: 'include' };
                    if (hasBody) { init.headers = Object.assign({ 'Content-Type': 'application/json' }, headers); init.body = JSON.stringify(body); }
                    var r = await fetch(fullUrl, init);
                    statusCode = r.status;
                    
                    // 에러 상태 코드 처리
                    if (statusCode >= 400) {
                      var errorText = await r.text();
                      try {
                        var errorData = errorText ? JSON.parse(errorText) : { status: statusCode, error: 'Request failed' };
                        d = { status: statusCode, ...errorData };
                      } catch (e) {
                        d = { status: statusCode, error: errorText || 'Request failed', message: errorText };
                      }
                    } else {
                      var ct = r.headers.get('content-type') || '';
                      if (ct.indexOf('application/json') > -1) { d = await r.json(); } else { d = await r.text(); }
                    }
                  }
                  if (window.ReactNativeWebView && window.ReactNativeWebView.postMessage) {
                    var responseMsg = { type: 'api:success', id: reqId, status: statusCode || 200, data: d };
                    window.ReactNativeWebView.postMessage(JSON.stringify(responseMsg));
                  }
                } catch (e) {
                  if (window.ReactNativeWebView && window.ReactNativeWebView.postMessage) {
                    window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'api:error', id: ${JSON.stringify(id)}, message: (e && e.message) || String(e) }));
                  }
                }
              })();
            }
          } catch (e) {
            if (window.ReactNativeWebView && window.ReactNativeWebView.postMessage) {
              window.ReactNativeWebView.postMessage(JSON.stringify({ 
                type: 'api:error', 
                id: ${JSON.stringify(id)}, 
                message: (e && e.message) || String(e) 
              }));
            }
          }
        })();
        true;
      `;
      
      setTimeout(() => {
        try {
          if (this.webViewRef && typeof this.webViewRef.injectJavaScript === 'function') {
            console.log('[WebViewManager] 스크립트 인젝션 실행:', { id, method: payload.method, path: payload.path });
            this.webViewRef.injectJavaScript(script);
            console.log('[WebViewManager] 스크립트 인젝션 완료:', { id });
          } else {
            console.error('[WebViewManager] WebView ref 또는 injectJavaScript 없음:', { 
              hasWebViewRef: !!this.webViewRef,
              hasInjectFunction: !!(this.webViewRef && typeof this.webViewRef.injectJavaScript === 'function')
            });
            reject?.(new Error('WebView ref 또는 injectJavaScript 함수가 없습니다.'));
          }
        } catch (e) {
          console.error('[WebViewManager] 스크립트 인젝션 에러:', e);
          reject?.(e);
        }
      }, 100);
    } catch (e) {
      reject?.(e);
    }
  }

  handleGenericApiResponse(data: any) {
    const { id, type } = data;

    if (type === 'api:bridge-ready') {
      this.bridgeReady = true;
      const queued = this.queuedRequests.slice();
      this.queuedRequests = [];
      queued.forEach((q) => {
        this.requestApi(q.payload).then(q.resolve).catch(q.reject);
      });
      return;
    }

    if (type === 'api:log' || type === 'api:ping' || type === 'api:heartbeat' || type === 'api:start') {
      return;
    }

    // WebView 스크립트에서 보내는 디버그 로그 처리
    if (type === 'debug:log' || type === 'debug:error') {
      const message = data.message || 'Debug log';
      const logData = data.data || {};
      if (type === 'debug:error') {
        console.log(`[WebView Debug] ${message}`, logData);
      } else {
        console.log(`[WebView Debug] ${message}`, logData);
      }
      return;
    }

    if (!id) return;

    const resolver = this.pending.get(id);
    if (!resolver) return;

    this.pending.delete(id);
    this.rejectById.delete(id);

    if (type === 'api:success') {
      const responseData = Object.prototype.hasOwnProperty.call(data, 'data') ? data.data : data;
      const responseStatus = data.status || (responseData && typeof responseData === 'object' && 'status' in responseData ? (responseData as any).status : null);
      
      // 에러 상태 코드 처리 (status >= 400)
      if (responseStatus && responseStatus >= 400) {
        // responseData가 에러 객체인 경우 (status, error 등 포함)
        if (responseData && typeof responseData === 'object') {
          const errorObj = responseData as any;
          const errorMessage = errorObj.error || errorObj.message || errorObj.description || '요청에 실패했습니다.';
          const errorCode = errorObj.errorCode;
          
          // 에러 로깅
          console.log('[WebView] API 에러 응답:', {
            status: errorObj.status || responseStatus,
            path: errorObj.path || data.path,
            error: errorMessage,
            errorCode: errorCode,
            fullResponse: errorObj,
          });
          
          resolver({
            error: true,
            status: errorObj.status || responseStatus,
            message: errorCode ? `${errorMessage} (errorCode:${errorCode})` : errorMessage,
            description: errorObj.description,
            errorCode: errorCode,
            path: errorObj.path,
            timestamp: errorObj.timestamp,
            ...errorObj,
          });
        } else {
          // responseData가 객체가 아닌 경우
          const errorMessage = typeof responseData === 'string' ? responseData : (data.error || data.message || '요청에 실패했습니다.');
          resolver({
            error: true,
            status: responseStatus,
            message: errorMessage,
            ...data,
          });
        }
        return;
      }
      
      if (responseData && typeof responseData === 'object' && responseData !== null) {
        const responseObj = responseData as Record<string, unknown>;
        
        // ApiResponse 래퍼: { errorCode: 200, value: T }
        if ('value' in responseObj) {
          const apiResponse = responseObj as any;
          // errorCode가 있고 200이 아니면 에러
          if ('errorCode' in apiResponse && apiResponse.errorCode !== 200) {
            resolver({
              error: true,
              errorCode: apiResponse.errorCode,
              description: apiResponse.description || '요청에 실패했습니다.',
              ...apiResponse,
            });
            return;
          }
          resolver(apiResponse.value);
          return;
        }
        
        // errorCode만 있는 경우
        if ('errorCode' in responseObj) {
          const errorCode = responseObj.errorCode;
          if (typeof errorCode === 'number' && errorCode !== 200) {
            resolver({
              error: true,
              errorCode,
              description: typeof responseObj.description === 'string' ? responseObj.description : '요청에 실패했습니다.',
              ...responseObj,
            });
            return;
          }
        }
        
        // error 속성이 true인 경우
        if ('error' in responseObj && responseObj.error === true) {
          resolver({
            error: true,
            status: responseObj.status || 500,
            message: typeof responseObj.message === 'string' ? responseObj.message : '요청에 실패했습니다.',
            ...responseObj,
          });
          return;
        }
      }
      
      resolver(responseData);
    } else if (type === 'api:error') {
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
