// NOTE: This useless import fixed types problems during build
// TS2339: Property 'observable' does not exist on type 'SymbolConstructor'.
import { Observable } from 'rxjs'
import { ajax, AjaxRequest, AjaxResponse } from 'rxjs/ajax'
import { map } from 'rxjs/operators'
import { parseUrl, stringifyUrl, ParsedQuery } from 'query-string'
import xhr2 from 'xhr2'

// NOTE: rxjs 6.x do more stuff to support IE < 10
// this line drop support for IE < 10 but add support for nodejs
// library like Axios ecc doesn't support IE < 10 end at then end when
// finally rxjs 7 arrive drop support to IE < 10
// so use XMLHttpRequest without paranoia and fuck IE < 10
// https://github.com/ReactiveX/rxjs/commit/0eaadd60c716050f5e3701d513a028a9cd49085a
const XHR2 = typeof XMLHttpRequest !== 'undefined' ? XMLHttpRequest : xhr2

type ApiUrlRequest = Omit<AjaxRequest, 'url' | 'method' | 'body'>

type AuthHeadersInjector = (auth: any, requestConfig: ApiUrlRequest) => Object

type ResponseMapper = (response: AjaxResponse) => any

interface ApiOptions {
  url: string
  baseUrl?: string
  trailingSlash: boolean
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
  let authHeaders
  if (flyAuth) {
    authHeaders =
      typeof options.injectAuthHeaders === 'function'
        ? options.injectAuthHeaders(flyAuth, fullRequestConfig)
        : { Authorization: flyAuth }
  }

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
    query = { ...options.queryParams, ...query }
  }
  if (queryParams) {
    query = { ...query, ...queryParams }
  }

  if (
    options.trailingSlash &&
    cleanUrl.length > 0 &&
    cleanUrl[cleanUrl.length - 1] !== '/'
  ) {
    cleanUrl += '/'
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
    createXHR: () => new XHR2(),
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
    map(
      typeof options.mapResponse === 'function'
        ? options.mapResponse
        : (r) => r.response
    )
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

  protected readonly options: ApiOptions

  constructor(options: ApiOptions) {
    Object.defineProperty(this, 'options', {
      value: options,
      configurable: false,
      writable: false,
      enumerable: false,
    })
  }

  /**
   * Set the base url for your next http requests
   * return a new instance of furrent api builder object
   *
   * @param {string} baseUrl Base url for all your requests
   **/
  baseUrl = (baseUrl: string) => this.clone({ ...this.options, baseUrl })

  /**
   * Inject the auhentication into your http request
   * according to your authHeaders() config
   *
   * @param {any} auth A value that rapresent your auth usually a token
   **/
  auth = (auth: any) => this.clone({ ...this.options, auth })

  /**
   * Describe how to inject the authentication headers into your http request
   * when called using .auth() method.
   *
   * @param {AuthHeadersInjector} injectAuthHeaders A callback that is supposed to return
   * an object of headers using to authenticate your request.
   *
   * (token) => { 'Authorization': `Token ${token}` }
   **/
  authHeaders = (injectAuthHeaders: AuthHeadersInjector) =>
    this.clone({ ...this.options, injectAuthHeaders })

  /**
   * Map the response from rxjs ajax result to the result of your
   * http request.
   *
   * @param {ResponseMapper} mapResponse A callback to map your response
   *
   * (r) => r.response.map(...)
   **/
  mapResponse = (mapResponse: ResponseMapper) =>
    this.clone({ ...this.options, mapResponse })

  /**
   * Enable or disable trailing slash
   *
   * @param {boolean} trailingSlash Is trailing slash enabled?
   */
  trailingSlash = (trailingSlash: boolean) =>
    this.clone({ ...this.options, trailingSlash })

  /**
   * Set the rxjs AJAX request configuration
   *
   * @param {ApiUrlRequest} requestConfig The rxjs request config object
   */
  request = (requestConfig: ApiUrlRequest) =>
    this.clone({
      ...this.options,
      requestConfig: {
        ...this.options.requestConfig,
        ...requestConfig,
      },
    })

  /**
   * Set the headers of your http request, merge with previous setted headers
   *
   * @param {Object} headers An object of headers
   */
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

  /**
   * Set the query string of your http request
   *
   * @param {ParsedQuery} queryParams An object encoded as query string
   */
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
  /**
   * Make a GET HTTP Request
   *
   * @param {string} url The url of request
   * @param {ParsedQuery} query An object encoded as query string
   **/
  get = (url: string, query?: ParsedQuery) => httpGET(this.options, url, query)

  /**
   * Make a POST HTTP Request
   *
   * @param {string} url The url of request
   * @param {any} body The body of request
   **/
  post = (url: string, body?: any) => httpPOST(this.options, url, body)

  /**
   * Make a PUT HTTP Request
   *
   * @param {string} url The url of request
   * @param {any} body The body of request
   **/
  put = (url: string, body?: any) => httpPUT(this.options, url, body)

  /**
   * Make a PATCH HTTP Request
   *
   * @param {string} url The url of request
   * @param {any} body The body of request
   **/
  patch = (url: string, body?: any) => httpPATCH(this.options, url, body)

  /**
   * Make a DELETE HTTP Request
   *
   * @param {string} url The url of request
   * @param {ParsedQuery} query An object encoded as query string
   **/
  delete = (url: string, query?: ParsedQuery) =>
    httpDELETE(this.options, url, query)
}

