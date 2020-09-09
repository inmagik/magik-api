const mockAjax = jest.fn((...args: any) =>
  of({
    response: { name: 'GioVa' },
    status: 200,
  })
)
jest.mock('rxjs/ajax', () => ({
  __esModule: true,
  ajax: (...args: any) => mockAjax(...args),
}))
jest.mock('rxjs/ajax')
import { ParsedQuery } from 'query-string'
import { of } from 'rxjs'
import { ajax } from 'rxjs/ajax'

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

    expect(gangApi.remove(23).toPromise()).resolves.toEqual({
      name: 'GioVa',
    })
    expect(mockAjax).toHaveBeenLastCalledWith({
      url: '/v1/gangs/23',
      method: 'DELETE',
    })

    await expect(gangApi.removeId(99).toPromise()).resolves.toEqual({
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
      magikApi()
        .mapResponse((r) => r.status)
        .get('/')
        .toPromise()
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
  })
})
