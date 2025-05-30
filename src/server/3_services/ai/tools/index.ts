import { getCurrentDateTool, getDateInfoTool } from './date-tools.js'
import { getINatTaxonData, getINatObservationData } from './taxonomic-data-tools.js'
import { getGeoLocationResults } from './geolocation-tools.js'

// Export individual tools
export { getCurrentDateTool, getDateInfoTool, getINatTaxonData, getGeoLocationResults }

// Export tool collections
export const dateTools = {
    getCurrentDate: getCurrentDateTool,
    getDateInfo: getDateInfoTool,
}

export const taxonomicDataTools = {
    getINatTaxonData: getINatTaxonData,
    getINatObservationData: getINatObservationData,
}

export const geolocationTools = {
    getGeoLocationResults: getGeoLocationResults,
}

export const allTools = {
    ...dateTools,
    ...taxonomicDataTools,
    ...geolocationTools,
}
