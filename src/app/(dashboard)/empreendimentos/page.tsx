'use client'

import { useState } from 'react'
import { Building2, Plus } from 'lucide-react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { Property, PropertyKind } from '@/types'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState } from '@/components/ui/empty-state'
import { toast } from '@/components/ui/toast'
import { propertiesService } from '@/services/properties.service'
import { usersService } from '@/services/users.service'
import { DevelopmentCard } from '@/features/empreendimentos/development-card'
import { defaultPropertyFilters, FiltersBar, type PropertyFilters, type ViewMode } from '@/features/empreendimentos/filters-bar'
import { NewDevelopmentDialog } from '@/features/empreendimentos/new-development-dialog'
import { NewPropertyDialog } from '@/features/empreendimentos/new-property-dialog'
import { PRICE_RANGE_OPTIONS } from '@/features/empreendimentos/constants'
import { PropertyCard } from '@/features/empreendimentos/property-card'
import { PropertyListView } from '@/features/empreendimentos/property-list-view'
import { mapApiPropertyToProperty, mapDevelopmentFormToDto, mapPropertyFormToDto, type ApiProperty } from '@/features/empreendimentos/api'

interface ApiUser {
  id: string
  name: string
}

export default function EmpreendimentosPage() {
  const [kind, setKind] = useState<PropertyKind>('empreendimento')
  const [viewMode, setViewMode] = useState<ViewMode>('grid')
  const [filters, setFilters] = useState<PropertyFilters>(defaultPropertyFilters)
  const [isDevelopmentDialogOpen, setIsDevelopmentDialogOpen] = useState(false)
  const [isPropertyDialogOpen, setIsPropertyDialogOpen] = useState(false)
  const [editingDevelopment, setEditingDevelopment] = useState<Property | undefined>(undefined)
  const [editingProperty, setEditingProperty] = useState<Property | undefined>(undefined)
  const queryClient = useQueryClient()

  const { data: propertiesData, isLoading } = useQuery<{ data: ApiProperty[] }>({
    queryKey: ['properties', { limit: '100' }],
    queryFn: () => propertiesService.findAll({ limit: '100' }),
  })

  const { data: brokers } = useQuery<ApiUser[]>({
    queryKey: ['users'],
    queryFn: () => usersService.findAll(),
  })

  const allProperties = (propertiesData?.data ?? []).map(mapApiPropertyToProperty)
  const developments = allProperties.filter((property) => property.kind === 'empreendimento')
  const resaleProperties = allProperties.filter((property) => property.kind === 'revenda')

  function invalidateProperties() {
    queryClient.invalidateQueries({ queryKey: ['properties'] })
  }

  const createProperty = useMutation({
    mutationFn: (dto: Record<string, unknown>) => propertiesService.create(dto),
    onSuccess: () => {
      invalidateProperties()
      toast.add({ title: 'Cadastrado com sucesso!', type: 'success' })
    },
    onError: () => {
      toast.add({ title: 'Não foi possível cadastrar', type: 'error' })
    },
  })

  const updateProperty = useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: Record<string, unknown> }) =>
      propertiesService.update(id, dto),
    onSuccess: () => {
      invalidateProperties()
      toast.add({ title: 'Atualizado com sucesso!', type: 'success' })
    },
    onError: () => {
      toast.add({ title: 'Não foi possível salvar as alterações', type: 'error' })
    },
  })

  const deactivateProperty = useMutation({
    mutationFn: (id: string) => propertiesService.deactivate(id),
    onSuccess: () => {
      invalidateProperties()
      toast.add({ title: 'Desativado com sucesso!', type: 'success' })
    },
    onError: () => {
      toast.add({ title: 'Não foi possível desativar', type: 'error' })
    },
  })

  async function handleSubmitDevelopment(data: Parameters<typeof mapDevelopmentFormToDto>[0]) {
    const dto = mapDevelopmentFormToDto(data)
    if (editingDevelopment) {
      await updateProperty.mutateAsync({ id: editingDevelopment.id, dto })
    } else {
      await createProperty.mutateAsync(dto)
    }
  }

  async function handleSubmitProperty(data: Parameters<typeof mapPropertyFormToDto>[0]) {
    const dto = mapPropertyFormToDto(data)
    if (editingProperty) {
      await updateProperty.mutateAsync({ id: editingProperty.id, dto })
    } else {
      await createProperty.mutateAsync(dto)
    }
  }

  function openNewDialog() {
    if (kind === 'empreendimento') {
      setEditingDevelopment(undefined)
      setIsDevelopmentDialogOpen(true)
    } else {
      setEditingProperty(undefined)
      setIsPropertyDialogOpen(true)
    }
  }

  function handleKindChange(nextKind: PropertyKind) {
    setKind(nextKind)
    setFilters(defaultPropertyFilters)
  }

  const search = filters.search.trim().toLowerCase()

  const filteredDevelopments = developments.filter((development) => {
    const matchesSearch =
      search === '' ||
      development.title.toLowerCase().includes(search) ||
      development.city.toLowerCase().includes(search)
    const matchesCity = filters.city === 'todas' || development.city === filters.city
    const matchesStatus = filters.status === 'todos' || development.status === filters.status
    const priceRange = PRICE_RANGE_OPTIONS.find((range) => range.id === filters.priceRangeId)
    const startingPrice = development.startingPrice ?? 0
    const matchesPriceRange =
      !priceRange ||
      priceRange.id === 'todas' ||
      ((priceRange.min === undefined || startingPrice >= priceRange.min) &&
        (priceRange.max === undefined || startingPrice <= priceRange.max))

    return matchesSearch && matchesCity && matchesStatus && matchesPriceRange
  })

  const filteredProperties = resaleProperties.filter((property) => {
    const matchesSearch =
      search === '' ||
      property.title.toLowerCase().includes(search) ||
      property.city.toLowerCase().includes(search)
    const matchesCity = filters.city === 'todas' || property.city === filters.city
    const matchesStatus = filters.status === 'todos' || property.status === filters.status
    const matchesBedrooms =
      filters.bedrooms === 'todos' || (property.bedrooms ?? 0) >= Number(filters.bedrooms)
    const matchesParking =
      filters.parkingSpots === 'todos' || (property.parkingSpots ?? 0) >= Number(filters.parkingSpots)

    return matchesSearch && matchesCity && matchesStatus && matchesBedrooms && matchesParking
  })

  const isEmptyForKind = kind === 'empreendimento' ? developments.length === 0 : resaleProperties.length === 0

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-[28px] font-semibold text-neutral-900">Empreendimentos &amp; Imóveis</h1>
          <p className="mt-1 text-sm text-neutral-400">
            {isLoading
              ? 'Carregando...'
              : kind === 'empreendimento'
                ? `${filteredDevelopments.length} empreendimentos`
                : `${filteredProperties.length} imóveis`}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 rounded-[8px] border-[0.5px] border-neutral-200 bg-white p-1">
            <button
              type="button"
              onClick={() => handleKindChange('empreendimento')}
              className={`rounded-[6px] px-3 py-1.5 text-sm font-medium transition-colors ${
                kind === 'empreendimento' ? 'bg-brand-bg text-brand' : 'text-neutral-400 hover:bg-neutral-100'
              }`}
            >
              Empreendimentos
            </button>
            <button
              type="button"
              onClick={() => handleKindChange('revenda')}
              className={`rounded-[6px] px-3 py-1.5 text-sm font-medium transition-colors ${
                kind === 'revenda' ? 'bg-brand-bg text-brand' : 'text-neutral-400 hover:bg-neutral-100'
              }`}
            >
              Imóveis (Revenda)
            </button>
          </div>

          <button
            type="button"
            onClick={openNewDialog}
            className="inline-flex items-center justify-center gap-2 rounded-[8px] bg-brand px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-brand-dark"
          >
            <Plus className="h-4 w-4" />
            Novo
          </button>
        </div>
      </div>

      <FiltersBar
        kind={kind}
        filters={filters}
        onChange={setFilters}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
      />

      {isLoading ? (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-64 rounded-[16px]" />
          ))}
        </div>
      ) : isEmptyForKind ? (
        <EmptyState
          icon={<Building2 className="h-6 w-6" />}
          title={kind === 'empreendimento' ? 'Nenhum empreendimento cadastrado' : 'Nenhum imóvel cadastrado'}
          description="Cadastre o primeiro imóvel do portfólio para começar a vincular leads e registrar vendas."
          action={{ label: 'Cadastrar primeiro imóvel', onClick: openNewDialog }}
        />
      ) : kind === 'empreendimento' ? (
        <div className="space-y-4">
          {filteredDevelopments.map((development) => (
            <DevelopmentCard
              key={development.id}
              development={development}
              onEdit={() => {
                setEditingDevelopment(development)
                setIsDevelopmentDialogOpen(true)
              }}
              onDeactivate={() => deactivateProperty.mutate(development.id)}
            />
          ))}
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredProperties.map((property) => (
            <PropertyCard
              key={property.id}
              property={property}
              onEdit={() => {
                setEditingProperty(property)
                setIsPropertyDialogOpen(true)
              }}
              onDeactivate={() => deactivateProperty.mutate(property.id)}
            />
          ))}
        </div>
      ) : (
        <PropertyListView
          properties={filteredProperties}
          onEdit={(property) => {
            setEditingProperty(property)
            setIsPropertyDialogOpen(true)
          }}
          onDeactivate={(property) => deactivateProperty.mutate(property.id)}
        />
      )}

      <NewDevelopmentDialog
        key={editingDevelopment?.id ?? 'new-development'}
        open={isDevelopmentDialogOpen}
        onOpenChange={setIsDevelopmentDialogOpen}
        development={editingDevelopment}
        onSubmitDevelopment={handleSubmitDevelopment}
        brokers={brokers ?? []}
      />
      <NewPropertyDialog
        key={editingProperty?.id ?? 'new-property'}
        open={isPropertyDialogOpen}
        onOpenChange={setIsPropertyDialogOpen}
        property={editingProperty}
        onSubmitProperty={handleSubmitProperty}
        brokers={brokers ?? []}
      />
    </div>
  )
}
