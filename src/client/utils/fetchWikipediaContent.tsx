import axios from "axios";

export default async function fetchWikipediaContent(title: string) {
    try {
        const {data} = await axios.get(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`);
        return {
            extract: data.extract,
            image: data.thumbnail?.source || null,
            fullUrl: data.content_urls?.desktop?.page || `https://en.wikipedia.org/wiki/${encodeURIComponent(title)}`,
        };
    } catch (error) {
        console.error("Failed to fetch Wikipedia content:", error);
        return null;
    }
}