class ApiCurriedAuthUrlBuilder extends BaseApiBuilder<ApiCurriedAuthUrlBuilder> {
  get = (auth: any) => (query?: ParsedQuery) =>
    httpGET(this.options, '', query, auth)

  post = (auth: any) => (body: any) => httpPOST(this.options, '', body, auth)

  put = (auth: any) => (body: any) => httpPUT(this.options, '', body, auth)

  patch = (auth: any) => (body: any) => httpPATCH(this.options, '', body, auth)

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

  /**
   * Create an API Builder instance with auth curried
   *
   **/
  curryAuth = () => new ApiCurriedAuthUrlBuilder(this.options)

  /**
   * Create an API Builder instance with given url concat with current
   * url as curried url
   *
   * @param {string} url The curried url
   **/
  url = (url: string) =>
    new UrlApiBuilder({ ...this.options, url: this.options.url + url })

  resource = (url: string) =>
    new ResourceApiBuilder({ ...this.options, url: this.options.url + url })

  /**
   * Make a GET HTTP Request to your current curried url
   *
   * @param {ParsedQuery} query An object encoded as query string
   **/
  get = (query?: ParsedQuery) => httpGET(this.options, '', query)

  /**
   * Make a POST HTTP Request to your current curried url
   *
   * @param {any} body The body of request
   **/
  post = (body?: any) => httpPOST(this.options, '', body)

  /**
   * Make a PUT HTTP Request to your current curried url
   *
   * @param {string} url The url of request
   * @param {any} body The body of request
   **/
  put = (body?: any) => httpPUT(this.options, '', body)

  /**
   * Make a PATCH HTTP Request to your current curried url
   *
   * @param {any} body The body of request
   **/
  patch = (body?: any) => httpPATCH(this.options, '', body)

  /**
   * Make a DELETE HTTP Request to your current curried url
   *
   * @param {ParsedQuery} query An object encoded as query string
   **/
  delete = (query?: ParsedQuery) => httpDELETE(this.options, '', query)

  protected clone = (options: ApiOptions) => new UrlApiBuilder(options)
}

class CurriedAuthResourceApiBuilder extends BaseApiBuilder<CurriedAuthResourceApiBuilder> {
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

  partialUpdate = (auth: any) => (pk: string | number, body?: any) =>
    httpPATCH(this.options, `/${pk}`, body, auth)

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

  /**
   * Make a GET request to your configured url
   *
   * @param {ParsedQuery} query An object encoded as query string
   */
  list = (query?: ParsedQuery) => httpGET(this.options, '', query)

  /**
   * Make a GET request to your configured url/{pk}
   *
   * @param {number} pk Primary key of your resource
   * @param {ParsedQuery} query An object encoded as query string
   */
  detail = (pk: string | number, query?: ParsedQuery) =>
    httpGET(this.options, `/${pk}`, query)

  /**
   * Make a POST request to your configured url
   *
   * @param {any} body The body of request
   */
  create = (body?: any) => httpPOST(this.options, '', body)

  /**
   * Make a PUT request to your configured url/{pk}
   *
   * @param {number} pk Primary key of your resource
   * @param {any} body The body of request
   */
  update = (pk: string | number, body?: any) =>
    httpPUT(this.options, `/${pk}`, body)

  /**
   * Make a PATCH request to your configured url/{pk}
   *
   * @param {number} pk Primary key of your resource
   * @param {any} body The body of request
   */
  partialUpdate = (pk: string | number, body?: any) =>
    httpPATCH(this.options, `/${pk}`, body)

  /**
   * Make a DELETE request to your configured url/{pk}
   *
   * @param {number} pk Primary key of your resource
   * @param {ParsedQuery} query An object encoded as query string
   */
  remove = (pk: string | number, query?: ParsedQuery) =>
    httpDELETE(this.options, `/${pk}`, query)

  /**
   * Make a DELETE request to your configured url/{pk}
   *
   * automatic map response as ({ id })
   *
   * @param {number} pk Primary key of your resource
   * @param {ParsedQuery} query An object encoded as query string
   */
  removeId = (id: string | number, query?: ParsedQuery) =>
    httpDELETE(
      { ...this.options, mapResponse: () => ({ id }) },
      `/${id}`,
      query
    )

  protected clone = (options: ApiOptions) => new ResourceApiBuilder(options)
}

class ApiBuilder extends HttpVerbsApiBuilder<ApiBuilder> {
  /**
   * Create an API Builder instance with given url curried
   *
   * @param {string} url The curried url
   **/
  url = (url: string) => new UrlApiBuilder({ ...this.options, url })

  /**
   * Create an API Resource Builder instance starting from given url
   *
   * @param {string} url The url of your resource
   **/
  resource = (url: string) => new ResourceApiBuilder({ ...this.options, url })

  protected clone = (options: ApiOptions) => new ApiBuilder(options)
}

export default function magikApi() {
  return new ApiBuilder({
    url: '',
    trailingSlash: false,
  })
}
