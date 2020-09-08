import { ajax, AjaxRequest, AjaxResponse } from 'rxjs/ajax'
import { map } from 'rxjs/operators'
import { parseUrl, stringifyUrl, ParsedQuery, stringify } from 'query-string'

type ApiUrlRequest = Omit<AjaxRequest, 'url' | 'method' | 'body'>

type AuthHeadersInjector = (auth: any, requestConfig: ApiUrlRequest) => Object

type ResponseMapper = (response: AjaxResponse) => any

interface ApiOptions {
  url: string
  baseUrl?: string
  auth?: any
  injectAuthHeaders?: AuthHeadersInjector
  requestConfig?: ApiUrlRequest
  queryParams?: ParsedQuery
  mapResponse?: ResponseMapper
}

function injectAuthHeaders(
  fullRequestConfig: AjaxRequest,
  options: ApiOptions,
  auth?: any
): AjaxRequest {
  const flyAuth = auth ?? options.auth
  const authHeaders =
    options.injectAuthHeaders && flyAuth
      ? options.injectAuthHeaders(flyAuth, fullRequestConfig)
      : null

  if (authHeaders) {
    return {
      ...fullRequestConfig,
      headers: {
        ...fullRequestConfig.headers,
        ...authHeaders,
      },
    }
  }
  return fullRequestConfig
}

function makeUrl(url: string, options: ApiOptions, queryParams?: ParsedQuery) {
  const fullUrl = (options.baseUrl ?? '') + options.url + url

  let { url: cleanUrl, query } = parseUrl(fullUrl)
  if (options.queryParams) {
    query = { ...query, ...options.queryParams }
  }
  if (queryParams) {
    query = { ...query, ...queryParams }
  }

  return stringifyUrl({ url: cleanUrl, query })
}

function guessContentType(body?: any): Object {
  const fd = typeof window === 'object' ? window.FormData : null
  if (fd && body instanceof fd) {
    return null
  }
  return 'application/json'
}

interface SendHttpOptions {
  options: ApiOptions
  url: string
  method: string
  queryParams?: ParsedQuery
  body?: any
  auth?: any
}

function sendHttp({
  options,
  url,
  method,
  queryParams,
  body,
  auth,
}: SendHttpOptions) {
  const fullUrl = makeUrl(url, options, queryParams)
  const flyRequestConfig: AjaxRequest = {
    ...options.requestConfig,
    url: fullUrl,
    method,
  }
  if (body) {
    flyRequestConfig.body = body
    const guessedContentTyped = guessContentType(body)
    if (guessedContentTyped) {
      flyRequestConfig.headers = {
        'Content-Type': guessedContentTyped,
        ...flyRequestConfig.headers,
      }
    }
  }
  return ajax(injectAuthHeaders(flyRequestConfig, options, auth)).pipe(
    map(options.mapResponse ?? ((r) => r.response))
  )
}

function httpGET(
  options: ApiOptions,
  url: string,
  queryParams?: ParsedQuery,
  auth?: any
) {
  return sendHttp({
    url,
    method: 'GET',
    options,
    queryParams,
    auth,
  })
}

function httpPOST(options: ApiOptions, url: string, body: any, auth?: any) {
  return sendHttp({
    url,
    method: 'POST',
    options,
    body,
    auth,
  })
}

function httpPUT(options: ApiOptions, url: string, body: any, auth?: any) {
  return sendHttp({
    url,
    method: 'PUT',
    options,
    body,
    auth,
  })
}

function httpPATCH(options: ApiOptions, url: string, body: any, auth?: any) {
  return sendHttp({
    url,
    method: 'PATCH',
    options,
    body,
    auth,
  })
}

function httpDELETE(
  options: ApiOptions,
  url: string,
  queryParams?: ParsedQuery,
  auth?: any
) {
  return sendHttp({
    url,
    method: 'DELETE',
    options,
    queryParams,
    auth,
  })
}

abstract class BaseApiBuilder<T> {
  protected abstract clone(options: ApiOptions): T

  protected options: ApiOptions

  constructor(options: ApiOptions) {
    this.options = options
  }

  baseUrl = (baseUrl: string) => this.clone({ ...this.options, baseUrl })

  auth = (auth: any) => this.clone({ ...this.options, auth })

  authHeaders = (injectAuthHeaders: AuthHeadersInjector) =>
    this.clone({ ...this.options, injectAuthHeaders })

  mapResponse = (mapResponse: ResponseMapper) =>
    this.clone({ ...this.options, mapResponse })

  request = (requestConfig: ApiUrlRequest) =>
    this.clone({
      ...this.options,
      requestConfig: {
        ...this.options.requestConfig,
        ...requestConfig,
      },
    })

  headers = (headers: Object) =>
    this.clone({
      ...this.options,
      requestConfig: {
        ...this.options.requestConfig,
        headers: {
          ...this.options.requestConfig?.headers,
          ...headers,
        },
      },
    })

