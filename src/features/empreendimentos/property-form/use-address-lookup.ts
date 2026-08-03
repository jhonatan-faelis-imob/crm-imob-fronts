import { useState } from 'react'
import axios from 'axios'

interface ViaCepResponse {
  logradouro: string
  complemento: string
  bairro: string
  localidade: string
  uf: string
  erro?: boolean
}

export interface AddressLookupResult {
  street: string
  neighborhood: string
  city: string
  state: string
}

export function useAddressLookup() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function lookup(cep: string): Promise<AddressLookupResult | null> {
    const digits = cep.replace(/\D/g, '')

    if (digits.length !== 8) {
      setError('Informe um CEP válido')
      return null
    }

    setIsLoading(true)
    setError(null)

    try {
      const { data } = await axios.get<ViaCepResponse>(`https://viacep.com.br/ws/${digits}/json/`)

      if (data.erro) {
        setError('CEP não encontrado')
        return null
      }

      return {
        street: data.logradouro,
        neighborhood: data.bairro,
        city: data.localidade,
        state: data.uf,
      }
    } catch {
      setError('Não foi possível buscar o CEP')
      return null
    } finally {
      setIsLoading(false)
    }
  }

  return { lookup, isLoading, error }
}
