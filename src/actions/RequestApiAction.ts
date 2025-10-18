import { BaseActionProcessor } from './BaseAction';
import { ProcessingContext } from '../types';
import { FunctionProcessor } from '../core/FunctionProcessor';

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'HEAD' | 'OPTIONS';

export class RequestApiAction extends BaseActionProcessor {
  static readonly actionType = 'RequestApi';

  async process(action: any, context: ProcessingContext): Promise<void> {
    console.log('🔍🔍🔍 REQUEST API ACTION START 🔍🔍🔍');
    console.log('🔍 Action:', JSON.stringify(action, null, 2));
    
    // Create interpolation context for this action
    const interpolationContext = this.createInterpolationContext(context);
    
    // Create local scope for action-specific variables
    interpolationContext.local.createScope();
    
    try {
      console.log('🔍 Setting initial variables...');
      // Set action-specific variables
      interpolationContext.local.setVariable('method', action.method || 'GET');
      interpolationContext.local.setVariable('path', action.path);
      interpolationContext.local.setVariable('baseUrl', action.baseUrl);
      interpolationContext.local.setVariable('success', false);
      interpolationContext.local.setVariable('error', null);
      console.log('🔍 Initial variables set');
      
      // АРХИТЕКТУРНОЕ УЛУЧШЕНИЕ: Используем унифицированный метод обработки функций
      let processedAction = { ...action };
      
      // Process body if it contains functions
      if (action.body && typeof action.body === 'object' && !Array.isArray(action.body)) {
        const processedBody = await this.processFunctionsInObject(action.body, context, interpolationContext);
        processedAction.body = processedBody;
      }
      
      // Сначала интерполируем основные параметры, но НЕ onSuccess и onFailure
      console.log('🔍 Interpolating main action parameters...');
      const mainAction = { ...processedAction };
      delete mainAction.onSuccess;
      delete mainAction.onFailure;
      const interpolatedMain = this.interpolate(mainAction, interpolationContext);
      
      const {
        method = 'GET',
        path,
        params,
        body,
        headers,
        onStart,
        timeoutMs = 15000,
        baseUrl
      } = interpolatedMain;
      
      // onSuccess и onFailure будем интерполировать позже, после установки error в контекст
      const onSuccess = processedAction.onSuccess;
      const onFailure = processedAction.onFailure;
    
    console.log('🔍 Extracted parameters:');
    console.log('🔍 - method:', method);
    console.log('🔍 - path:', path);
    console.log('🔍 - onFailure:', onFailure);

    // onStart
    if (onStart) {
      await this.processNestedActions(onStart, context);
    }

    // Build URL (now path and baseUrl are already interpolated)
    const resolvedPath = path || '';
    const resolvedBase = baseUrl || '';
    let url = (resolvedBase || '').replace(/\/$/, '') + (resolvedPath || '');
    

    // Query params (already interpolated)
    const resolvedParams = params;
    if (resolvedParams && Object.keys(resolvedParams).length > 0) {
      const usp = new URLSearchParams();
      for (const [k, v] of Object.entries(resolvedParams)) {
        if (v === undefined || v === null) continue;
        if (Array.isArray(v)) {
          v.forEach((vv) => usp.append(k, String(vv)));
        } else {
          usp.append(k, String(v));
        }
      }
      const qs = usp.toString();
      if (qs) url += (url.includes('?') ? '&' : '?') + qs;
    }

    // Headers (уже интерполированы)
    const resolvedHeaders: Record<string, string> = headers || {};
    if (!resolvedHeaders['Content-Type'] && body !== undefined) {
      resolvedHeaders['Content-Type'] = 'application/json';
    }

    // Body (уже интерполирован)
    let requestBody: any = undefined;
    if (body !== undefined) {
      requestBody = typeof body === 'string' ? body : JSON.stringify(body);
    }

    // Выполняем запрос
    console.log('🔍 Starting HTTP request...');
    let ok = false;
    let responseContext: any = { body: null, headers: {} };
    
    // Создаем финальный объект запроса для fetch
    const finalFetchOptions = {
      method: String(method || 'GET').toUpperCase() as HttpMethod,
      headers: resolvedHeaders,
      body: ['GET', 'HEAD'].includes(String(method).toUpperCase()) ? undefined : requestBody,
    };
    
    // Создаем debug информацию о запросе
    const requestDebug = {
      method: finalFetchOptions.method,
      url: url,
      headers: finalFetchOptions.headers,
      body: finalFetchOptions.body,
      timeout: timeoutMs
    };
    
    console.log('🔍 Request debug info:', JSON.stringify(requestDebug, null, 2));
    
    try {
      const controller = new AbortController();
      const id = setTimeout(() => controller.abort(), timeoutMs);
      const res = await fetch(url, {
        ...finalFetchOptions,
        signal: controller.signal
      } as any);
      clearTimeout(id);

      ok = res.ok;
      // Заголовки → объект
      const hdrs: Record<string, string> = {};
      res.headers.forEach((v, k) => (hdrs[k] = v));
      responseContext.headers = hdrs;
      responseContext.status = res.status;
      responseContext.url = res.url;
      responseContext.origin = res.url.split('/').slice(0, 3).join('/');

      // Пытаемся парсить json, иначе текст
      const contentType = res.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        try { responseContext.body = await res.json(); } catch { responseContext.body = await res.text(); }
      } else {
        responseContext.body = await res.text();
      }
      
      // Добавляем debug информацию для успешного ответа
      responseContext.debugDescription = this.createDebugDescription(requestDebug, {
        status: res.status,
        headers: hdrs,
        body: responseContext.body,
        ok: res.ok
      });

      // Если HTTP статус указывает на ошибку, создаем error объект
      if (!res.ok) {
        console.log('🔍 HTTP error detected, creating error object...');
        const errorInfo = {
          message: `HTTP ${res.status}: ${res.statusText}`,
          code: `HTTP_${res.status}`,
          name: 'HttpError',
          status: res.status,
          statusText: res.statusText,
          debugDescription: this.createDebugDescription(requestDebug, {
            status: res.status,
            headers: hdrs,
            body: responseContext.body,
            ok: res.ok
          })
        };
        responseContext.error = errorInfo;
        console.log('🔍 Error object created:', JSON.stringify(errorInfo, null, 2));
      } else {
        console.log('🔍 HTTP request successful');
      }
      
    } catch (error: any) {
      console.log('🔍 Fetch error caught:', error);
      
      // Определяем более точный код ошибки
      let errorCode = 'UNKNOWN_ERROR';
      let errorMessage = String(error?.message || error);
      
      if (error?.cause?.code === 'ECONNREFUSED' || error?.code === 'ECONNREFUSED') {
        errorCode = 'CONNECTION_REFUSED';
        errorMessage = 'Connection refused - server is not available or not running';
      } else if (error?.cause?.code === 'ENOTFOUND' || error?.code === 'ENOTFOUND') {
        errorCode = 'HOST_NOT_FOUND';
        errorMessage = 'Host not found - check URL and network connectivity';
      } else if (error?.cause?.code === 'ETIMEDOUT' || error?.code === 'ETIMEDOUT') {
        errorCode = 'TIMEOUT';
        errorMessage = 'Request timeout - server took too long to respond';
      } else if (error?.name === 'AbortError') {
        errorCode = 'REQUEST_ABORTED';
        errorMessage = 'Request was aborted due to timeout';
      }
      
      // Создаем расширенную информацию об ошибке
      const errorInfo = {
        message: errorMessage,
        code: errorCode,
        name: error?.name || 'Error',
        stack: error?.stack,
        debugDescription: this.createDebugDescription(requestDebug, {
          error: errorMessage,
          status: null,
          headers: {},
          body: null,
          ok: false
        })
      };
      
      responseContext.error = errorInfo;
      console.log('🔍 Fetch error object created:', JSON.stringify(errorInfo, null, 2));
    }

    // Set response data in local scope for nested actions
    console.log('🔍 Setting variables in local scope...');
    console.log('🔍 - responseContext:', JSON.stringify(responseContext, null, 2));
    console.log('🔍 - responseContext.error:', responseContext.error);
    console.log('🔍 - ok:', ok);
    
    interpolationContext.local.setVariable('response', responseContext);
    interpolationContext.local.setVariable('error', responseContext.error);
    interpolationContext.local.setVariable('ok', ok);

    // Create context for nested actions with response data
    const nextContext: ProcessingContext = {
      ...context,
      localContext: {
        ...context.localContext,
        response: responseContext,
        error: responseContext.error,
        ok: ok
      },
      interpolationContext: interpolationContext // Pass interpolation context to nested actions
    };

    console.log('🔍 Next context created:');
    console.log('🔍 - nextContext.localContext.error:', nextContext.localContext.error);
    console.log('🔍 - nextContext.localContext.ok:', nextContext.localContext.ok);

    if (ok && onSuccess) {
      console.log('🔍 Interpolating onSuccess...');
      const interpolatedOnSuccess = this.interpolate(onSuccess, interpolationContext);
      console.log('🔍 Interpolated onSuccess:', JSON.stringify(interpolatedOnSuccess, null, 2));
      console.log('🔍 Calling onSuccess...');
      await this.processNestedActions(interpolatedOnSuccess, nextContext);
    } else if (!ok && onFailure) {
      console.log('🔍 Interpolating onFailure...');
      const interpolatedOnFailure = this.interpolate(onFailure, interpolationContext);
      console.log('🔍 Interpolated onFailure:', JSON.stringify(interpolatedOnFailure, null, 2));
      console.log('🔍 Calling onFailure...');
      await this.processNestedActions(interpolatedOnFailure, nextContext);
    } else {
      console.log('🔍 No callback called - ok:', ok, 'onSuccess:', !!onSuccess, 'onFailure:', !!onFailure);
    }
    
    } catch (error: any) {
      console.log('🔍 Main catch block - pre-request error:', error);
      // Обработка ошибок интерполяции, валидации и других проблем до выполнения запроса
      const errorInfo = {
        message: String(error?.message || error),
        code: error?.code || 'PRE_REQUEST_ERROR',
        name: error?.name || 'Error',
        stack: error?.stack,
        debugDescription: `=== PRE-REQUEST ERROR ===\nError: ${error?.message || String(error)}\nStack: ${error?.stack || 'No stack trace'}\n\nThis error occurred before the HTTP request was made, likely during interpolation or validation.`
      };
      
      console.log('🔍 Pre-request error object created:', JSON.stringify(errorInfo, null, 2));
      
      // Устанавливаем error в контекст
      interpolationContext.local.setVariable('error', errorInfo);
      interpolationContext.local.setVariable('ok', false);
      
      // Создаем контекст для onFailure
      const nextContext: ProcessingContext = {
        ...context,
        localContext: {
          ...context.localContext,
          error: errorInfo,
          ok: false
        },
        interpolationContext: interpolationContext
      };
      
      console.log('🔍 Pre-request nextContext created:');
      console.log('🔍 - nextContext.localContext.error:', nextContext.localContext.error);
      
      // Вызываем onFailure если он есть
      if (action.onFailure) {
        console.log('🔍 Calling onFailure for pre-request error...');
        await this.processNestedActions(action.onFailure, nextContext);
      } else {
        console.log('🔍 No onFailure defined for pre-request error');
      }
      
    } finally {
      // Clean up local scope when action completes
      interpolationContext.local.clearScope();
    }
  }
  
  private createDebugDescription(request: any, response: any): string {
    const lines: string[] = [];
    
    // Запрос - показываем финальные значения после интерполяции
    lines.push('--- FINAL HTTP REQUEST SENT ---');
    lines.push(`${request.method} ${request.url}`);
    lines.push(`Timeout: ${request.timeout}ms`);
    
    if (request.headers && Object.keys(request.headers).length > 0) {
      lines.push('Request Headers:');
      for (const [key, value] of Object.entries(request.headers)) {
        lines.push(`  ${key}: ${value}`);
      }
    } else {
      lines.push('Request Headers: (none)');
    }
    
    if (request.body !== undefined && request.body !== null) {
      lines.push('Request Body:');
      if (typeof request.body === 'string') {
        lines.push(`  ${request.body}`);
      } else {
        lines.push(`  ${JSON.stringify(request.body, null, 2)}`);
      }
    } else {
      lines.push('Request Body: (none)');
    }
    
    // Ответ
    lines.push('\n--- HTTP RESPONSE RECEIVED ---');
    if (response.error) {
      lines.push(`[ERROR] Error: ${response.error}`);
    } else {
      lines.push(`[SUCCESS] Status: ${response.status}`);
      lines.push(`[SUCCESS] OK: ${response.ok}`);
      
      if (response.headers && Object.keys(response.headers).length > 0) {
        lines.push('Response Headers:');
        for (const [key, value] of Object.entries(response.headers)) {
          lines.push(`  ${key}: ${value}`);
        }
      } else {
        lines.push('Response Headers: (none)');
      }
      
      if (response.body !== null && response.body !== undefined) {
        lines.push('Response Body:');
        if (typeof response.body === 'string') {
          lines.push(`  ${response.body}`);
        } else {
          lines.push(`  ${JSON.stringify(response.body, null, 2)}`);
        }
      } else {
        lines.push('Response Body: (empty)');
      }
    }
    
    return lines.join('\n');
  }
}


