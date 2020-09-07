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

function guessContentType(body: any): Object {
  const fd = typeof window === 'object' ? window.FormData : null
  if (fd && body instanceof fd) {
    return {}
  }
  return { 'Content-Type': 'application/json' }
}

function httpGET(
  url: string,
  options: BaseApiOptions,
  queryParams?: ParsedQuery,
  auth?: any
) {
  const fullUrl = makeUrl(url, options, queryParams)
  return ajax(
    injectAuthHeaders(
      {
        ...options.requestConfig,
        url: fullUrl,
        method: 'GET',
      },
      options,
      auth
    )
  ).pipe(map(options.mapResponse ?? ((r) => r.response)))
}

function httpPOST(url: string, options: BaseApiOptions, body: any, auth?: any) {
  const fullUrl = makeUrl(url, options)
  return ajax(
    injectAuthHeaders(
      {
        ...options.requestConfig,
        headers: {
          ...guessContentType(body),
          ...options.requestConfig?.headers,
        },
        url: fullUrl,
        method: 'POST',
        body,
      },
      options,
      auth
    )
  ).pipe(map(options.mapResponse ?? ((r) => r.response)))
}

function httpPUT(url: string, options: BaseApiOptions, body: any, auth?: any) {
  const fullUrl = makeUrl(url, options)
  return ajax(
    injectAuthHeaders(
      {
        ...options.requestConfig,
        headers: {
          ...guessContentType(body),
          ...options.requestConfig?.headers,
        },
        url: fullUrl,
        method: 'PUT',
        body,
      },
      options,
      auth
    )
  ).pipe(map(options.mapResponse ?? ((r) => r.response)))
}

function httpPATCH(
  url: string,
  options: BaseApiOptions,
  body: any,
  auth?: any
) {
  const fullUrl = makeUrl(url, options)
  return ajax(
    injectAuthHeaders(
      {
        ...options.requestConfig,
        headers: {
          ...guessContentType(body),
          ...options.requestConfig?.headers,
        },
        url: fullUrl,
        method: 'PATCH',
        body,
      },
      options,
      auth
    )
  ).pipe(map(options.mapResponse ?? ((r) => r.response)))
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

class ApiCurriedAuthUrlBuilder extends BaseApiBuilder<
  ApiCurriedAuthUrlBuilder
> {
  protected options: UrlApiOptions

  constructor(options: UrlApiOptions) {
    super(options)
  }

  get = (auth: any) => (query?: ParsedQuery) =>
    httpGET(this.options.url, this.options, query, auth)

  post = (auth: any) => (body: any) =>
    httpPOST(this.options.url, this.options, body, auth)

  put = (auth: any) => (body: any) =>
    httpPUT(this.options.url, this.options, body, auth)

  path = (auth: any) => (body: any) =>
    httpPATCH(this.options.url, this.options, body, auth)

  protected clone = (options: UrlApiOptions) =>
    new ApiCurriedAuthUrlBuilder(options)
}

class UrlApiBuilder extends BaseApiBuilder<UrlApiBuilder> {
  protected options: UrlApiOptions

  constructor(options: UrlApiOptions) {
    super(options)
  }

  curryAuth = () => new ApiCurriedAuthUrlBuilder(this.options)

  get = (query?: ParsedQuery) => httpGET(this.options.url, this.options, query)

  post = (body?: any) => httpPOST(this.options.url, this.options, body)

  put = (body?: any) => httpPUT(this.options.url, this.options, body)

  path = (body?: any) => httpPATCH(this.options.url, this.options, body)

  protected clone = (options: UrlApiOptions) => new UrlApiBuilder(options)
}

class ResourceApiBuilder extends BaseApiBuilder<ResourceApiBuilder> {
  protected options: UrlApiOptions

  constructor(options: UrlApiOptions) {
    super(options)
  }

  list = (query?: ParsedQuery) => httpGET(this.options.url, this.options, query)

  detail = (pk: string | number, query?: ParsedQuery) =>
    httpGET(this.options.url + `/${pk}`, this.options, query)

  create = (body?: any) => httpPOST(this.options.url, this.options, body)

  update = (pk: string| number, body?: any) =>
    httpPUT(this.options.url + `/${pk}`, this.options, body)

  makeDetailPUT = (actionUrl: string) => (pk: string| number, body?: any) =>
    httpPUT(this.options.url + `/${pk}/${actionUrl}`, this.options, body)

  protected clone = (options: UrlApiOptions) => new ResourceApiBuilder(options)
}

class ApiBuilder extends BaseApiBuilder<ApiBuilder> {
  url = (url: string) => new UrlApiBuilder({ ...this.options, url })

  resource = (url: string) => new ResourceApiBuilder({ ...this.options, url })

  get = (url: string, query?: ParsedQuery) => httpGET(url, this.options, query)

  post = (url: string, body?: any) => httpPOST(url, this.options, body)

  put = (url: string, body?: any) => httpPUT(url, this.options, body)

  patch = (url: string, body?: any) => httpPATCH(url, this.options, body)

  protected clone = (options: BaseApiOptions) => new ApiBuilder(options)
}

export default function magikApi() {
  return new ApiBuilder({})
}
