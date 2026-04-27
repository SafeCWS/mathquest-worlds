// Avatar registry — maps each AvatarStyle to its renderer.
// Used by PresetAvatar in ../PresetAvatars.tsx (Phase 1.3 split).

import type { ReactElement } from 'react'
import type { AvatarRenderProps, AvatarStyle } from './shared'

import { ExplorerAvatar } from './Explorer'
import { WizardAvatar } from './Wizard'
import { AstronautAvatar } from './Astronaut'
import { PirateAvatar } from './Pirate'
import { NinjaAvatar } from './Ninja'
import { FairyAvatar } from './Fairy'
import { RobotAvatar } from './Robot'
import { SuperheroAvatar } from './Superhero'
import { UnicornAvatar } from './Unicorn'
import { ScientistAvatar } from './Scientist'
import { DragonAvatar } from './Dragon'
import { MermaidAvatar } from './Mermaid'

export type AvatarRenderer = (props: AvatarRenderProps) => ReactElement

export const avatarRenderers: Record<AvatarStyle, AvatarRenderer> = {
  explorer: ExplorerAvatar,
  wizard: WizardAvatar,
  astronaut: AstronautAvatar,
  pirate: PirateAvatar,
  ninja: NinjaAvatar,
  fairy: FairyAvatar,
  robot: RobotAvatar,
  superhero: SuperheroAvatar,
  unicorn: UnicornAvatar,
  scientist: ScientistAvatar,
  dragon: DragonAvatar,
  mermaid: MermaidAvatar,
}

export type { AvatarStyle, AvatarEmotion, AvatarRenderProps } from './shared'
