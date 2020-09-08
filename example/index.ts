import magikApi from 'magik-api'
import { ajaxPut } from 'rxjs/internal/observable/dom/AjaxObservable'

const api = magikApi()
  // Configure how inject headers when an api call is authenticated ..
  .authHeaders((token: string) => ({
    Authorization: `Token ${token}`,
  }))

// Make a simple GET
api.get('/todos')
// api.get({ gang: '23' })
// ...At then You will get an Observable
api.delete('/ficcc', { g: '2' })
// .toPromise().then(console.log)

// Add a query params GET /todos?done=yes
api.get('/todos', { done: 'yes' })

// Make a POST default use application/json unless FormData is given ...
api.post('/todos', { title: 'Learn REST' })

// PUT
api.put('todos/1', { title: 'Learn REST Again' })
// .toPromise().then(console.log)

// // PATCH
api.patch('todos/1', { title: 'Learn REST Yess' })

// // TODO: DELETE

// Set headers
api
  .headers({
    'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
  })
  .put('/')

// Set base url
api.baseUrl('/v1')

// Set all request
api.request({
  responseType: 'text',
})

// Map response default is r => r.response
api.mapResponse((r) => r.status)

// Authenticate a request
api
  // Will be mapped using authHeaders function
  .auth('My Cool Token')
  // Auth GET!
  .get('/user')

// The API Builder is immutable
const api1 = api.headers({
  'X-Hello': 'Hello',
})

api1
  .headers({
    'X-Hello': 'Goodbye',
  })
  .get('/')

// Will send header X-Hello: Hello
api1.get('/x')

// Curry url
const fetchTodos = api.url('/todos').get
fetchTodos()
// work also for put, post, patch and delete

// Curry a resource!
const todosApi = api.resource('/todos')
// todosApi.delete('/fucker/23', { gang: '23' })
// todosApi
// .auth(23)
// .post('/duck')
// .headers({
//   'X-GANG': 'xxxx'
// })
//   // .mapResponse()
//   // .delete('/fucker/23', { gang: '23' })
//   .removeId(33)
  // .p
// .list()
// api.url('/ffffff').curryAuth().get('xxxx')({ aaa: 'xx' })
// .
// curryAuht().create
// .toPromise().then(console.log)
// todosApi.headers({}).
// todosApi.list()
// todosApi.detail(23)
// todosApi.create({ title: 'Hot Fix A' })
// todosApi.update(12, { title: 'Hot Fix A' })
// // todosApi.delete(17)
// // todosApi.makeDetailPUT()
// // todosApi.put('/fuck/12', )
// // put('/)
// todosApi.makeDetailPUT('/toggle')(23)


// magikApi()
const data = new FormData()
data.set('name', 'ARTURO')

const getMaTodo = api
  .request({
    responseType: 'text',
  })
  .mapResponse((r) => r.status)
  .query({
    gang: '23',
  })
  // .get('/', { name: 'Gio Va' }).toPromise().then(console.log)
  .headers({
    'X-X': 23,
    // 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8'
  })
  .resource('/todos')
// .update(23, { title: 'xx' })
// .auth(23)
// .detail(13)

// getMaTodo(99, { bu: 'fu' })
// .url('/x')
// .get()
// .curryAuth()
// .post(29)({ nmae: 'Gio Va' })
// .toPromise()
// .then(console.log)

// console.log('x')
