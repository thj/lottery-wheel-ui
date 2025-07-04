interface LoginResponse {
  code: number
  msg: string
  data: {
    token: string
    username: string
  }
}

export const login = async (username: string, password: string, code: string, uuid: string): Promise<string> => {
  const response = await fetch('http://192.168.5.150:8080/retail-admin/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      username,
      password,
      code,
      uuid
    })
  })
  
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`)
  }

  const data: LoginResponse = await response.json()
  
  if (data.code !== 200) {
    throw new Error(data.msg || '登录失败')
  }

  return data.data.token
}