  query = (queryParams: ParsedQuery) =>
    this.clone({
      ...this.options,
      queryParams: {
        ...this.options.queryParams,
        ...queryParams,
      },
    })
}

abstract class HttpVerbsApiBuilder<T> extends BaseApiBuilder<T> {
  get = (url: string, query?: ParsedQuery) => httpGET(this.options, url, query)

  post = (url: string, body?: any) => httpPOST(this.options, url, body)

  put = (url: string, body?: any) => httpPUT(this.options, url, body)

  patch = (url: string, body?: any) => httpPATCH(this.options, url, body)

  delete = (url: string, query?: ParsedQuery) =>
    httpDELETE(this.options, url, query)
}

class ApiCurriedAuthUrlBuilder extends BaseApiBuilder<
  ApiCurriedAuthUrlBuilder
> {
  get = (auth: any) => (query?: ParsedQuery) =>
    httpGET(this.options, '', query, auth)

  post = (auth: any) => (body: any) => httpPOST(this.options, '', body, auth)

  put = (auth: any) => (body: any) => httpPUT(this.options, '', body, auth)

  path = (auth: any) => (body: any) => httpPATCH(this.options, '', body, auth)

  delete = (auth: any) => (query?: ParsedQuery) =>
    httpDELETE(this.options, '', query, auth)

  protected clone = (options: ApiOptions) =>
    new ApiCurriedAuthUrlBuilder(options)
}

class UrlApiBuilder extends BaseApiBuilder<UrlApiBuilder> {
  protected options: ApiOptions

  constructor(options: ApiOptions) {
    super(options)
  }

  curryAuth = () => new ApiCurriedAuthUrlBuilder(this.options)

  url = (url: string) =>
    new UrlApiBuilder({ ...this.options, url: this.options.url + url })

  resource = (url: string) =>
    new ResourceApiBuilder({ ...this.options, url: this.options.url + url })

  get = (query?: ParsedQuery) => httpGET(this.options, '', query)

  post = (body?: any) => httpPOST(this.options, '', body)

  put = (body?: any) => httpPUT(this.options, '', body)

  path = (body?: any) => httpPATCH(this.options, '', body)

  delete = (query?: ParsedQuery) => httpDELETE(this.options, '', query)

  protected clone = (options: ApiOptions) => new UrlApiBuilder(options)
}

class CurriedAuthResourceApiBuilder extends BaseApiBuilder<
  CurriedAuthResourceApiBuilder
> {
  protected options: ApiOptions

  constructor(options: ApiOptions) {
    super(options)
  }

  list = (auth: any) => (query?: ParsedQuery) =>
    httpGET(this.options, '', query, auth)

  detail = (auth: any) => (pk: string | number, query?: ParsedQuery) =>
    httpGET(this.options, `/${pk}`, query, auth)

  create = (auth: any) => (body?: any) => httpPOST(this.options, '', body, auth)

  update = (auth: any) => (pk: string | number, body?: any) =>
    httpPUT(this.options, `/${pk}`, body, auth)

  remove = (auth: any) => (pk: string | number, query?: ParsedQuery) =>
    httpDELETE(this.options, `/${pk}`, query, auth)

  removeId = (auth: any) => (id: string | number, query?: ParsedQuery) =>
    httpDELETE(
      { ...this.options, mapResponse: () => ({ id }) },
      `/${id}`,
      query,
      auth
    )

  protected clone = (options: ApiOptions) =>
    new CurriedAuthResourceApiBuilder(options)
}

class ResourceApiBuilder extends HttpVerbsApiBuilder<ResourceApiBuilder> {
  curryAuth = () => new CurriedAuthResourceApiBuilder(this.options)

  list = (query?: ParsedQuery) => httpGET(this.options, this.options.url, query)

  detail = (pk: string | number, query?: ParsedQuery) =>
    httpGET(this.options, `/${pk}`, query)

  create = (body?: any) => httpPOST(this.options, this.options.url, body)

  update = (pk: string | number, body?: any) =>
    httpPUT(this.options, this.options.url + `/${pk}`, body)

  remove = (pk: string | number, query?: ParsedQuery) =>
    httpDELETE(this.options, this.options.url + `/${pk}`, query)

  removeId = (id: string | number, query?: ParsedQuery) =>
    httpDELETE(
      { ...this.options, mapResponse: () => ({ id }) },
      this.options.url + `/${id}`,
      query
    )

  protected clone = (options: ApiOptions) => new ResourceApiBuilder(options)
}

class ApiBuilder extends HttpVerbsApiBuilder<ApiBuilder> {
  url = (url: string) => new UrlApiBuilder({ ...this.options, url })

  resource = (url: string) => new ResourceApiBuilder({ ...this.options, url })

  protected clone = (options: ApiOptions) => new ApiBuilder(options)
}

export default function magikApi() {
  return new ApiBuilder({
    url: '',
  })
}
