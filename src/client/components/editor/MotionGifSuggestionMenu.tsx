import {useEffect, useState} from 'react'

type MotionGifSuggestionMenuProps = {
    columns: number
    selectedIndex: number
}

type GifItem = {
    url: string
}

export default function MotionGifSuggestionMenu({
                                                    ...props
}: MotionGifSuggestionMenuProps) {
    const [gifList, setGifList] = useState<GifItem[]>([])
    useEffect(() => {
        fetch('api/gifs')
            .then((res) => res.json())
            .then((data) => setGifList(data))
    }, [])

    return (
        gifList && (
            <div
                className={'gif-picker'}
                style={{
                    gridTemplateColumns: `repeat(${props.columns || 1}, 1fr)`,
                }}
            >
                {gifList.map((item, index) => (
                    <div
                        className={`gif-picker-item ${
                            props.selectedIndex === index ? ' selected' : ''
                        }`}
                        onClick={() => {
                            console.log(props)
                        }}
                        key={index}
                    >
                        <img
                            src={item.url}
                            alt={item.url}
                            className='object-scale-down aspect-square'
                        />
                    </div>
                ))}
            </div>
        )
    )
}
