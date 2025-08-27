import { Cell, Pie, PieChart, ResponsiveContainer } from 'recharts'

export const TaxaPieChart = ({
    found,
    total,
}: {
    found: number
    total: number
}) => {
    const data = [
        { name: 'Found', value: found },
        { name: 'Not Found', value: total - found },
    ]
    const COLORS = ['#4ade80', '#f1f5f9'] // green-400, gray-200
    const isComplete = found === total

    return (
        <div className="w-full h-full relative">
            <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                    <Pie
                        data={data}
                        cx="50%"
                        cy="50%"
                        innerRadius="60%"
                        outerRadius="80%"
                        fill="#8884d8"
                        paddingAngle={isComplete ? 0 : 5}
                        dataKey="value"
                    >
                        {data.map((entry, index) => (
                            <Cell
                                key={`cell-${index}`}
                                fill={COLORS[index % COLORS.length]}
                            />
                        ))}
                    </Pie>
                </PieChart>
            </ResponsiveContainer>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center">
                <div className="text-5xl font-bold">{found}</div>
                <div className="text-xl text-muted-foreground">of {total}</div>
            </div>
        </div>
    )
}
