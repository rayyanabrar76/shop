'use client'

import { useEffect, useState } from 'react'

export interface CreatedCategory {
  id: string
  name: string
  slug: string
  description?: string | null
  imageUrl?: string | null
}

export interface ProductRow {
  id: string
  title: string
  imageUrl?: string | null
}

/** The category being edited, when the form is not creating a new one. */
export interface EditableCategory {
  id: string
  name: string
  slug: string
  description?: string | null
  imageUrl?: string | null
}

/**
 * State and submit logic for the category form, shared by the full-page form in
 * the dashboard and the modal in the theme editor. Only the layout differs
 * between them, so keeping the behaviour here stops the two drifting apart.
 *
 * Pass `initial` to edit an existing category instead of creating one; the only
 * difference downstream is PATCH rather than POST.
 */
export function useCategoryForm(
  storeId: string,
  onSaved: (c: CreatedCategory) => void,
  initial?: EditableCategory | null,
) {
  const isEdit = Boolean(initial)

  const [name, setName] = useState(initial?.name ?? '')
  const [description, setDescription] = useState(initial?.description ?? '')
  const [imageUrl, setImageUrl] = useState(initial?.imageUrl ?? '')
  const [productIds, setProductIds] = useState<string[]>([])
  const [products, setProducts] = useState<ProductRow[]>([])
  const [query, setQuery] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    fetch(`/api/stores/${storeId}/products`)
      .then(r => (r.ok ? r.json() : null))
      .then(d => {
        const list: any[] = Array.isArray(d) ? d : (d?.products ?? [])
        setProducts(list)
        // Membership lives on the product, so which products are already in
        // this category has to be derived from the catalogue.
        if (initial) {
          setProductIds(
            list
              .filter(p => p.category === initial.slug || p.category === initial.name)
              .map(p => p.id),
          )
        }
      })
      .catch(() => {})
    // initial is a snapshot taken when the form opens; re-running on identity
    // change would clobber edits in progress.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storeId])

  const slug = name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
  const filtered = products.filter(p => p.title.toLowerCase().includes(query.toLowerCase()))
  const canSubmit = Boolean(name.trim()) && !saving

  function toggleProduct(id: string) {
    setProductIds(prev => (prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]))
  }

  async function submit() {
    const title = name.trim()
    if (!title) return
    setSaving(true)
    setError('')

    const verb = isEdit ? 'update' : 'create'
    try {
      const res = await fetch(
        isEdit
          ? `/api/stores/${storeId}/categories/${initial!.id}`
          : `/api/stores/${storeId}/categories`,
        {
          method: isEdit ? 'PATCH' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: title,
            slug,
            // Sent as null rather than omitted so clearing them actually sticks.
            description: description.trim() || null,
            imageUrl: imageUrl || null,
            productIds,
          }),
        },
      )
      const data = await res.json().catch(() => null)
      if (!res.ok) throw new Error(data?.error ?? `Could not ${verb} that category`)
      onSaved((data.category ?? data) as CreatedCategory)
    } catch (e) {
      setError(e instanceof Error ? e.message : `Could not ${verb} that category`)
    } finally {
      setSaving(false)
    }
  }

  return {
    isEdit,
    name, setName,
    description, setDescription,
    imageUrl, setImageUrl,
    productIds, toggleProduct,
    products, filtered,
    query, setQuery,
    setProductIds,
    saving, error, slug, canSubmit,
    submit,
  }
}
