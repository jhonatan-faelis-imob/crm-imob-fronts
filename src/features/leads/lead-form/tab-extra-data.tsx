import { useFormContext } from 'react-hook-form'
import { FieldGrid, FormField, inputClassName } from './field'
import { MaskedDateInput } from './masked-date-input'
import { MaskedInput } from './masked-input'
import { currencyMask } from './masks'
import { EDUCATION_LEVEL_META, EDUCATION_LEVELS } from './options'
import type { LeadFormValues } from './schema'

export function TabExtraData() {
  const {
    register,
    control,
    formState: { errors },
  } = useFormContext<LeadFormValues>()
  const extraErrors = errors.extra

  return (
    <div className="space-y-4">
      <FieldGrid>
        <FormField label="Número do PIS" htmlFor="pis">
          <input id="pis" className={inputClassName} {...register('extra.pis')} />
        </FormField>

        <FormField label="Naturalidade" htmlFor="birthplace">
          <input id="birthplace" className={inputClassName} {...register('extra.birthplace')} />
        </FormField>

        <FormField label="Número do RG" htmlFor="rg">
          <input id="rg" className={inputClassName} {...register('extra.rg')} />
        </FormField>

        <FormField label="Data emissão RG" htmlFor="rgIssueDate" error={extraErrors?.rgIssueDate?.message}>
          <MaskedDateInput control={control} name="extra.rgIssueDate" id="rgIssueDate" />
        </FormField>

        <FormField label="Escolaridade" htmlFor="education">
          <select id="education" defaultValue="" className={inputClassName} {...register('extra.education')}>
            <option value="" disabled>
              Selecione
            </option>
            {EDUCATION_LEVELS.map((level) => (
              <option key={level} value={level}>
                {EDUCATION_LEVEL_META[level]}
              </option>
            ))}
          </select>
        </FormField>

        <FormField label="Renda utilizada para análise" htmlFor="incomeForAnalysis">
          <MaskedInput
            id="incomeForAnalysis"
            control={control}
            name="extra.incomeForAnalysis"
            mask={currencyMask}
            placeholder="R$ 0,00"
          />
        </FormField>

        <FormField label="Data de nascimento" htmlFor="birthDate" error={extraErrors?.birthDate?.message}>
          <MaskedDateInput control={control} name="extra.birthDate" id="birthDate" />
        </FormField>

        <FormField label="Profissão" htmlFor="occupation">
          <input id="occupation" className={inputClassName} {...register('extra.occupation')} />
        </FormField>

        <FormField label="Nome do pai" htmlFor="fatherName" fullWidth>
          <input id="fatherName" className={inputClassName} {...register('extra.fatherName')} />
        </FormField>

        <FormField label="Nome da mãe" htmlFor="motherName" fullWidth>
          <input id="motherName" className={inputClassName} {...register('extra.motherName')} />
        </FormField>
      </FieldGrid>
    </div>
  )
}
