import { z } from 'zod'
import { Constants } from '../types/database'

const idSchema = z.coerce.number().int().positive()

export const vehicleTypeSchema = z.enum(Constants.public.Enums.vehicle_type)

export const brandsQuerySchema = z.object({ type: vehicleTypeSchema })

export const brandParamsSchema = z.object({ brandId: idSchema })

export const modelParamsSchema = z.object({ modelId: idSchema })

export const modelYearParamsSchema = z.object({ modelYearId: idSchema })
