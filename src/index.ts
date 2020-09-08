import { ajax, AjaxRequest, AjaxResponse } from 'rxjs/ajax'
import { map } from 'rxjs/operators'
import { parseUrl, stringifyUrl, ParsedQuery, stringify } from 'query-string'

type ApiUrlRequest = Omit<AjaxRequest, 'url' | 'method' | 'body'>

type AuthHeadersInjector = (auth: any, requestConfig: ApiUrlRequest) => Object

type ResponseMapper = (response: AjaxResponse) => any

interface BaseApiOptions {
  baseUrl?: string
  auth?: any
  injectAuthHeaders?: AuthHeadersInjector
  requestConfig?: ApiUrlRequest
  queryParams?: ParsedQuery
  mapResponse?: ResponseMapper
}

function injectAuthHeaders(
  fullRequestConfig: AjaxRequest,
  options: BaseApiOptions,
  auth?: any
): AjaxRequest {
  const flyAuth = auth ?? options.auth
  const authHeaders =
    options.injectAuthHeaders && flyAuth
      ? options.injectAuthHeaders(flyAuth, fullRequestConfig)
      : undefined

  return {
    ...fullRequestConfig,
    headers: {
      ...fullRequestConfig.headers,
      ...authHeaders,
    },
  }
}

function makeUrl(
  url: string,
  options: BaseApiOptions,
  queryParams?: ParsedQuery
) {
  const fullUrl = (options.baseUrl ?? '') + url

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
  if (!body) {
    return {}
  }
  const fd = typeof window === 'object' ? window.FormData : null
  if (fd && body instanceof fd) {
    return {}
  }
  return { 'Content-Type': 'application/json' }
}

interface SendHttpOptions {
  options: BaseApiOptions
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
  return ajax(
    injectAuthHeaders(
      {
        ...guessContentType(body),
        ...options.requestConfig,
        url: fullUrl,
        method,
      },
      options,
      auth
    )
  ).pipe(map(options.mapResponse ?? ((r) => r.response)))
}

function httpGET(
  options: BaseApiOptions,
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

function httpPOST(options: BaseApiOptions, url: string, body: any, auth?: any) {
  return sendHttp({
    url,
    method: 'POST',
    options,
    body,
    auth,
  })
}

function httpPUT(options: BaseApiOptions, url: string, body: any, auth?: any) {
  return sendHttp({
    url,
    method: 'PUT',
    options,
    body,
    auth,
  })
}

function httpPATCH(
  options: BaseApiOptions,
  url: string,
  body: any,
  auth?: any
) {
  return sendHttp({
    url,
    method: 'PATH',
    options,
    body,
    auth,
  })
}

function httpDELETE(
  options: BaseApiOptions,
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
  protected abstract clone(options: BaseApiOptions): T

  protected options: BaseApiOptions

  constructor(options: BaseApiOptions) {
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

interface UrlApiOptions extends BaseApiOptions {
  readonly url: string
}

abstract class HttpVerbsApiBuilder<T> extends BaseApiBuilder<T> {
  protected options: UrlApiOptions

  constructor(options: UrlApiOptions) {
    super(options)
  }

  get = (url: string, query?: ParsedQuery) =>
    httpGET(this.options, this.options.url + url, query)

  post = (url: string, body?: any) =>
    httpPOST(this.options, this.options.url + url, body)

  put = (url: string, body?: any) =>
    httpPUT(this.options, this.options.url + url, body)

  patch = (url: string, body?: any) =>
    httpPATCH(this.options, this.options.url + url, body)

  delete = (url: string, query?: ParsedQuery) =>
    httpDELETE(this.options, this.options.url + url, query)
}

class ApiCurriedAuthUrlBuilder extends BaseApiBuilder<
  ApiCurriedAuthUrlBuilder
> {
  protected options: UrlApiOptions

  constructor(options: UrlApiOptions) {
    super(options)
  }

  get = (auth: any) => (query?: ParsedQuery) =>
    httpGET(this.options, this.options.url, query, auth)

  post = (auth: any) => (body: any) =>
    httpPOST(this.options, this.options.url, body, auth)

  put = (auth: any) => (body: any) =>
    httpPUT(this.options, this.options.url, body, auth)

  path = (auth: any) => (body: any) =>
    httpPATCH(this.options, this.options.url, body, auth)

  delete = (auth: any) => (query?: ParsedQuery) =>
    httpDELETE(this.options, this.options.url, query, auth)

  protected clone = (options: UrlApiOptions) =>
    new ApiCurriedAuthUrlBuilder(options)
}

class UrlApiBuilder extends BaseApiBuilder<UrlApiBuilder> {
  protected options: UrlApiOptions

  constructor(options: UrlApiOptions) {
    super(options)
  }

  curryAuth = () => new ApiCurriedAuthUrlBuilder(this.options)

  get = (query?: ParsedQuery) => httpGET(this.options, this.options.url, query)

  post = (body?: any) => httpPOST(this.options, this.options.url, body)

  put = (body?: any) => httpPUT(this.options, this.options.url, body)

  path = (body?: any) => httpPATCH(this.options, this.options.url, body)

  delete = (query?: ParsedQuery) => httpDELETE(this.options, this.options.url, query)

  protected clone = (options: UrlApiOptions) => new UrlApiBuilder(options)
}

class ResourceApiBuilder extends HttpVerbsApiBuilder<ResourceApiBuilder> {
  list = (query?: ParsedQuery) => httpGET(this.options, this.options.url, query)

  detail = (pk: string | number, query?: ParsedQuery) =>
    httpGET(this.options, this.options.url + `/${pk}`, query)

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

  protected clone = (options: UrlApiOptions) => new ResourceApiBuilder(options)
}

class ApiBuilder extends HttpVerbsApiBuilder<ApiBuilder> {
  url = (url: string) => new UrlApiBuilder({ ...this.options, url })

  resource = (url: string) => new ResourceApiBuilder({ ...this.options, url })

  protected clone = (options: UrlApiOptions) => new ApiBuilder(options)
}

export default function magikApi() {
  return new ApiBuilder({
    url: '',
  })
}
