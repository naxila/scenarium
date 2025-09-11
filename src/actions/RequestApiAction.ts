import { BaseActionProcessor } from './BaseAction';
import { ProcessingContext } from '../types';
import { InterpolationEngine } from '../utils/InterpolationEngine';

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'HEAD' | 'OPTIONS';

export class RequestApiAction extends BaseActionProcessor {
  static readonly actionType = 'RequestApi';

  async process(action: any, context: ProcessingContext): Promise<void> {
    const fullContext = this.getFullContext(context);
    
    // Сначала интерполируем весь action
    const interpolatedAction = InterpolationEngine.interpolateObject(action, fullContext);
    
    const {
      method = 'GET',
      path,
      params,
      body,
      headers,
      onStart,
      onSuccess,
      onFailure,
      timeoutMs = 15000,
      baseUrl
    } = interpolatedAction;

    // onStart
    if (onStart) {
      await this.processNestedActions(onStart, {
        ...context,
        localContext: {
          ...context.localContext,
          ...fullContext
        }
      });
    }

    // Сборка URL (теперь path и baseUrl уже интерполированы)
    const resolvedPath = path || '';
    const resolvedBase = baseUrl || '';
    let url = (resolvedBase || '').replace(/\/$/, '') + (resolvedPath || '');
    

    // Query params (уже интерполированы)
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
    try {
      const controller = new AbortController();
      const id = setTimeout(() => controller.abort(), timeoutMs);
      const res = await fetch(url, {
        method: String(method || 'GET').toUpperCase() as HttpMethod,
        headers: resolvedHeaders,
        body: ['GET', 'HEAD'].includes(String(method).toUpperCase()) ? undefined : requestBody,
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
    } catch (error: any) {
      responseContext.error = {
        message: String(error?.message || error),
        code: error?.code || 'UNKNOWN_ERROR',
        name: error?.name || 'Error'
      };
    }

    // onSuccess/onFailure с доступом к {{response.body}} и {{response.headers}}
    const nextContext: ProcessingContext = {
      ...context,
      localContext: {
        ...context.localContext,
        response: responseContext,
        error: responseContext.error
      }
    };


    if (ok && onSuccess) {
      await this.processNestedActions(onSuccess, nextContext);
    } else if (!ok && onFailure) {
      await this.processNestedActions(onFailure, nextContext);
    }
  }
}


