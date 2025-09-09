import { FaBacteria, FaBug, FaKiwiBird, FaPaw, FaSeedling } from 'react-icons/fa'
import { GiGecko } from 'react-icons/gi'
import { TbMushroomFilled } from 'react-icons/tb'
import { IconType } from 'react-icons'

export function getKingdomIcon(kingdom: string): IconType {
    const icons: Record<string, IconType> = {
        Plantae: FaSeedling,
        Aves: FaKiwiBird,
        Insecta: FaBug,
        Reptilia: GiGecko,
        Mammalia: FaPaw,
        Animalia: FaPaw,
        Fungi: TbMushroomFilled,
        Chromista: FaBacteria,
        Protozoa: FaBacteria,
        Bacteria: FaBacteria,
        Archaea: FaBacteria,
    }
    return icons[kingdom] || FaPaw // Default icon if kingdom not found
}

export default getKingdomIcon