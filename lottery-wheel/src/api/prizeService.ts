interface Prize {
  id: number
  name: string
  // 其他可能的字段
}

interface PrizeListResponse {
  code: number
  msg: string
  data: {
    rows: Prize[]
    total: number
  }
}

import { useUserStore } from '../stores/user'

export const getPrizes = async (): Promise<Prize[]> => {
  try {
    const userStore = useUserStore()
    const token = userStore.token
    
    if (!token) {
      throw new Error('未登录，请先登录')
    }

    const response = await fetch('http://192.168.5.150:8080/retail-admin/system/prize/list?pageNum=1&pageSize=10', {
      headers: {
        'Authorization': 'Bearer ' + token,
        'Content-Type': 'application/json'
      }
    })
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const data: PrizeListResponse = await response.json()
    
    if (data.code !== 200) {
      throw new Error(data.msg || 'Failed to fetch prizes')
    }

    return data.rows
  } catch (error) {
    console.error('Error fetching prizes:', error)
    throw error
  }
}