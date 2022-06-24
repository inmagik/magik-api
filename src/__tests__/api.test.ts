import { lastValueFrom, of } from 'rxjs';
const mockAjax = jest.fn((config: any) =>
  of({
    response: { name: 'GioVa' },
    status: 200,
  })
)
jest.mock('rxjs/ajax', () => ({
  __esModule: true,
  ajax: (config: any) => mockAjax({
    ...config,
    // NOTE: This line avoid the pain to insert
    // createXHR: ...
    // in every fucking expect
    createXHR: undefined,
  }),
}))
jest.mock('rxjs/ajax')
import { ParsedQuery } from 'query-string'

import magikApi from '../index'

beforeEach(() => {
  mockAjax.mockClear()
})

describe('Magik API', () => {
  it('should handle all HTTP verbs', () => {
    magikApi().get('/bau')
    expect(mockAjax).toHaveBeenLastCalledWith({
      url: '/bau',
      method: 'GET',
    })
    magikApi().get('/bau', { name: 'Gyanny' })
    expect(mockAjax).toHaveBeenLastCalledWith({
      url: '/bau?name=Gyanny',
      method: 'GET',
    })

    magikApi().post('/hello')
    expect(mockAjax).toHaveBeenLastCalledWith({
      url: '/hello',
      method: 'POST',
    })

    magikApi().post('/hello', {
      name: 'Gio Va',
    })
    expect(mockAjax).toHaveBeenLastCalledWith({
      url: '/hello',
      method: 'POST',
      body: {
        name: 'Gio Va',
      },
      headers: {
        'Content-Type': 'application/json',
      },
    })

    magikApi().put('/hello')
    expect(mockAjax).toHaveBeenLastCalledWith({
      url: '/hello',
      method: 'PUT',
    })

    const fd = new FormData()
    magikApi().put('/hello', fd)
    expect(mockAjax).toHaveBeenLastCalledWith({
      url: '/hello',
      method: 'PUT',
      body: fd,
    })

    magikApi().patch('/x')
    expect(mockAjax).toHaveBeenLastCalledWith({
      url: '/x',
      method: 'PATCH',
    })

    magikApi()
      .headers({
        'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
      })
      .patch('/x', { name: 'Rinne' })
    expect(mockAjax).toHaveBeenLastCalledWith({
      url: '/x',
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
      },
      body: {
        name: 'Rinne',
      },
    })

    magikApi().delete('/kill')
    expect(mockAjax).toHaveBeenLastCalledWith({
      url: '/kill',
      method: 'DELETE',
    })

    magikApi().delete('/kill', { ids: [1, 2, 3] } as ParsedQuery<any>)
    expect(mockAjax).toHaveBeenLastCalledWith({
      url: '/kill?ids=1&ids=2&ids=3',
      method: 'DELETE',
    })
  })

  it('should handle headers', () => {
    const api = magikApi()
    api
      .headers({
        'X-Giova': 23,
      })
      .headers({
        'Content-Type': 'Fuck',
      })
      .headers({
        'X-Giova': 99,
      })
      .put('/', {
        name: 'Rinne',
      })
    expect(mockAjax).toHaveBeenLastCalledWith({
      url: '/',
      headers: {
        'X-Giova': 99,
        'Content-Type': 'Fuck',
      },
      body: {
        name: 'Rinne',
      },
      method: 'PUT',
    })
  })

  it('should handle low level request configuration', () => {
    const api = magikApi()
    api
      .request({
        timeout: 23,
      })
      .request({
        responseType: 'text',
      })
      .headers({
        'X-Giova': 23,
        'X-Gang': 'KDS',
      })
      .request({
        headers: {
          'X-Giova': 23,
        },
      })
      .get('/')
    expect(mockAjax).toHaveBeenLastCalledWith({
      url: '/',
      method: 'GET',
      headers: {
        'X-Giova': 23,
      },
      timeout: 23,
      responseType: 'text',
    })
  })

  it('should handle query params', () => {
    magikApi()
      .query({
        name: 'GioVa',
        age: '23',
      })
      .get('/foo', { age: '27' })
    expect(mockAjax).toHaveBeenLastCalledWith({
      url: '/foo?age=27&name=GioVa',
      method: 'GET',
    })

    magikApi()
      .query({
        name: 'GioVa',
        age: '23',
      })
      .get('/foo?name=Ringo&age=99&gang=KDS', { age: '27' })
    expect(mockAjax).toHaveBeenLastCalledWith({
      url: '/foo?age=27&gang=KDS&name=Ringo',
      method: 'GET',
    })

    magikApi()
      .query({
        name: 'GioVa',
        age: '23',
      })
      .put('/foo', { age: '27' })
    expect(mockAjax).toHaveBeenLastCalledWith({
      url: '/foo?age=23&name=GioVa',
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: {
        age: '27',
      },
    })
  })

  it('should be able to set a base url for requests', () => {
    const api = magikApi().baseUrl('/v1')

    api.get('/bau')
    expect(mockAjax).toHaveBeenLastCalledWith({
      url: '/v1/bau',
      method: 'GET',
    })

    api.put('/bau')
    expect(mockAjax).toHaveBeenLastCalledWith({
      url: '/v1/bau',
      method: 'PUT',
    })

    api.baseUrl('/awesome').delete('/bau')
    expect(mockAjax).toHaveBeenLastCalledWith({
      url: '/awesome/bau',
      method: 'DELETE',
    })

    api.post('/d')
    expect(mockAjax).toHaveBeenLastCalledWith({
      url: '/v1/d',
      method: 'POST',
    })
  })

  it('should handle resources', async () => {
    const api = magikApi().baseUrl('/v1')

    const gangApi = api.resource('/gangs')
    gangApi.list()
    expect(mockAjax).toHaveBeenLastCalledWith({
      url: '/v1/gangs',
      method: 'GET',
    })

    gangApi.list({ name: 'Gio', nick: 'Va' })
    expect(mockAjax).toHaveBeenLastCalledWith({
      url: '/v1/gangs?name=Gio&nick=Va',
      method: 'GET',
    })

    gangApi.detail(23)
    expect(mockAjax).toHaveBeenLastCalledWith({
      url: '/v1/gangs/23',
      method: 'GET',
    })

    gangApi.create({ name: 'KDS' })
    expect(mockAjax).toHaveBeenLastCalledWith({
      url: '/v1/gangs',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: {
        name: 'KDS',
      },
    })

    gangApi.update(23, { name: 'Raverz' })
    expect(mockAjax).toHaveBeenLastCalledWith({
      url: '/v1/gangs/23',
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: {
        name: 'Raverz',
      },
    })

    gangApi.partialUpdate(232, { name: 'RaverzX' })
    expect(mockAjax).toHaveBeenLastCalledWith({
      url: '/v1/gangs/232',
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: {
        name: 'RaverzX',
      },
    })

    expect(lastValueFrom(gangApi.remove(23))).resolves.toEqual({
      name: 'GioVa',
    })
    expect(mockAjax).toHaveBeenLastCalledWith({
      url: '/v1/gangs/23',
      method: 'DELETE',
    })

    await expect(lastValueFrom(gangApi.removeId(99))).resolves.toEqual({
      id: 99,
    })
    expect(mockAjax).toHaveBeenLastCalledWith({
      url: '/v1/gangs/99',
      method: 'DELETE',
    })

    gangApi.put('/foo/23', { name: 'Raverz' })
    expect(mockAjax).toHaveBeenLastCalledWith({
      url: '/v1/gangs/foo/23',
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: {
        name: 'Raverz',
      },
    })

    gangApi.post('/foox/23', { name: 'Raverzx' })
    expect(mockAjax).toHaveBeenLastCalledWith({
      url: '/v1/gangs/foox/23',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: {
        name: 'Raverzx',
      },
    })

    gangApi.get('/fuzzy', { name: 'O.o' })
    expect(mockAjax).toHaveBeenLastCalledWith({
      url: '/v1/gangs/fuzzy?name=O.o',
      method: 'GET',
    })

    gangApi
      .headers({
        'X-Giova': 23,
      })
      .patch('/foox/23', { name: 'Raverzxx' })
    expect(mockAjax).toHaveBeenLastCalledWith({
      url: '/v1/gangs/foox/23',
      method: 'PATCH',
      headers: {
        'X-Giova': 23,
        'Content-Type': 'application/json',
      },
      body: {
        name: 'Raverzxx',
      },
    })

    gangApi.delete('/killa')
    expect(mockAjax).toHaveBeenLastCalledWith({
      url: '/v1/gangs/killa',
      method: 'DELETE',
    })
  })

  it('should give a way to map out response', async () => {
    await expect(
      lastValueFrom(magikApi()
        .mapResponse((r) => r.status)
        .get('/'))
    ).resolves.toEqual(200)
  })

  it('should handle auth', () => {
    const api = magikApi()

    api
      .auth('Jonny')
      .authHeaders((t) => ({
        Authorization: `Tokenz ${t}`,
      }))
      .get('/zecrets')
    expect(mockAjax).toHaveBeenLastCalledWith({
      url: '/zecrets',
      method: 'GET',
      headers: {
        Authorization: 'Tokenz Jonny',
      },
    })

    api.auth('Jonny').get('/ola')
    expect(mockAjax).toHaveBeenLastCalledWith({
      url: '/ola',
      method: 'GET',
      headers: {
        Authorization: 'Jonny',
      },
    })
  })

  it('should handle curry url', () => {
    const api = magikApi()

    const getFoo = api.url('/foo').get
    getFoo({ hello: 'Giova' })
    expect(mockAjax).toHaveBeenLastCalledWith({
      url: '/foo?hello=Giova',
      method: 'GET',
    })

    api.url('/bella').url('/giova').post()
    expect(mockAjax).toHaveBeenLastCalledWith({
      url: '/bella/giova',
      method: 'POST',
    })

    api.url('/bella').url('/giova').url('/wooo').put({ gang: 23 })
    expect(mockAjax).toHaveBeenLastCalledWith({
      url: '/bella/giova/wooo',
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: {
        gang: 23,
      },
    })

    api.url('/kill').delete()
    expect(mockAjax).toHaveBeenLastCalledWith({
      url: '/kill',
      method: 'DELETE',
    })

    api.url('/ppp').patch({ hello: 'Giova' })
    expect(mockAjax).toHaveBeenLastCalledWith({
      url: '/ppp',
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: {
        hello: 'Giova',
      },
    })
  })

  it('should handle url curry auth', () => {
    const getFoo = magikApi().url('/foo').curryAuth().get
    getFoo('Secret')({ hello: 'Giova' })
    expect(mockAjax).toHaveBeenLastCalledWith({
      url: '/foo?hello=Giova',
      method: 'GET',
      headers: {
        Authorization: 'Secret',
      },
    })

    const authApi = magikApi().authHeaders((t) => ({
      Authorization: `Token ${t}`,
    }))

    const gangsAuth = authApi.url('/gangs').curryAuth()
    const postGang = gangsAuth.post

    postGang('X')({ name: 'Giova' })
    expect(mockAjax).toHaveBeenLastCalledWith({
      url: '/gangs',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Token X',
      },
      body: {
        name: 'Giova',
      },
    })

    const deleteGang = gangsAuth.delete
    deleteGang('O.o')({ ids: 'ABC' })
    expect(mockAjax).toHaveBeenLastCalledWith({
      url: '/gangs?ids=ABC',
      method: 'DELETE',
      headers: {
        Authorization: 'Token O.o',
      },
    })

    const partialUpdateGang = gangsAuth.headers({
      'X-Name': 'Rinne',
    }).patch
    partialUpdateGang('O.o')({ ids: 'ABC' })
    expect(mockAjax).toHaveBeenLastCalledWith({
      url: '/gangs',
      method: 'PATCH',
      body: {
        ids: 'ABC',
      },
      headers: {
        'X-Name': 'Rinne',
        'Content-Type': 'application/json',
        Authorization: 'Token O.o',
      },
    })
  })

  it('should handle resource curry auth', async () => {
    const fooDetail = magikApi().resource('/foo').curryAuth().detail

    fooDetail('Secret')(23)
    expect(mockAjax).toHaveBeenLastCalledWith({
      url: '/foo/23',
      method: 'GET',
      headers: {
        Authorization: 'Secret',
      },
    })

    const fooList = magikApi().resource('/foo').curryAuth().list
    fooList('Secret')()
    expect(mockAjax).toHaveBeenLastCalledWith({
      url: '/foo',
      method: 'GET',
      headers: {
        Authorization: 'Secret',
      },
    })

    const updateFoo = magikApi().resource('/foo').curryAuth().update
    updateFoo('Secret')(99, { go: 'Home' })
    expect(mockAjax).toHaveBeenLastCalledWith({
      url: '/foo/99',
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Secret',
      },
      body: {
        go: 'Home',
      },
    })

    const partialUpdateFoo = magikApi().resource('/foo').curryAuth()
      .partialUpdate
      partialUpdateFoo('Secret')(99, { go: 'Home' })
    expect(mockAjax).toHaveBeenLastCalledWith({
      url: '/foo/99',
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Secret',
      },
      body: {
        go: 'Home',
      },
    })

    const removeFoo = magikApi().resource('/foo').curryAuth().remove
    removeFoo('Secret')(99)
    expect(mockAjax).toHaveBeenLastCalledWith({
      url: '/foo/99',
      method: 'DELETE',
      headers: {
        Authorization: 'Secret',
      },
    })

    const removeFooId = magikApi().resource('/foo').curryAuth().headers({
      'X-Drago': 23,
    }).removeId

    await expect(lastValueFrom(removeFooId('Secret')(99))).resolves.toEqual({
      id: 99,
    })
    expect(mockAjax).toHaveBeenLastCalledWith({
      url: '/foo/99',
      method: 'DELETE',
      headers: {
        'X-Drago': 23,
        Authorization: 'Secret',
      },
    })
  })

  it('should able to create resources from curried url', () => {
    const maTickets = magikApi().url('/posts/23').resource('/tickets')
    maTickets.detail(88)
    expect(mockAjax).toHaveBeenLastCalledWith({
      url: '/posts/23/tickets/88',
      method: 'GET',
    })
  })

  it('should support trailing slash', () => {
    const api = magikApi().trailingSlash(true)
    api.get('/woo/')
    expect(mockAjax).toHaveBeenLastCalledWith({
      url: '/woo/',
      method: 'GET',
    })
    api.get('/woo')
    expect(mockAjax).toHaveBeenLastCalledWith({
      url: '/woo/',
      method: 'GET',
    })
    api.get('/woo?name=Giova')
    expect(mockAjax).toHaveBeenLastCalledWith({
      url: '/woo/?name=Giova',
      method: 'GET',
    })

    api.resource('/tasks').update(23, { name: 'Giova' })
    expect(mockAjax).toHaveBeenLastCalledWith({
      url: '/tasks/23/',
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: {
        name: 'Giova',
      },
    })

  })
})
