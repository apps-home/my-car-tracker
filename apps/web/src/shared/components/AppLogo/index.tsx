import { cn } from '@lib/ui/lib/utils'

interface AppLogoProps {
  className?: string
  /** Cor do desenho; o padrão herda a cor do texto (ex.: `text-primary`) */
  color?: string
  size?: number
}

/**
 * Marca do My Car Tracker: carro de perfil sobre a estrada tracejada.
 * Também é usada pelo ImageResponse (ícones, favicon), por isso só usa SVG
 * com atributos simples.
 */
export function AppLogo({
  className,
  color = 'currentColor',
  size
}: AppLogoProps) {
  return (
    <svg
      data-slot="app-logo"
      aria-hidden="true"
      className={cn('size-6 shrink-0', className)}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={color}
    >
      {/* Carroceria com as janelas vazadas (evenodd) e as rodas */}
      <path
        fillRule="evenodd"
        d="M3 14.9V11C3 10.3 3.4 9.8 4.1 9.6L7 8.8 9.3 5.7C9.7 5.2 10.2 4.9 10.9 4.9H14.6C15.3 4.9 15.9 5.2 16.3 5.8L18.6 8.8 20.2 9.3C20.9 9.5 21.3 10.1 21.3 10.8V14.9H19.6A2.6 2.6 0 0 0 14.4 14.9H9.6A2.6 2.6 0 0 0 4.4 14.9ZM9.9 8.6 11.2 6.4C11.4 6.1 11.6 6.1 11.9 6.1H12.6V8.6ZM13.6 6.1H14.3C14.6 6.1 14.8 6.2 15 6.4L16.6 8.6H13.6Z"
      />
      <circle cx="7" cy="15.2" r="1.9" />
      <circle cx="17" cy="15.2" r="1.9" />
      {/* Estrada */}
      <rect x="2" y="19.6" width="5.5" height="1.6" rx="0.8" />
      <rect x="9.25" y="19.6" width="5.5" height="1.6" rx="0.8" />
      <rect x="16.5" y="19.6" width="5.5" height="1.6" rx="0.8" />
    </svg>
  )
}
