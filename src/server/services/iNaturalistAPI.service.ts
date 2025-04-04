
const API_URL = "https://api.inaturalist.org/v1/"

enum ENDPOINT {
    TAXA = "taxa",
    PLACES = "places",
    PHOTOS = "photos",
}

type queryINatParams = {
    type: ENDPOINT,
    params: {}
}

const fetchData = ({type,params}:queryINatParams) => {
    const searchParams = new URLSearchParams(params).toString();
    const queryUrl = `${API_URL}${type}?${searchParams}`;
}

const iNaturalistAPIService = {fetchData}

export default iNaturalistAPIService
