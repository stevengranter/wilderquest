import { FaBacteria, FaBug, FaKiwiBird, FaPaw, FaSeedling } from 'react-icons/fa'
import { JSX } from 'react'
import { GiGecko } from 'react-icons/gi'
import { TbMushroomFilled } from 'react-icons/tb'

const getKingdomIcon = (kingdom: string) => {
    const icons: Record<string, string | JSX.Element> = {
        Plantae: <FaSeedling />,
        Aves: <FaKiwiBird />,
        Insecta: <FaBug />,
        Reptilia: <GiGecko />,
        Mammalia: <FaPaw />,
        Animalia: <FaPaw />,
        Fungi: <TbMushroomFilled />,
        Chromista: <FaBacteria />,
        Protozoa: <FaBacteria />,
        Bacteria: <FaBacteria />,
        Archaea: <FaBacteria />,
    }
    return icons[kingdom] || '🔬'
}

export default getKingdomIcon
