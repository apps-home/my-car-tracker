import { buttonVariants } from '@lib/ui/components/button'
import { Car, Plus } from 'lucide-react'
import Link from 'next/link'

import { EmptyState } from '@/shared/components/EmptyState'

export function NoVehicleState() {
  return (
    <EmptyState
      icon={Car}
      title="Cadastre seu carro primeiro"
      description="Os lançamentos ficam ligados a um veículo, e o km dele é atualizado a cada registro."
      action={
        <Link href="/vehicles?new=1" className={buttonVariants()}>
          <Plus /> Cadastrar veículo
        </Link>
      }
    />
  )
}
