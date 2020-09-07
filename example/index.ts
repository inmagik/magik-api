import magikApi from 'magik-api'

const api = magikApi().authHeaders((token: string) => ({
  Authorization: `Token ${token}`,
}))

// magikApi()
api
  .request({
    responseType: 'html'
  })
  // .map(r =>r)
  .get('/').toPromise().then(console.log)

// console.log('x')
