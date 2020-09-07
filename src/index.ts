import { ajax, AjaxRequest, AjaxResponse } from 'rxjs/ajax'
import { parseUrl, stringifyUrl, ParsedQuery, stringify } from 'query-string'

type ApiUrlRequest = Omit<AjaxRequest, 'url' | 'method' | 'body'>

type AuthHeadersInjector = (auth: any, requestConfig: ApiUrlRequest) => Object

interface BaseApiOptions {
  baseUrl?: string
  auth?: any
  injectAuthHeaders?: AuthHeadersInjector
  requestConfig?: ApiUrlRequest
  queryParams?: ParsedQuery
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
  )
}

function httpPOST(
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
        url: fullUrl,
        method: 'POST',
        body,
      },
      options,
      auth
    )
  )
}

function httpPUT(
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
        url: fullUrl,
        method: 'PUT',
        body,
      },
      options,
      auth
    )
  )
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
        url: fullUrl,
        method: 'PATCH',
        body,
      },
      options,
      auth
    )
  )
}

abstract class BaseApiBuilder<T> {
  protected abstract create(options: BaseApiOptions): T

  protected options: BaseApiOptions

  constructor(options: BaseApiOptions) {
    this.options = options
  }

  baseUrl = (baseUrl: string) => {
    return this.create({ ...this.options, baseUrl })
  }

  auth = (auth: any) => {
    return this.create({ ...this.options, auth })
  }

  authHeaders = (injectAuthHeaders: AuthHeadersInjector) => {
    return this.create({ ...this.options, injectAuthHeaders })
  }

  request = (requestConfig: ApiUrlRequest) => {
    return this.create({
      ...this.options,
      requestConfig: {
        ...this.options.requestConfig,
        ...requestConfig,
      },
    })
  }

  headers = (headers: Object) => {
    return this.create({
      ...this.options,
      requestConfig: {
        ...this.options.requestConfig,
        headers: {
          ...this.options.requestConfig?.headers,
          ...headers,
        },
      },
    })
  }

  query = (queryParams: ParsedQuery) => {
    return this.create({
      ...this.options,
      queryParams: {
        ...this.options.queryParams,
        ...queryParams,
      },
    })
  }
}

interface UrlApiOptions extends BaseApiOptions {
  readonly url: string
}

class UrlApiBuilder extends BaseApiBuilder<UrlApiBuilder> {
  protected options: UrlApiOptions

  constructor(options: UrlApiOptions) {
    super(options)
  }

  curryAuth = () => {
    return new ApiCurriedAuthUrlBuilder(this.options)
  }

  get = (queryParams: ParsedQuery) => {
    return httpGET(this.options.url, this.options, queryParams)
  }

  protected create = (options: UrlApiOptions) => {
    return new UrlApiBuilder(options)
  }
}

class ApiCurriedAuthUrlBuilder extends BaseApiBuilder<
  ApiCurriedAuthUrlBuilder
> {
  protected options: UrlApiOptions

  constructor(options: UrlApiOptions) {
    super(options)
  }

  get = (auth: any) => {
    return (queryParams: ParsedQuery) =>
      httpGET(this.options.url, this.options, queryParams, auth)
  }

  protected create = (options: UrlApiOptions) => {
    return new ApiCurriedAuthUrlBuilder(options)
  }
}

class ApiBuilder extends BaseApiBuilder<ApiBuilder> {
  url = (url: string) => {
    return new UrlApiBuilder({ ...this.options, url })
  }

  get = (url: string, queryParams?: ParsedQuery) => {
    return httpGET(url, this.options, queryParams)
  }

  post = (url: string, queryParams?: ParsedQuery) => {
    return httpGET(url, this.options, queryParams)
  }

  protected create = (options: BaseApiOptions) => {
    return new ApiBuilder(options)
  }
}

export default function magikApi() {
  return new ApiBuilder({})
}