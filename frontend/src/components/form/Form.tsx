import Api from '@ors/helpers/Api/Api'

const api = new Api()

export default async function Form() {
  try {
    await api.get('/auth-token')
  } catch (error) {}

  return <h1>Form</h1>
}
