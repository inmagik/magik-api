# Magik API
> Fluent API client based on rxjs

## Install
```sh
yarn add magik-api
npm install --save magik-api
```

## Usage

```js

// Start building
const api = magikApi()
  // Configure a base url
  .baseUrl('/v1')
  // Enabel tralling slash?
  .trailingSlash(true)
  // Confgure request
  // https://github.com/ReactiveX/rxjs/blob/6.x/src/internal/observable/dom/AjaxObservable.ts#L7
  .request({
    timeout: 23,
    responseType: 'text',
  })
  // Set query params
  .query({
    name: 'Mike'
  })
  // Configure headers
  .headers({
    'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
  })
  // Map response, default is:
  .mapResponse(r => response)
  // Configure auth headers default is:
  .authHeaders(token => ({
    Authorization: token
  }))


api.get(
  // URL
  '/foo',
  // Query Params
  { name: 'Arturo' }
)

api.post( // Same .put .patch
  // URL
  '/foo',
  // BODY
  { name: 'Arturo' }
)

// Content-Type headers is set default to: application/json
// or nothing if U give FormData

api.delete(
  // URL
  '/foo',
  // Query Params
  { name: 'Arturo' }
)

// Authenticate a request
api.auth('Secret').get('/me')

// Curry an url
const getHello = api.url('/hello').get // Same for .put, .path, .post, .delete

getHello(
  // Query params
  { q: 'best' }
)

// Curry auth on url
const getAuthHello = api.url('/hello').curryAuth().get

getHello('TOKEN')(
  // Query params
  { q: 'best' }
)

// Resource
const todosApi = api.resource('/todos')

todosApi.list({ mode: 'dirty' })
// GET /todos?mode=dirty

todosApi.detail(23, { mode: 'dirty' })
// GET /todos/23?mode=dirty

todosApi.create({ mode: 'dirty' })
// POST /todos

todosApi.update(2, { mode: 'dirty' })
// PUT /todos/2

todosApi.partialUpdate(2, { mode: 'dirty' })
// PATCH /todos/2

todosApi.delete(2, { mode: 'dirty' })
// DELETE /todos/2

// ehehe shorcut
todosApi.deleteId(2)
// DELETE /todos/2
// map response to ({ id: 2 }) util for 204 No Content styles responses

// You can use the other methods as well
todosApi.put('/23/toggle')
// PUT /todos/23/toggle

// Curry auth on resource
const todosApiAuth = api.resource('/todos').curryAuth()

todosApiAuth.detail('TOKEN')(33)
// Same for list, detail, update, partialUpdate, delete, deleteId

```