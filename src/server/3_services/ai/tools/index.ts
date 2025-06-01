import { getCurrentDateTool, getDateInfoTool } from './date-tools.js'
import { displayTaxonomicData, getINatObservationData } from './taxonomic-data-tools.js'
import {
    forwardGeocodeTool,
    reverseGeocodeTool,
    getLocationByIPTool,
    getUserLocationTool,
} from './geolocation-tools.js'

// Export individual tools
export { getCurrentDateTool, getDateInfoTool, displayTaxonomicData, forwardGeocodeTool }

// Export tool collections
export const dateTools = {
    getCurrentDate: getCurrentDateTool,
    getDateInfo: getDateInfoTool,
}

export const taxonomicDataTools = {
    displayTaxonomicData,
    getINatObservationData: getINatObservationData,
}

export const geolocationTools = {
    forwardGeocodeTool,
    reverseGeocodeTool,
    // getLocationByIPTool,
    getUserLocationTool,
}

export const allTools = {
    ...dateTools,
    ...taxonomicDataTools,
    ...geolocationTools,
}
