import { PieChart } from 'react-minimal-pie-chart'
import { useEffect, useState } from 'react'

export const TaxaPieChart = ({
    found,
    total,
    questStatus,
}: {
    found: number
    total: number
    questStatus?: string
}) => {
    const [isAnimating, setIsAnimating] = useState(false)
    const [prevFound, setPrevFound] = useState(found)

    useEffect(() => {
        if (prevFound !== found) {
            setIsAnimating(true)
            setPrevFound(found)
            const timer = setTimeout(() => setIsAnimating(false), 600)
            return () => clearTimeout(timer)
        }
    }, [found, prevFound])

    const data = [
        { title: 'Found', value: found, color: '#4ade80' },
        { title: 'Not Found', value: total - found, color: '#f1f5f9' },
    ]
    const isComplete = found === total

    return (
        <div
            className={`w-full h-full relative ${isAnimating ? 'chart-scale' : ''}`}
        >
            <PieChart
                data={data}
                lineWidth={30} // Wider band (30% of radius)
                paddingAngle={isComplete ? 0 : 5}
                startAngle={-90} // Start from top
                animate={true}
                animationDuration={500}
                labelStyle={{ fontSize: '0px' }} // Hide default labels
                style={{ width: '100%', height: '100%' }}
            />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center text-emerald-50">
                <div className="absolute -inset-2 rounded-full bg-emerald-600"></div>
                <div className="relative font-heading flex text-shadow-md flex-col items-center gap-0 -rotate-8 scale-110 w-20 h-20 pt-3">
                    <div>
                        <span className='text-3xl font-bold'>{found}</span>
                        <span className='text-sm mx-1'>/</span>
                        <span className="text-lg">{total}</span>
                    </div>
                    <span className="text-xs">found</span>
                </div>
            </div>
        </div>
    )
}
