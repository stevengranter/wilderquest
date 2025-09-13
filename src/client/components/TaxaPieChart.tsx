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
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center">
                <div
                    className={`text-4xl font-bold font-heading text-primary transition-transform duration-300 ${isAnimating ? 'scale-110' : 'scale-100'}`}
                >
                    {found}
                </div>
                <div className="text-lg text-muted-foreground font-heading">
                    of {total} found
                </div>
            </div>
        </div>
    )
}
