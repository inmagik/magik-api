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
})
