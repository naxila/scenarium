import { BaseActionProcessor } from './BaseAction';
import { ProcessingContext } from '../types';
import { FunctionProcessor } from '../core/FunctionProcessor';

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'HEAD' | 'OPTIONS';

export class RequestApiAction extends BaseActionProcessor {
  static readonly actionType = 'RequestApi';

  async process(action: any, context: ProcessingContext): Promise<void> {
    // Create interpolation context for this action
    const interpolationContext = this.createInterpolationContext(context);
    
    // Create local scope for action-specific variables
    interpolationContext.local.createScope();
    
    try {
      // Set action-specific variables
      interpolationContext.local.setVariable('method', action.method || 'GET');
      interpolationContext.local.setVariable('path', action.path);
      interpolationContext.local.setVariable('baseUrl', action.baseUrl);
      interpolationContext.local.setVariable('success', false);
      interpolationContext.local.setVariable('error', null);
      
      // АРХИТЕКТУРНОЕ УЛУЧШЕНИЕ: Используем унифицированный метод обработки функций
      let processedAction = { ...action };
      
      // Process body if it contains functions
      if (action.body && typeof action.body === 'object' && !Array.isArray(action.body)) {
        const processedBody = await this.processFunctionsInObject(action.body, context, interpolationContext);
        processedAction.body = processedBody;
      }
      
      // Сначала интерполируем основные параметры, но НЕ onSuccess и onFailure
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
      
      // Проверяем, есть ли в теле ответа поле ok, которое указывает на ошибку
      // Некоторые API возвращают успешный HTTP статус, но ok: false в теле
      let bodyOk = true;
      if (responseContext.body && typeof responseContext.body === 'object' && 'ok' in responseContext.body) {
        bodyOk = responseContext.body.ok === true;
      }
      
      // Финальный ok = HTTP статус успешен И тело ответа ok (если есть)
      ok = res.ok && bodyOk;
      
      // Добавляем debug информацию для успешного ответа
      responseContext.debugDescription = this.createDebugDescription(requestDebug, {
        status: res.status,
        headers: hdrs,
        body: responseContext.body,
        ok: ok
      });

      // Если HTTP статус указывает на ошибку ИЛИ тело ответа содержит ok: false, создаем error объект
      if (!res.ok || !bodyOk) {
        const errorInfo = {
          message: !res.ok 
            ? `HTTP ${res.status}: ${res.statusText}`
            : (responseContext.body?.error || responseContext.body?.message || 'Request failed'),
          code: !res.ok 
            ? `HTTP_${res.status}`
            : (responseContext.body?.error_code || responseContext.body?.code || 'REQUEST_FAILED'),
          name: !res.ok ? 'HttpError' : 'RequestError',
          status: res.status,
          statusText: res.statusText,
          body: responseContext.body, // Добавляем тело ответа сервера
          debugDescription: this.createDebugDescription(requestDebug, {
            status: res.status,
            headers: hdrs,
            body: responseContext.body,
            ok: ok
          })
        };
        responseContext.error = errorInfo;
      }
      
    } catch (error: any) {
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
        body: null, // Для сетевых ошибок body всегда null
        debugDescription: this.createDebugDescription(requestDebug, {
          error: errorMessage,
          status: null,
          headers: {},
          body: null,
          ok: false
        })
      };
      
      responseContext.error = errorInfo;
    }

    // Set response data in local scope for nested actions
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

