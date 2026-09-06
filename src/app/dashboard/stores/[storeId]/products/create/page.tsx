'use client'

import { useParams } from 'next/navigation'
import ProductCreateForm from '../ProductCreateForm'

/**
 * The form itself lives in ProductCreateForm so the visual editor can open the
 * same thing in a modal without a second copy of it.
 */
export default function CreateProductPage() {
  const params = useParams()
  return <ProductCreateForm storeId={params.storeId as string} />
}
