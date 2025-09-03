import { PieChart } from 'react-minimal-pie-chart'

export const TaxaPieChart = ({
    found,
    total,
}: {
    found: number
    total: number
}) => {
    const data = [
        { title: 'Found', value: found, color: '#4ade80' },
        { title: 'Not Found', value: total - found, color: '#f1f5f9' },
    ]
    const isComplete = found === total

    return (
        <div className="w-full h-full relative">
            <PieChart
                data={data}
                lineWidth={20} // Creates donut effect (20% of radius)
                paddingAngle={isComplete ? 0 : 5}
                startAngle={-90} // Start from top
                animate={true}
                animationDuration={500}
                labelStyle={{ fontSize: '0px' }} // Hide default labels
                style={{ width: '100%', height: '100%' }}
            />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center">
                <div className="text-5xl font-bold">{found}</div>
                <div className="text-xl text-muted-foreground">of {total}</div>
            </div>
        </div>
    )
}