    if (ok && onSuccess) {
      const interpolatedOnSuccess = this.interpolate(onSuccess, interpolationContext);
      
      // Если onSuccess содержит функцию, выполняем её через FunctionProcessor
      // FunctionProcessor.evaluateResult может обработать результат, если он содержит action напрямую
      if (interpolatedOnSuccess && typeof interpolatedOnSuccess === 'object' && interpolatedOnSuccess.function) {
        const { FunctionProcessor } = await import('../core/FunctionProcessor');
        const functionResult = await FunctionProcessor.evaluateResult(interpolatedOnSuccess, {}, nextContext, interpolationContext);
        
        // Проверяем, обработал ли FunctionProcessor результат
        // Если результат содержит action напрямую, то FunctionProcessor его уже обработал
        if (functionResult && typeof functionResult === 'object' && functionResult.action) {
          // FunctionProcessor уже обработал результат, ничего дополнительно делать не нужно
        } else {
          // FunctionProcessor не обработал результат, обрабатываем его сами
          if (Array.isArray(functionResult)) {
            await this.processNestedActions(functionResult, nextContext);
          } else if (functionResult && typeof functionResult === 'object') {
            await this.processNestedActions(functionResult, nextContext);
          } else {
            await this.processNestedActions(interpolatedOnSuccess, nextContext);
          }
        }
      } else {
        await this.processNestedActions(interpolatedOnSuccess, nextContext);
      }
    } else if (!ok && onFailure) {
      const interpolatedOnFailure = this.interpolate(onFailure, interpolationContext);
      
      // Если onFailure содержит функцию, выполняем её через FunctionProcessor
      // FunctionProcessor.evaluateResult может обработать результат, если он содержит action напрямую
      if (interpolatedOnFailure && typeof interpolatedOnFailure === 'object' && interpolatedOnFailure.function) {
        const { FunctionProcessor } = await import('../core/FunctionProcessor');
        const functionResult = await FunctionProcessor.evaluateResult(interpolatedOnFailure, {}, nextContext, interpolationContext);
        
        // Проверяем, обработал ли FunctionProcessor результат
        // Если результат содержит action напрямую, то FunctionProcessor его уже обработал
        if (functionResult && typeof functionResult === 'object' && functionResult.action) {
          // FunctionProcessor уже обработал результат, ничего дополнительно делать не нужно
        } else {
          // FunctionProcessor не обработал результат, обрабатываем его сами
          if (Array.isArray(functionResult)) {
            await this.processNestedActions(functionResult, nextContext);
          } else if (functionResult && typeof functionResult === 'object') {
            await this.processNestedActions(functionResult, nextContext);
          } else {
            await this.processNestedActions(interpolatedOnFailure, nextContext);
          }
        }
      } else {
        await this.processNestedActions(interpolatedOnFailure, nextContext);
      }
    }
    
    } catch (error: any) {
      // Обработка ошибок интерполяции, валидации и других проблем до выполнения запроса
      const errorInfo = {
        message: String(error?.message || error),
        code: error?.code || 'PRE_REQUEST_ERROR',
        name: error?.name || 'Error',
        stack: error?.stack,
        body: null, // Для ошибок до запроса body всегда null
        debugDescription: `=== PRE-REQUEST ERROR ===\nError: ${error?.message || String(error)}\nStack: ${error?.stack || 'No stack trace'}\n\nThis error occurred before the HTTP request was made, likely during interpolation or validation.`
      };
      
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
      
      // Вызываем onFailure если он есть
      if (action.onFailure) {
        
        // Интерполируем onFailure
        const interpolatedOnFailure = this.interpolate(action.onFailure, interpolationContext);
        
        // Если onFailure содержит функцию, выполняем её через FunctionProcessor
        if (interpolatedOnFailure && typeof interpolatedOnFailure === 'object' && interpolatedOnFailure.function) {
          const { FunctionProcessor } = await import('../core/FunctionProcessor');
          const functionResult = await FunctionProcessor.evaluateResult(interpolatedOnFailure, {}, nextContext, interpolationContext);
          
          // Проверяем, обработал ли FunctionProcessor результат
          if (functionResult && typeof functionResult === 'object' && functionResult.action) {
            // FunctionProcessor уже обработал результат
          } else {
            // FunctionProcessor не обработал результат, обрабатываем его сами
            if (Array.isArray(functionResult)) {
              await this.processNestedActions(functionResult, nextContext);
            } else if (functionResult && typeof functionResult === 'object') {
              await this.processNestedActions(functionResult, nextContext);
            } else {
              await this.processNestedActions(interpolatedOnFailure, nextContext);
            }
          }
        } else {
          await this.processNestedActions(interpolatedOnFailure, nextContext);
        }
      }
      
    } finally {
      // Clean up local scope when action completes
      interpolationContext.local.clearScope();
    }
  }

  protected async processNestedActions(actions: any, context: ProcessingContext): Promise<void> {
    if (!actions) {
      return;
    }

    // Handle arrays of actions
    if (Array.isArray(actions)) {
      // Filter out null/undefined values
      const validActions = actions.filter(action => action != null);
      for (const action of validActions) {
        if (action && typeof action === 'object' && action.action) {
          await context.actionProcessor?.processActions(action, context);
        }
      }
    }
    // Handle single action
    else if (actions && typeof actions === 'object' && actions.action) {
      await context.actionProcessor?.processActions(actions, context);
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


